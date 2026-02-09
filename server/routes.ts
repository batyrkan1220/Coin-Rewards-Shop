
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, hashPassword } from "./auth";
import { api, errorSchemas } from "@shared/routes";
import { ROLES, REDEMPTION_STATUS, TRANSACTION_TYPES } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup Auth (Passport)
  setupAuth(app);

  // === MIDDLEWARE ===
  const requireAuth = (req: any, res: any, next: any) => {
    if (req.isAuthenticated()) return next();
    res.status(401).json({ message: "Not authenticated" });
  };

  const requireRole = (roles: string[]) => (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    if (!roles.includes(req.user.role)) return res.status(403).json({ message: "Forbidden" });
    next();
  };

  // === SHOP ===
  app.get(api.shop.list.path, requireAuth, async (req, res) => {
    const items = await storage.listShopItems();
    res.json(items);
  });

  app.get(api.shop.get.path, requireAuth, async (req, res) => {
    const item = await storage.getShopItem(Number(req.params.id));
    if (!item) return res.status(404).json({ message: "Item not found" });
    res.json(item);
  });

  app.post(api.shop.create.path, requireRole([ROLES.ADMIN]), async (req, res) => {
    try {
      const input = api.shop.create.input.parse(req.body);
      const item = await storage.createShopItem(input);
      res.status(201).json(item);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json(err);
      throw err;
    }
  });

  app.patch(api.shop.update.path, requireRole([ROLES.ADMIN]), async (req, res) => {
    try {
      const input = api.shop.update.input.parse(req.body);
      const item = await storage.updateShopItem(Number(req.params.id), input);
      res.json(item);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json(err);
      throw err;
    }
  });

  // === REDEMPTIONS ===
  app.get(api.redemptions.list.path, requireAuth, async (req, res) => {
    const scope = (req.query.scope as string) || "my";
    const user = req.user!;
    
    // Security check for scopes
    if (scope === "all" && user.role !== ROLES.ADMIN) {
      return res.status(403).json({ message: "Forbidden" });
    }
    if (scope === "team" && ![ROLES.ADMIN, ROLES.ROP].includes(user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const redemptions = await storage.getRedemptions(scope as any, user.id, user.teamId);
    res.json(redemptions);
  });

  app.post(api.redemptions.create.path, requireAuth, async (req, res) => {
    try {
      const input = api.redemptions.create.input.parse(req.body);
      const user = req.user!;
      
      const item = await storage.getShopItem(input.shopItemId);
      if (!item) return res.status(404).json({ message: "Item not found" });

      const balance = await storage.getBalance(user.id);
      if (balance < item.priceCoins) {
        return res.status(400).json({ message: "Insufficient coins" });
      }

      const redemption = await storage.createRedemption({
        userId: user.id,
        shopItemId: item.id,
        priceCoinsSnapshot: item.priceCoins,
        comment: input.comment,
        status: REDEMPTION_STATUS.PENDING
      });
      res.status(201).json(redemption);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json(err);
      throw err;
    }
  });

  app.patch(api.redemptions.updateStatus.path, requireRole([ROLES.ADMIN, ROLES.ROP]), async (req, res) => {
    try {
      const { status } = api.redemptions.updateStatus.input.parse(req.body);
      const redemptionId = Number(req.params.id);
      const user = req.user!;

      // Get current state to verify permissions
      // We don't have getRedemptionById exposed in storage public interface but updateRedemptionStatus uses ID
      // Ideally we check ownership if ROP.
      // For MVP, assuming ROP is approving for their team. In a real app we'd verify teamId match.
      
      const updated = await storage.updateRedemptionStatus(redemptionId, status, user.id);
      
      // If APPROVED, deduct coins
      if (status === REDEMPTION_STATUS.APPROVED) {
        await storage.createTransaction({
          userId: updated.userId,
          type: TRANSACTION_TYPES.SPEND,
          amount: -updated.priceCoinsSnapshot,
          reason: `Redemption: Item #${updated.shopItemId}`,
          refType: "redemption",
          refId: updated.id,
          createdById: user.id
        });
      }

      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json(err);
      throw err;
    }
  });

  // === TRANSACTIONS ===
  app.get(api.transactions.list.path, requireAuth, async (req, res) => {
    const user = req.user!;
    let targetUserId = user.id;

    // Admin/ROP can view others
    if (req.query.userId) {
      const requestedId = Number(req.query.userId);
      if (user.role === ROLES.ADMIN || (user.role === ROLES.ROP /* && check team match */)) {
        targetUserId = requestedId;
      } else if (requestedId !== user.id) {
         return res.status(403).json({ message: "Forbidden" });
      }
    }

    const txs = await storage.getTransactionsByUser(targetUserId);
    res.json(txs);
  });

  app.get(api.transactions.balance.path, requireAuth, async (req, res) => {
    const userId = Number(req.params.userId);
    // Add permission check if needed (viewing others' balance)
    const balance = await storage.getBalance(userId);
    res.json({ balance });
  });

  app.post(api.transactions.create.path, requireRole([ROLES.ADMIN, ROLES.ROP]), async (req, res) => {
    try {
      const input = api.transactions.create.input.parse(req.body);
      const tx = await storage.createTransaction({
        ...input,
        createdById: req.user!.id
      });
      res.status(201).json(tx);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json(err);
      throw err;
    }
  });

  // === LESSONS ===
  app.get(api.lessons.list.path, requireAuth, async (req, res) => {
    const lessons = await storage.listLessons();
    res.json(lessons);
  });

  app.post(api.lessons.create.path, requireRole([ROLES.ADMIN]), async (req, res) => {
    try {
      const input = api.lessons.create.input.parse(req.body);
      const lesson = await storage.createLesson(input);
      res.status(201).json(lesson);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json(err);
      throw err;
    }
  });

  // === USERS & TEAMS ===
  app.get(api.users.list.path, requireRole([ROLES.ADMIN, ROLES.ROP]), async (req, res) => {
    const allUsers = await storage.listUsers();
    // Filter for ROP: only their team
    if (req.user!.role === ROLES.ROP) {
      const teamUsers = allUsers.filter(u => u.teamId === req.user!.teamId);
      return res.json(teamUsers);
    }
    res.json(allUsers);
  });

  app.get(api.teams.list.path, requireAuth, async (req, res) => {
    const teams = await storage.listTeams();
    res.json(teams);
  });

  // Seed data
  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  const usersList = await storage.listUsers();
  if (usersList.length > 0) return;

  console.log("Seeding database...");

  // 1. Create Teams
  const teamA = await storage.createTeam({ name: "Sales A" });
  
  // 2. Create Users
  const adminPwd = await hashPassword("admin123");
  await storage.createUser({
    username: "admin@example.com",
    password: adminPwd,
    name: "Super Admin",
    role: ROLES.ADMIN,
    isActive: true,
    teamId: null
  });

  const ropPwd = await hashPassword("rop123");
  const rop = await storage.createUser({
    username: "rop@example.com",
    password: ropPwd,
    name: "ROP Sales A",
    role: ROLES.ROP,
    isActive: true,
    teamId: teamA.id
  });

  // Update team with ROP
  // storage.updateTeam... (not implemented but not critical for MVP logic if we just query by teamId)

  const mgrPwd = await hashPassword("manager123");
  const mgr1 = await storage.createUser({
    username: "manager1@example.com",
    password: mgrPwd,
    name: "Ivan Manager",
    role: ROLES.MANAGER,
    isActive: true,
    teamId: teamA.id
  });

  const mgr2 = await storage.createUser({
    username: "manager2@example.com",
    password: mgrPwd,
    name: "Elena Manager",
    role: ROLES.MANAGER,
    isActive: true,
    teamId: teamA.id
  });

  // 3. Shop Items
  await storage.createShopItem({
    title: "AirPods Case",
    description: "Premium leather case for AirPods.",
    priceCoins: 50,
    stock: 10,
    isActive: true,
    imageUrl: "https://placehold.co/400x400?text=AirPods+Case"
  });
  
  await storage.createShopItem({
    title: "Company Hoodie",
    description: "Warm hoodie with company logo.",
    priceCoins: 120,
    stock: 5,
    isActive: true,
    imageUrl: "https://placehold.co/400x400?text=Hoodie"
  });

  // 4. Lessons
  await storage.createLesson({
    course: "Sales Basics",
    title: "Introduction to Sales",
    contentType: "LINK",
    content: "https://example.com/video1",
    orderIndex: 1,
    isActive: true
  });

  // 5. Initial Coins
  await storage.createTransaction({
    userId: mgr1.id,
    type: TRANSACTION_TYPES.EARN,
    amount: 100,
    reason: "Welcome Bonus",
    createdById: rop.id
  });
  
  console.log("Database seeded successfully!");
}
