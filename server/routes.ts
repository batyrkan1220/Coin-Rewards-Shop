import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, hashPassword } from "./auth";
import { api } from "@shared/routes";
import { ROLES, REDEMPTION_STATUS, TRANSACTION_TYPES, TRANSACTION_STATUS } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  setupAuth(app);

  const requireAuth = (req: any, res: any, next: any) => {
    if (req.isAuthenticated()) return next();
    res.status(401).json({ message: "Не авторизован" });
  };

  const requireRole = (roles: string[]) => (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Не авторизован" });
    if (!roles.includes(req.user.role)) return res.status(403).json({ message: "Доступ запрещён" });
    next();
  };

  const audit = async (actorId: number, action: string, entity: string, entityId?: number, details?: any) => {
    try {
      await storage.createAuditLog({ actorId, action, entity, entityId, details });
    } catch (e) {
      console.error("Audit log error:", e);
    }
  };

  // === SHOP ===
  app.get(api.shop.list.path, requireAuth, async (req, res) => {
    const items = await storage.listShopItems();
    res.json(items);
  });

  app.get(api.shop.get.path, requireAuth, async (req, res) => {
    const item = await storage.getShopItem(Number(req.params.id));
    if (!item) return res.status(404).json({ message: "Товар не найден" });
    res.json(item);
  });

  app.post(api.shop.create.path, requireRole([ROLES.ADMIN]), async (req, res) => {
    try {
      const input = api.shop.create.input.parse(req.body);
      const item = await storage.createShopItem(input);
      await audit(req.user!.id, "CREATE_SHOP_ITEM", "shopItem", item.id, { title: item.title });
      res.status(201).json(item);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0]?.message });
      throw err;
    }
  });

  app.patch(api.shop.update.path, requireRole([ROLES.ADMIN]), async (req, res) => {
    try {
      const input = api.shop.update.input.parse(req.body);
      const item = await storage.updateShopItem(Number(req.params.id), input);
      await audit(req.user!.id, "UPDATE_SHOP_ITEM", "shopItem", item.id, input);
      res.json(item);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0]?.message });
      throw err;
    }
  });

  // === REDEMPTIONS ===
  app.get(api.redemptions.list.path, requireAuth, async (req, res) => {
    const scope = (req.query.scope as string) || "my";
    const user = req.user!;

    if (scope === "all" && user.role !== ROLES.ADMIN) {
      return res.status(403).json({ message: "Доступ запрещён" });
    }
    if (scope === "team" && ![ROLES.ADMIN, ROLES.ROP].includes(user.role)) {
      return res.status(403).json({ message: "Доступ запрещён" });
    }

    const result = await storage.getRedemptions(scope as any, user.id, user.teamId);
    res.json(result);
  });

  app.post(api.redemptions.create.path, requireAuth, async (req, res) => {
    try {
      const input = api.redemptions.create.input.parse(req.body);
      const user = req.user!;

      const item = await storage.getShopItem(input.shopItemId);
      if (!item) return res.status(404).json({ message: "Товар не найден" });

      const balance = await storage.getBalance(user.id);
      if (balance < item.priceCoins) {
        return res.status(400).json({ message: "Недостаточно монет" });
      }

      const redemption = await storage.createRedemption({
        userId: user.id,
        shopItemId: item.id,
        priceCoinsSnapshot: item.priceCoins,
        comment: input.comment,
        status: REDEMPTION_STATUS.PENDING
      });

      await storage.createTransaction({
        userId: user.id,
        type: TRANSACTION_TYPES.SPEND,
        amount: -item.priceCoins,
        reason: `Магазин: ${item.title}`,
        refType: "redemption",
        refId: redemption.id,
        createdById: user.id
      });

      res.status(201).json(redemption);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0]?.message });
      throw err;
    }
  });

  app.patch(api.redemptions.updateStatus.path, requireRole([ROLES.ADMIN, ROLES.ROP]), async (req, res) => {
    try {
      const { status } = api.redemptions.updateStatus.input.parse(req.body);
      const redemptionId = Number(req.params.id);
      const user = req.user!;

      const updated = await storage.updateRedemptionStatus(redemptionId, status, user.id);

      if (status === REDEMPTION_STATUS.REJECTED) {
        await storage.createTransaction({
          userId: updated.userId,
          type: TRANSACTION_TYPES.EARN,
          amount: updated.priceCoinsSnapshot,
          reason: `Возврат: заявка #${updated.id} отклонена`,
          refType: "redemption",
          refId: updated.id,
          createdById: user.id
        });
      }

      await audit(user.id, `REDEMPTION_${status}`, "redemption", updated.id, { status });
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0]?.message });
      throw err;
    }
  });

  // === TRANSACTIONS ===
  app.get(api.transactions.list.path, requireAuth, async (req, res) => {
    const user = req.user!;
    let targetUserId = user.id;

    if (req.query.userId) {
      const requestedId = Number(req.query.userId);
      if (user.role === ROLES.ADMIN || user.role === ROLES.ROP) {
        targetUserId = requestedId;
      } else if (requestedId !== user.id) {
        return res.status(403).json({ message: "Доступ запрещён" });
      }
    }

    const txs = await storage.getTransactionsByUser(targetUserId);
    res.json(txs);
  });

  app.get(api.transactions.listAll.path, requireRole([ROLES.ADMIN]), async (req, res) => {
    const txs = await storage.getAllTransactions();
    res.json(txs);
  });

  app.get(api.transactions.balance.path, requireAuth, async (req, res) => {
    const userId = Number(req.params.userId);
    const balance = await storage.getBalance(userId);
    res.json({ balance });
  });

  app.post(api.transactions.create.path, requireRole([ROLES.ADMIN, ROLES.ROP]), async (req, res) => {
    try {
      const input = api.transactions.create.input.parse(req.body);
      const isAdmin = req.user!.role === ROLES.ADMIN;
      const status = isAdmin ? TRANSACTION_STATUS.APPROVED : TRANSACTION_STATUS.PENDING;
      const tx = await storage.createTransaction({
        ...input,
        status,
        createdById: req.user!.id
      });
      await audit(req.user!.id, "CREATE_TRANSACTION", "coinTransaction", tx.id, {
        userId: input.userId, amount: input.amount, type: input.type, reason: input.reason, status
      });
      res.status(201).json(tx);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0]?.message });
      throw err;
    }
  });

  app.post(api.transactions.zeroOut.path, requireRole([ROLES.ADMIN, ROLES.ROP]), async (req, res) => {
    try {
      const { userId } = api.transactions.zeroOut.input.parse(req.body);
      const currentBalance = await storage.getBalance(userId);

      if (currentBalance === 0) {
        return res.status(400).json({ message: "Баланс уже равен 0" });
      }

      const isAdmin = req.user!.role === ROLES.ADMIN;
      const txStatus = isAdmin ? TRANSACTION_STATUS.APPROVED : TRANSACTION_STATUS.PENDING;
      const tx = await storage.createTransaction({
        userId,
        type: TRANSACTION_TYPES.ADJUST,
        amount: -currentBalance,
        reason: "Обнуление",
        status: txStatus,
        createdById: req.user!.id
      });
      await audit(req.user!.id, "ZERO_OUT", "coinTransaction", tx.id, {
        userId, previousBalance: currentBalance
      });
      res.status(201).json(tx);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0]?.message });
      throw err;
    }
  });

  app.get(api.transactions.pending.path, requireRole([ROLES.ADMIN]), async (req, res) => {
    const pending = await storage.getPendingTransactions();
    res.json(pending);
  });

  app.patch(api.transactions.updateStatus.path, requireRole([ROLES.ADMIN]), async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { status } = api.transactions.updateStatus.input.parse(req.body);
      const tx = await storage.getTransaction(id);
      if (!tx) return res.status(404).json({ message: "Транзакция не найдена" });
      if (tx.status !== TRANSACTION_STATUS.PENDING) {
        return res.status(400).json({ message: "Можно изменить статус только ожидающих транзакций" });
      }
      const updated = await storage.updateTransactionStatus(id, status);
      await audit(req.user!.id, status === TRANSACTION_STATUS.APPROVED ? "APPROVE_TRANSACTION" : "REJECT_TRANSACTION", "coinTransaction", id, {
        userId: tx.userId, amount: tx.amount, type: tx.type
      });
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0]?.message });
      throw err;
    }
  });

  // === LESSONS ===
  app.get(api.lessons.list.path, requireAuth, async (req, res) => {
    const allLessons = await storage.listLessons();
    res.json(allLessons);
  });

  app.post(api.lessons.create.path, requireRole([ROLES.ADMIN]), async (req, res) => {
    try {
      const input = api.lessons.create.input.parse(req.body);
      const lesson = await storage.createLesson(input);
      await audit(req.user!.id, "CREATE_LESSON", "lesson", lesson.id, { title: lesson.title });
      res.status(201).json(lesson);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0]?.message });
      throw err;
    }
  });

  app.patch(api.lessons.update.path, requireRole([ROLES.ADMIN]), async (req, res) => {
    try {
      const input = api.lessons.update.input.parse(req.body);
      const lesson = await storage.updateLesson(Number(req.params.id), input);
      await audit(req.user!.id, "UPDATE_LESSON", "lesson", lesson.id, input);
      res.json(lesson);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0]?.message });
      throw err;
    }
  });

  // === USERS ===
  app.get(api.users.list.path, requireRole([ROLES.ADMIN, ROLES.ROP]), async (req, res) => {
    const allUsers = await storage.listUsers();
    if (req.user!.role === ROLES.ROP) {
      const teamUsers = allUsers.filter(u => u.teamId === req.user!.teamId);
      return res.json(teamUsers);
    }
    res.json(allUsers);
  });

  app.post(api.users.create.path, requireRole([ROLES.ADMIN]), async (req, res) => {
    try {
      const input = api.users.create.input.parse(req.body);
      const existing = await storage.getUserByUsername(input.username);
      if (existing) {
        return res.status(400).json({ message: "Пользователь с таким email уже существует" });
      }

      const hashedPassword = await hashPassword(input.password);
      const user = await storage.createUser({
        ...input,
        password: hashedPassword,
        isActive: input.isActive ?? true,
        teamId: input.teamId ?? null,
      });
      await audit(req.user!.id, "CREATE_USER", "user", user.id, { name: user.name, role: user.role });
      res.status(201).json(user);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0]?.message });
      throw err;
    }
  });

  app.patch(api.users.update.path, requireRole([ROLES.ADMIN]), async (req, res) => {
    try {
      const input = api.users.update.input.parse(req.body);
      const updates: any = { ...input };

      if (input.password) {
        updates.password = await hashPassword(input.password);
      }

      const user = await storage.updateUser(Number(req.params.id), updates);
      await audit(req.user!.id, "UPDATE_USER", "user", user.id, {
        ...(input.role && { role: input.role }),
        ...(input.teamId !== undefined && { teamId: input.teamId }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
        ...(input.name && { name: input.name }),
      });
      res.json(user);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0]?.message });
      throw err;
    }
  });

  // === TEAMS ===
  app.get(api.teams.list.path, requireAuth, async (req, res) => {
    const allTeams = await storage.listTeams();
    res.json(allTeams);
  });

  app.post(api.teams.create.path, requireRole([ROLES.ADMIN]), async (req, res) => {
    try {
      const input = api.teams.create.input.parse(req.body);
      const team = await storage.createTeam(input);
      await audit(req.user!.id, "CREATE_TEAM", "team", team.id, { name: team.name });
      res.status(201).json(team);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0]?.message });
      throw err;
    }
  });

  app.patch(api.teams.update.path, requireRole([ROLES.ADMIN]), async (req, res) => {
    try {
      const input = api.teams.update.input.parse(req.body);
      const team = await storage.updateTeam(Number(req.params.id), input);
      await audit(req.user!.id, "UPDATE_TEAM", "team", team.id, input);
      res.json(team);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0]?.message });
      throw err;
    }
  });

  // === AUDIT ===
  app.get(api.audit.list.path, requireRole([ROLES.ADMIN]), async (req, res) => {
    const logs = await storage.listAuditLogs();
    res.json(logs);
  });

  // Seed data
  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  const usersList = await storage.listUsers();
  if (usersList.length > 0) return;

  console.log("Seeding database...");

  const teamA = await storage.createTeam({ name: "Sales A" });
  const teamB = await storage.createTeam({ name: "Sales B" });

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
    name: "Alikhan ROP",
    role: ROLES.ROP,
    isActive: true,
    teamId: teamA.id
  });

  const mgrPwd = await hashPassword("manager123");
  const mgr1 = await storage.createUser({
    username: "manager1@example.com",
    password: mgrPwd,
    name: "Ivan Petrov",
    role: ROLES.MANAGER,
    isActive: true,
    teamId: teamA.id
  });

  const mgr2 = await storage.createUser({
    username: "manager2@example.com",
    password: mgrPwd,
    name: "Elena Sidorova",
    role: ROLES.MANAGER,
    isActive: true,
    teamId: teamA.id
  });

  await storage.createShopItem({
    title: "AirPods Case",
    description: "Premium leather case for AirPods Pro.",
    priceCoins: 50,
    stock: 10,
    isActive: true,
    imageUrl: "https://placehold.co/400x400?text=AirPods+Case"
  });

  await storage.createShopItem({
    title: "Company Hoodie",
    description: "Warm hoodie with company logo, sizes S-XL.",
    priceCoins: 120,
    stock: 5,
    isActive: true,
    imageUrl: "https://placehold.co/400x400?text=Hoodie"
  });

  await storage.createShopItem({
    title: "Wireless Mouse",
    description: "Ergonomic wireless mouse Logitech MX.",
    priceCoins: 80,
    stock: 8,
    isActive: true,
    imageUrl: "https://placehold.co/400x400?text=Mouse"
  });

  await storage.createShopItem({
    title: "Bluetooth Speaker",
    description: "Portable JBL speaker for the office.",
    priceCoins: 200,
    stock: 3,
    isActive: true,
    imageUrl: "https://placehold.co/400x400?text=Speaker"
  });

  await storage.createShopItem({
    title: "Gift Card 5000 KZT",
    description: "Kaspi gift card, 5000 tenge.",
    priceCoins: 150,
    stock: 20,
    isActive: true,
    imageUrl: "https://placehold.co/400x400?text=Gift+Card"
  });

  await storage.createShopItem({
    title: "Day Off Voucher",
    description: "Extra day off, approved by HR.",
    priceCoins: 300,
    stock: 2,
    isActive: true,
    imageUrl: "https://placehold.co/400x400?text=Day+Off"
  });

  await storage.createLesson({
    course: "Sales Basics",
    title: "Introduction to Sales",
    contentType: "LINK",
    content: "https://example.com/video1",
    orderIndex: 1,
    isActive: true
  });

  await storage.createLesson({
    course: "Sales Basics",
    title: "Client Communication",
    contentType: "LINK",
    content: "https://example.com/video2",
    orderIndex: 2,
    isActive: true
  });

  await storage.createLesson({
    course: "Advanced Techniques",
    title: "Closing Deals",
    contentType: "LINK",
    content: "https://example.com/video3",
    orderIndex: 3,
    isActive: true
  });

  await storage.createTransaction({
    userId: mgr1.id,
    type: TRANSACTION_TYPES.EARN,
    amount: 200,
    reason: "Welcome Bonus",
    createdById: rop.id
  });

  await storage.createTransaction({
    userId: mgr2.id,
    type: TRANSACTION_TYPES.EARN,
    amount: 150,
    reason: "Welcome Bonus",
    createdById: rop.id
  });

  console.log("Database seeded successfully!");
}
