import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, hashPassword, sanitizeUser } from "./auth";
import { api } from "@shared/routes";
import { ROLES, REDEMPTION_STATUS, TRANSACTION_TYPES, TRANSACTION_STATUS } from "@shared/schema";
import { z } from "zod";
import { randomBytes } from "crypto";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  setupAuth(app);
  registerObjectStorageRoutes(app);

  const requireAuth = (req: any, res: any, next: any) => {
    if (req.isAuthenticated()) return next();
    res.status(401).json({ message: "Не авторизован" });
  };

  const requireRole = (roles: string[]) => (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Не авторизован" });
    if (!roles.includes(req.user.role)) return res.status(403).json({ message: "Доступ запрещён" });
    next();
  };

  const requireSuperAdmin = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Не авторизован" });
    if (req.user.role !== ROLES.SUPER_ADMIN) return res.status(403).json({ message: "Доступ запрещён" });
    next();
  };

  const getCompanyId = (req: any): number | undefined => {
    return req.user?.companyId || undefined;
  };

  const audit = async (actorId: number, action: string, entity: string, entityId?: number, details?: any, companyId?: number | null) => {
    try {
      await storage.createAuditLog({ actorId, action, entity, entityId, details, companyId });
    } catch (e) {
      console.error("Audit log error:", e);
    }
  };

  // ==========================================
  // SUPER ADMIN ROUTES
  // ==========================================

  app.get(api.superAdmin.stats.path, requireSuperAdmin, async (_req, res) => {
    const companiesList = await storage.listCompanies();
    const allUsers = await storage.listUsers();
    res.json({
      totalCompanies: companiesList.length,
      activeCompanies: companiesList.filter(c => c.isActive).length,
      totalUsers: allUsers.filter(u => u.role !== ROLES.SUPER_ADMIN).length,
    });
  });

  app.get(api.superAdmin.companies.list.path, requireSuperAdmin, async (_req, res) => {
    const companiesList = await storage.listCompanies();
    res.json(companiesList);
  });

  app.post(api.superAdmin.companies.create.path, requireSuperAdmin, async (req, res) => {
    try {
      const input = api.superAdmin.companies.create.input.parse(req.body);
      const slug = input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `company-${Date.now()}`;
      const company = await storage.createCompany({
        name: input.name,
        subdomain: slug + "-" + Date.now(),
        planId: input.planId ?? null,
        supportEmail: null,
        isActive: true,
      });

      let adminCredentials: { username: string; password: string; name: string } | null = null;
      if (input.adminUsername && input.adminPassword && input.adminName) {
        const existingUser = await storage.getUserByUsername(input.adminUsername);
        if (existingUser) {
          return res.status(400).json({ message: "Пользователь с таким email уже существует" });
        }
        const hashedPwd = await hashPassword(input.adminPassword);
        await storage.createUser({
          username: input.adminUsername,
          password: hashedPwd,
          name: input.adminName,
          role: ROLES.ADMIN,
          companyId: company.id,
          isActive: true,
          teamId: null,
        });
        adminCredentials = { username: input.adminUsername, password: input.adminPassword, name: input.adminName };
      }

      await audit(req.user!.id, "CREATE_COMPANY", "company", company.id, { name: company.name });
      res.status(201).json({ company, adminCredentials });
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0]?.message });
      throw err;
    }
  });

  app.patch(api.superAdmin.companies.update.path, requireSuperAdmin, async (req, res) => {
    try {
      const input = api.superAdmin.companies.update.input.parse(req.body);
      const company = await storage.updateCompany(Number(req.params.id), input);
      await audit(req.user!.id, "UPDATE_COMPANY", "company", company.id, input);
      res.json(company);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0]?.message });
      throw err;
    }
  });

  app.patch("/api/super/companies/:id/admin-credentials", requireSuperAdmin, async (req, res) => {
    try {
      const companyId = Number(req.params.id);
      const input = api.superAdmin.companies.updateAdminCredentials.input.parse(req.body);

      if (!input.newEmail && !input.newPassword) {
        return res.status(400).json({ message: "Укажите новый email или пароль" });
      }

      const companyUsers = await storage.listUsers(companyId);
      const adminUser = companyUsers.find(u => u.role === ROLES.ADMIN);
      if (!adminUser) {
        return res.status(404).json({ message: "Администратор компании не найден" });
      }

      const updates: any = {};
      if (input.newEmail) {
        const existing = await storage.getUserByUsername(input.newEmail);
        if (existing && existing.id !== adminUser.id) {
          return res.status(400).json({ message: "Пользователь с таким email уже существует" });
        }
        updates.username = input.newEmail;
      }
      if (input.newPassword) {
        updates.password = await hashPassword(input.newPassword);
      }

      const updated = await storage.updateUser(adminUser.id, updates);
      await audit(req.user!.id, "SUPER_UPDATE_ADMIN_CREDENTIALS", "user", updated.id, {
        companyId,
        ...(input.newEmail && { emailChanged: true }),
        ...(input.newPassword && { passwordChanged: true }),
      });
      res.json(sanitizeUser(updated));
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0]?.message });
      throw err;
    }
  });

  app.get(api.superAdmin.plans.list.path, requireSuperAdmin, async (_req, res) => {
    const plans = await storage.listPlans();
    res.json(plans);
  });

  app.post(api.superAdmin.plans.create.path, requireSuperAdmin, async (req, res) => {
    try {
      const input = api.superAdmin.plans.create.input.parse(req.body);
      const plan = await storage.createPlan({
        name: input.name,
        maxUsers: input.maxUsers,
        priceMonthly: input.priceMonthly,
        features: input.features ?? null,
        isActive: true,
      });
      await audit(req.user!.id, "CREATE_PLAN", "subscriptionPlan", plan.id, { name: plan.name });
      res.status(201).json(plan);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0]?.message });
      throw err;
    }
  });

  app.patch(api.superAdmin.plans.update.path, requireSuperAdmin, async (req, res) => {
    try {
      const input = api.superAdmin.plans.update.input.parse(req.body);
      const plan = await storage.updatePlan(Number(req.params.id), input);
      await audit(req.user!.id, "UPDATE_PLAN", "subscriptionPlan", plan.id, input);
      res.json(plan);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0]?.message });
      throw err;
    }
  });

  // ==========================================
  // PUBLIC PLANS (for registration page)
  // ==========================================
  app.get(api.plans.list.path, async (_req, res) => {
    const plans = await storage.listPlans();
    res.json(plans.filter(p => p.isActive));
  });

  // ==========================================
  // COMPANY REGISTRATION (public)
  // ==========================================
  app.post(api.registerCompany.path, async (req, res) => {
    try {
      const input = api.registerCompany.input.parse(req.body);

      const existingUser = await storage.getUserByUsername(input.adminEmail);
      if (existingUser) {
        return res.status(400).json({ message: "Пользователь с таким email уже существует" });
      }

      const plan = await storage.getPlan(input.planId);
      if (!plan || !plan.isActive) {
        return res.status(400).json({ message: "Выбранный тарифный план недоступен" });
      }

      const slug = input.companyName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `company-${Date.now()}`;
      const company = await storage.createCompany({
        name: input.companyName,
        subdomain: slug + "-" + Date.now(),
        planId: input.planId,
        supportEmail: null,
        isActive: true,
      });

      const hashedPwd = await hashPassword(input.adminPassword);
      const adminUser = await storage.createUser({
        username: input.adminEmail,
        password: hashedPwd,
        name: input.adminName,
        role: ROLES.ADMIN,
        companyId: company.id,
        gender: input.gender,
        isActive: true,
        teamId: null,
      });

      req.login(adminUser, (err: any) => {
        if (err) return res.status(500).json({ message: "Ошибка авторизации" });
        res.status(201).json(sanitizeUser(adminUser));
      });
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0]?.message });
      throw err;
    }
  });

  // ==========================================
  // COMPANY PROFILE (for ADMIN)
  // ==========================================
  app.get(api.company.get.path, requireRole([ROLES.ADMIN]), async (req, res) => {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(403).json({ message: "Компания не найдена" });
    const company = await storage.getCompany(companyId);
    if (!company) return res.status(404).json({ message: "Компания не найдена" });
    const plan = company.planId ? await storage.getPlan(company.planId) : null;
    const userCount = await storage.getUserCountByCompany(companyId);
    res.json({ ...company, plan, userCount });
  });

  app.patch(api.company.update.path, requireRole([ROLES.ADMIN]), async (req, res) => {
    try {
      const companyId = getCompanyId(req);
      if (!companyId) return res.status(403).json({ message: "Компания не найдена" });
      const input = api.company.update.input.parse(req.body);
      const company = await storage.updateCompany(companyId, input);
      await audit(req.user!.id, "UPDATE_COMPANY_PROFILE", "company", company.id, input, companyId);
      res.json(company);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0]?.message });
      throw err;
    }
  });

  app.patch("/api/company/credentials", requireRole([ROLES.ADMIN]), async (req, res) => {
    try {
      const input = api.company.updateCredentials.input.parse(req.body);

      if (!input.newEmail && !input.newPassword) {
        return res.status(400).json({ message: "Укажите новый email или пароль" });
      }

      const currentUser = await storage.getUser(req.user!.id);
      if (!currentUser) return res.status(404).json({ message: "Пользователь не найден" });

      const { scrypt, timingSafeEqual } = await import("crypto");
      const { promisify } = await import("util");
      const scryptAsync = promisify(scrypt);
      const [hashed, salt] = currentUser.password.split(".");
      const hashedBuf = Buffer.from(hashed, "hex");
      const suppliedBuf = (await scryptAsync(input.currentPassword, salt, 64)) as Buffer;
      if (!timingSafeEqual(hashedBuf, suppliedBuf)) {
        return res.status(400).json({ message: "Неверный текущий пароль" });
      }

      const updates: any = {};
      if (input.newEmail) {
        const existing = await storage.getUserByUsername(input.newEmail);
        if (existing && existing.id !== req.user!.id) {
          return res.status(400).json({ message: "Пользователь с таким email уже существует" });
        }
        updates.username = input.newEmail;
      }
      if (input.newPassword) {
        updates.password = await hashPassword(input.newPassword);
      }

      const updated = await storage.updateUser(req.user!.id, updates);
      await audit(req.user!.id, "UPDATE_CREDENTIALS", "user", updated.id, {
        ...(input.newEmail && { emailChanged: true }),
        ...(input.newPassword && { passwordChanged: true }),
      }, getCompanyId(req));
      res.json(sanitizeUser(updated));
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0]?.message });
      throw err;
    }
  });

  // ==========================================
  // COMPANY-SCOPED ROUTES
  // ==========================================

  // === SHOP ===
  app.get(api.shop.list.path, requireAuth, async (req, res) => {
    const items = await storage.listShopItems(getCompanyId(req));
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
      const item = await storage.createShopItem({ ...input, companyId: getCompanyId(req) ?? null });
      await audit(req.user!.id, "CREATE_SHOP_ITEM", "shopItem", item.id, { title: item.title }, getCompanyId(req));
      res.status(201).json(item);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0]?.message });
      throw err;
    }
  });

  app.patch(api.shop.update.path, requireRole([ROLES.ADMIN]), async (req, res) => {
    try {
      const input = api.shop.update.input.parse(req.body);
      const item = await storage.updateShopItem(Number(req.params.id), input, getCompanyId(req));
      await audit(req.user!.id, "UPDATE_SHOP_ITEM", "shopItem", item.id, input, getCompanyId(req));
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
    if (scope === "team" && ![ROLES.ADMIN, ROLES.ROP].includes(user.role as any)) {
      return res.status(403).json({ message: "Доступ запрещён" });
    }

    const result = await storage.getRedemptions(scope as any, user.id, user.teamId, getCompanyId(req));
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
        status: REDEMPTION_STATUS.PENDING,
        companyId: getCompanyId(req) ?? null,
      });

      await storage.createTransaction({
        userId: user.id,
        type: TRANSACTION_TYPES.SPEND,
        amount: -item.priceCoins,
        reason: `Магазин: ${item.title}`,
        refType: "redemption",
        refId: redemption.id,
        createdById: user.id,
        companyId: getCompanyId(req) ?? null,
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

      const updated = await storage.updateRedemptionStatus(redemptionId, status, user.id, getCompanyId(req));

      if (status === REDEMPTION_STATUS.REJECTED) {
        await storage.createTransaction({
          userId: updated.userId,
          type: TRANSACTION_TYPES.EARN,
          amount: updated.priceCoinsSnapshot,
          reason: `Возврат: заявка #${updated.id} отклонена`,
          refType: "redemption",
          refId: updated.id,
          createdById: user.id,
          companyId: getCompanyId(req) ?? null,
        });
      }

      await audit(user.id, `REDEMPTION_${status}`, "redemption", updated.id, { status }, getCompanyId(req));
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
    const txs = await storage.getAllTransactions(getCompanyId(req));
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

      if (input.type === TRANSACTION_TYPES.ADJUST && input.amount === 0) {
        return res.status(400).json({ message: "Сумма коррекции не может быть 0" });
      }
      if (input.type === TRANSACTION_TYPES.EARN && input.amount <= 0) {
        return res.status(400).json({ message: "Сумма начисления должна быть положительной" });
      }

      const isAdmin = req.user!.role === ROLES.ADMIN;
      const status = isAdmin ? TRANSACTION_STATUS.APPROVED : TRANSACTION_STATUS.PENDING;
      const tx = await storage.createTransaction({
        ...input,
        status,
        createdById: req.user!.id,
        companyId: getCompanyId(req) ?? null,
      });
      await audit(req.user!.id, "CREATE_TRANSACTION", "coinTransaction", tx.id, {
        userId: input.userId, amount: input.amount, type: input.type, reason: input.reason, status
      }, getCompanyId(req));
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
        createdById: req.user!.id,
        companyId: getCompanyId(req) ?? null,
      });
      await audit(req.user!.id, "ZERO_OUT", "coinTransaction", tx.id, {
        userId, previousBalance: currentBalance
      }, getCompanyId(req));
      res.status(201).json(tx);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0]?.message });
      throw err;
    }
  });

  app.get(api.transactions.pending.path, requireRole([ROLES.ADMIN, ROLES.ROP]), async (req, res) => {
    const pending = await storage.getPendingTransactions(getCompanyId(req));
    if (req.user!.role === ROLES.ROP) {
      const myPending = pending.filter(tx => tx.createdById === req.user!.id);
      return res.json(myPending);
    }
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
      const updated = await storage.updateTransactionStatus(id, status, getCompanyId(req));
      await audit(req.user!.id, status === TRANSACTION_STATUS.APPROVED ? "APPROVE_TRANSACTION" : "REJECT_TRANSACTION", "coinTransaction", id, {
        userId: tx.userId, amount: tx.amount, type: tx.type
      }, getCompanyId(req));
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0]?.message });
      throw err;
    }
  });

  // === LESSONS ===
  app.get(api.lessons.list.path, requireAuth, async (req, res) => {
    const allLessons = await storage.listLessons(getCompanyId(req));
    res.json(allLessons);
  });

  app.post(api.lessons.create.path, requireRole([ROLES.ADMIN]), async (req, res) => {
    try {
      const input = api.lessons.create.input.parse(req.body);
      const lesson = await storage.createLesson({ ...input, companyId: getCompanyId(req) ?? null });
      await audit(req.user!.id, "CREATE_LESSON", "lesson", lesson.id, { title: lesson.title }, getCompanyId(req));
      res.status(201).json(lesson);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0]?.message });
      throw err;
    }
  });

  app.get("/api/lessons/:id", requireAuth, async (req, res) => {
    const lesson = await storage.getLesson(Number(req.params.id));
    if (!lesson) return res.status(404).json({ message: "Урок не найден" });
    res.json(lesson);
  });

  app.patch(api.lessons.update.path, requireRole([ROLES.ADMIN]), async (req, res) => {
    try {
      const input = api.lessons.update.input.parse(req.body);
      const lesson = await storage.updateLesson(Number(req.params.id), input, getCompanyId(req));
      await audit(req.user!.id, "UPDATE_LESSON", "lesson", lesson.id, input, getCompanyId(req));
      res.json(lesson);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0]?.message });
      throw err;
    }
  });

  app.delete("/api/lessons/:id", requireRole([ROLES.ADMIN]), async (req, res) => {
    const lesson = await storage.getLesson(Number(req.params.id));
    if (!lesson) return res.status(404).json({ message: "Урок не найден" });
    await storage.deleteLesson(Number(req.params.id), getCompanyId(req));
    await audit(req.user!.id, "DELETE_LESSON", "lesson", lesson.id, { title: lesson.title }, getCompanyId(req));
    res.json({ success: true });
  });

  // === USERS ===
  app.get(api.users.list.path, requireRole([ROLES.ADMIN, ROLES.ROP]), async (req, res) => {
    const allUsers = await storage.listUsers(getCompanyId(req));
    if (req.user!.role === ROLES.ROP) {
      const teamUsers = allUsers.filter(u => u.teamId === req.user!.teamId);
      return res.json(teamUsers.map(sanitizeUser));
    }
    res.json(allUsers.map(sanitizeUser));
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
        companyId: getCompanyId(req) ?? null,
      });
      await audit(req.user!.id, "CREATE_USER", "user", user.id, { name: user.name, role: user.role }, getCompanyId(req));
      res.status(201).json(sanitizeUser(user));
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
      }, getCompanyId(req));
      res.json(sanitizeUser(user));
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0]?.message });
      throw err;
    }
  });

  // === TEAMS ===
  app.get(api.teams.list.path, requireAuth, async (req, res) => {
    const allTeams = await storage.listTeams(getCompanyId(req));
    res.json(allTeams);
  });

  app.post(api.teams.create.path, requireRole([ROLES.ADMIN]), async (req, res) => {
    try {
      const input = api.teams.create.input.parse(req.body);
      const team = await storage.createTeam({ ...input, companyId: getCompanyId(req) ?? null });
      await audit(req.user!.id, "CREATE_TEAM", "team", team.id, { name: team.name }, getCompanyId(req));
      res.status(201).json(team);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0]?.message });
      throw err;
    }
  });

  app.patch(api.teams.update.path, requireRole([ROLES.ADMIN]), async (req, res) => {
    try {
      const input = api.teams.update.input.parse(req.body);
      const team = await storage.updateTeam(Number(req.params.id), input, getCompanyId(req));
      await audit(req.user!.id, "UPDATE_TEAM", "team", team.id, input, getCompanyId(req));
      res.json(team);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0]?.message });
      throw err;
    }
  });

  // === AUDIT ===
  app.get(api.audit.list.path, requireRole([ROLES.ADMIN]), async (req, res) => {
    const logs = await storage.listAuditLogs(getCompanyId(req));
    res.json(logs);
  });

  // === INVITES ===
  app.get(api.invites.list.path, requireRole([ROLES.ADMIN]), async (req, res) => {
    const tokens = await storage.listInviteTokens(getCompanyId(req));
    res.json(tokens);
  });

  app.post(api.invites.create.path, requireRole([ROLES.ADMIN]), async (req, res) => {
    try {
      const { teamId, usageLimit } = api.invites.create.input.parse(req.body);
      const token = randomBytes(6).toString("base64url").slice(0, 8);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const invite = await storage.createInviteToken({
        token,
        teamId: teamId ?? null,
        createdById: req.user!.id,
        usedById: null,
        expiresAt,
        usageLimit: usageLimit ?? 1,
        usageCount: 0,
        isActive: true,
        companyId: getCompanyId(req) ?? null,
      });
      await audit(req.user!.id, "CREATE_INVITE", "inviteToken", invite.id, { teamId, usageLimit: usageLimit ?? 1 }, getCompanyId(req));
      res.status(201).json(invite);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0]?.message });
      throw err;
    }
  });

  app.get("/api/invites/validate/:token", async (req, res) => {
    const invite = await storage.getInviteTokenByToken(req.params.token);
    if (!invite || !invite.isActive) {
      return res.status(400).json({ message: "Недействительная ссылка" });
    }
    if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
      return res.status(400).json({ message: "Ссылка истекла" });
    }
    const limit = invite.usageLimit ?? 1;
    const count = invite.usageCount ?? 0;
    if (count >= limit) {
      return res.status(400).json({ message: "Лимит регистраций по ссылке исчерпан" });
    }
    res.json({ valid: true, teamId: invite.teamId, companyId: invite.companyId });
  });

  app.patch(api.invites.deactivate.path, requireRole([ROLES.ADMIN]), async (req, res) => {
    const invite = await storage.deactivateInviteToken(Number(req.params.id));
    await audit(req.user!.id, "DEACTIVATE_INVITE", "inviteToken", invite.id, undefined, getCompanyId(req));
    res.json(invite);
  });

  // === REGISTER (via invite) ===
  app.post(api.register.path, async (req, res) => {
    try {
      const input = api.register.input.parse(req.body);
      const invite = await storage.getInviteTokenByToken(input.token);

      if (!invite || !invite.isActive) {
        return res.status(400).json({ message: "Недействительная ссылка для регистрации" });
      }
      if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
        return res.status(400).json({ message: "Ссылка для регистрации истекла" });
      }
      const limit = invite.usageLimit ?? 1;
      const count = invite.usageCount ?? 0;
      if (count >= limit) {
        return res.status(400).json({ message: "Лимит регистраций по ссылке исчерпан" });
      }

      const existing = await storage.getUserByUsername(input.username);
      if (existing) {
        return res.status(400).json({ message: "Пользователь с таким email уже существует" });
      }

      if (invite.companyId) {
        const plan = await storage.getCompany(invite.companyId);
        if (plan && plan.planId) {
          const subPlan = await storage.getPlan(plan.planId);
          if (subPlan) {
            const currentCount = await storage.getUserCountByCompany(invite.companyId);
            if (currentCount >= subPlan.maxUsers) {
              return res.status(400).json({ message: "Достигнут лимит пользователей по тарифу компании" });
            }
          }
        }
      }

      const hashedPassword = await hashPassword(input.password);
      const user = await storage.createUser({
        username: input.username,
        password: hashedPassword,
        name: input.name,
        gender: input.gender,
        role: ROLES.MANAGER,
        isActive: true,
        teamId: invite.teamId,
        companyId: invite.companyId,
      });

      try {
        await storage.incrementInviteTokenUsage(invite.id, user.id);
      } catch (e: any) {
        return res.status(400).json({ message: e.message || "Ошибка использования ссылки" });
      }
      await audit(user.id, "REGISTER_VIA_INVITE", "user", user.id, { inviteId: invite.id, gender: input.gender }, invite.companyId);

      req.logIn(user, (err) => {
        if (err) return res.status(500).json({ message: "Ошибка авторизации после регистрации" });
        res.status(201).json(sanitizeUser(user));
      });
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0]?.message });
      throw err;
    }
  });

  // === PROFILE ===
  app.patch(api.profile.update.path, requireAuth, async (req, res) => {
    try {
      const input = api.profile.update.input.parse(req.body);
      const user = req.user!;
      const updates: any = {};

      if (input.name) {
        updates.name = input.name;
      }

      if (input.avatarStyle !== undefined) {
        updates.avatarStyle = input.avatarStyle;
      }

      if (input.newPassword) {
        if (!input.currentPassword) {
          return res.status(400).json({ message: "Введите текущий пароль" });
        }
        const currentUser = await storage.getUser(user.id);
        if (!currentUser) return res.status(404).json({ message: "Пользователь не найден" });

        const { scrypt, timingSafeEqual } = await import("crypto");
        const { promisify } = await import("util");
        const scryptAsync = promisify(scrypt);
        const [hashed, salt] = currentUser.password.split(".");
        const hashedBuf = Buffer.from(hashed, "hex");
        const suppliedBuf = (await scryptAsync(input.currentPassword, salt, 64)) as Buffer;
        const passwordMatch = timingSafeEqual(hashedBuf, suppliedBuf);

        if (!passwordMatch) {
          return res.status(400).json({ message: "Неверный текущий пароль" });
        }
        updates.password = await hashPassword(input.newPassword);
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ message: "Нет данных для обновления" });
      }

      const updated = await storage.updateUser(user.id, updates);
      await audit(user.id, "UPDATE_PROFILE", "user", user.id, {
        ...(input.name && { name: input.name }),
        ...(input.newPassword && { passwordChanged: true }),
      }, getCompanyId(req));
      res.json(sanitizeUser(updated));
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0]?.message });
      throw err;
    }
  });

  // Seed data
  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  const plans = await storage.listPlans();
  let basePlan, proPlan, enterprisePlan;

  if (plans.length === 0) {
    console.log("Creating subscription plans...");
    basePlan = await storage.createPlan({
      name: "Базовый",
      maxUsers: 20,
      priceMonthly: 0,
      features: { shop: true, lessons: true },
      isActive: true,
    });

    proPlan = await storage.createPlan({
      name: "Профессиональный",
      maxUsers: 100,
      priceMonthly: 5000,
      features: { shop: true, lessons: true, analytics: true },
      isActive: true,
    });

    enterprisePlan = await storage.createPlan({
      name: "Корпоративный",
      maxUsers: 500,
      priceMonthly: 15000,
      features: { shop: true, lessons: true, analytics: true, api: true },
      isActive: true,
    });
  } else {
    basePlan = plans.find(p => p.name === "Базовый") || plans[0];
    proPlan = plans.find(p => p.name === "Профессиональный");
    enterprisePlan = plans.find(p => p.name === "Корпоративный");
  }

  const existingSuperAdmin = await storage.getUserByUsername("superadmin@platform.com");
  if (!existingSuperAdmin) {
    console.log("Creating Super Admin account...");
    const superAdminPwd = await hashPassword("superadmin123");
    await storage.createUser({
      username: "superadmin@platform.com",
      password: superAdminPwd,
      name: "Супер Админ",
      role: ROLES.SUPER_ADMIN,
      isActive: true,
      teamId: null,
      companyId: null,
    });
  }

  const allCompanies = await storage.listCompanies();
  const existingAdmin = await storage.getUserByUsername("admin@example.com");
  if (existingAdmin && !existingAdmin.companyId && allCompanies.length === 0) {
    console.log("Migrating existing users to multi-tenant structure...");
    const company = await storage.createCompany({
      name: "Демо компания",
      subdomain: "demo",
      planId: basePlan.id,
      isActive: true,
      supportEmail: null,
    });

    const usersList = await storage.listUsers();
    for (const u of usersList) {
      if (u.role !== ROLES.SUPER_ADMIN && !u.companyId) {
        await storage.updateUser(u.id, { companyId: company.id });
      }
    }

    const teams = await storage.listTeams(company.id);
    if (teams.length === 0) {
      await storage.createTeam({ name: "Sales A", companyId: company.id });
      await storage.createTeam({ name: "Sales B", companyId: company.id });
    }
  }

  const usersList = await storage.listUsers();
  if (usersList.length > 1) return;

  console.log("Seeding database...");

  let demoCompany;
  const companiesAfterMigration = await storage.listCompanies();
  if (companiesAfterMigration.length === 0) {
    demoCompany = await storage.createCompany({
      name: "Демо компания",
      subdomain: "demo",
      planId: basePlan.id,
      isActive: true,
      supportEmail: null,
    });
  } else {
    demoCompany = companiesAfterMigration[0];
  }

  const teamA = await storage.createTeam({ name: "Sales A", companyId: demoCompany.id });
  const teamB = await storage.createTeam({ name: "Sales B", companyId: demoCompany.id });

  const adminPwd = await hashPassword("admin123");
  await storage.createUser({
    username: "admin@example.com",
    password: adminPwd,
    name: "Super Admin",
    role: ROLES.ADMIN,
    isActive: true,
    teamId: null,
    companyId: demoCompany.id,
  });

  const ropPwd = await hashPassword("rop123");
  const rop = await storage.createUser({
    username: "rop@example.com",
    password: ropPwd,
    name: "Alikhan ROP",
    role: ROLES.ROP,
    isActive: true,
    teamId: teamA.id,
    companyId: demoCompany.id,
  });

  const mgrPwd = await hashPassword("manager123");
  const mgr1 = await storage.createUser({
    username: "manager1@example.com",
    password: mgrPwd,
    name: "Ivan Petrov",
    role: ROLES.MANAGER,
    isActive: true,
    teamId: teamA.id,
    companyId: demoCompany.id,
  });

  const mgr2 = await storage.createUser({
    username: "manager2@example.com",
    password: mgrPwd,
    name: "Elena Sidorova",
    role: ROLES.MANAGER,
    isActive: true,
    teamId: teamA.id,
    companyId: demoCompany.id,
  });

  await storage.createShopItem({
    title: "Чехол для AirPods",
    description: "Премиальный кожаный чехол для AirPods Pro. Защита от царапин и ударов.",
    priceCoins: 50,
    stock: 10,
    isActive: true,
    imageUrl: "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=600&h=600&fit=crop&q=80",
    companyId: demoCompany.id,
  });

  await storage.createShopItem({
    title: "Фирменный худи",
    description: "Тёплый худи с логотипом компании. Размеры S-XL. Хлопок 100%.",
    priceCoins: 120,
    stock: 5,
    isActive: true,
    imageUrl: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&h=600&fit=crop&q=80",
    companyId: demoCompany.id,
  });

  await storage.createShopItem({
    title: "Беспроводная мышь",
    description: "Эргономичная беспроводная мышь для комфортной работы в офисе.",
    priceCoins: 80,
    stock: 8,
    isActive: true,
    imageUrl: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&h=600&fit=crop&q=80",
    companyId: demoCompany.id,
  });

  await storage.createShopItem({
    title: "Bluetooth колонка",
    description: "Портативная колонка JBL для офиса. Мощный звук и 12 часов работы.",
    priceCoins: 200,
    stock: 3,
    isActive: true,
    imageUrl: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&h=600&fit=crop&q=80",
    companyId: demoCompany.id,
  });

  await storage.createShopItem({
    title: "Подарочная карта 5000 KZT",
    description: "Подарочная карта Kaspi на 5000 тенге. Используйте в любом магазине.",
    priceCoins: 150,
    stock: 20,
    isActive: true,
    imageUrl: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&h=600&fit=crop&q=80",
    companyId: demoCompany.id,
  });

  await storage.createShopItem({
    title: "Дополнительный выходной",
    description: "Сертификат на дополнительный выходной день. Согласовано с HR.",
    priceCoins: 300,
    stock: 2,
    isActive: true,
    imageUrl: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=600&h=600&fit=crop&q=80",
    companyId: demoCompany.id,
  });

  await storage.createShopItem({
    title: "Термокружка",
    description: "Стильная термокружка 450мл. Держит тепло до 6 часов.",
    priceCoins: 60,
    stock: 15,
    isActive: true,
    imageUrl: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=600&h=600&fit=crop&q=80",
    companyId: demoCompany.id,
  });

  await storage.createShopItem({
    title: "Рюкзак для ноутбука",
    description: "Городской рюкзак с отделением для ноутбука до 15.6 дюймов.",
    priceCoins: 250,
    stock: 4,
    isActive: true,
    imageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=600&fit=crop&q=80",
    companyId: demoCompany.id,
  });

  await storage.createShopItem({
    title: "Наушники беспроводные",
    description: "Беспроводные наушники с шумоподавлением. До 30 часов работы.",
    priceCoins: 350,
    stock: 3,
    isActive: true,
    imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop&q=80",
    companyId: demoCompany.id,
  });

  await storage.createShopItem({
    title: "Подписка на онлайн-курсы",
    description: "Месяц доступа к образовательной платформе. Более 1000 курсов.",
    priceCoins: 180,
    stock: 10,
    isActive: true,
    imageUrl: "https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=600&h=600&fit=crop&q=80",
    companyId: demoCompany.id,
  });

  await storage.createLesson({
    course: "Sales Basics",
    title: "Introduction to Sales",
    contentType: "LINK",
    content: "https://example.com/video1",
    orderIndex: 1,
    isActive: true,
    companyId: demoCompany.id,
  });

  await storage.createLesson({
    course: "Sales Basics",
    title: "Client Communication",
    contentType: "LINK",
    content: "https://example.com/video2",
    orderIndex: 2,
    isActive: true,
    companyId: demoCompany.id,
  });

  await storage.createLesson({
    course: "Advanced Techniques",
    title: "Closing Deals",
    contentType: "LINK",
    content: "https://example.com/video3",
    orderIndex: 3,
    isActive: true,
    companyId: demoCompany.id,
  });

  await storage.createTransaction({
    userId: mgr1.id,
    type: TRANSACTION_TYPES.EARN,
    amount: 200,
    reason: "Welcome Bonus",
    createdById: rop.id,
    companyId: demoCompany.id,
  });

  await storage.createTransaction({
    userId: mgr2.id,
    type: TRANSACTION_TYPES.EARN,
    amount: 150,
    reason: "Welcome Bonus",
    createdById: rop.id,
    companyId: demoCompany.id,
  });

  console.log("Database seeded successfully!");
}
