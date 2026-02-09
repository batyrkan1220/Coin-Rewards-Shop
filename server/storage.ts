import { db } from "./db";
import {
  users, teams, shopItems, coinTransactions, redemptions, lessons, auditLogs, inviteTokens,
  companies, subscriptionPlans,
  type User, type InsertUser, type Team, type InsertTeam,
  type ShopItem, type InsertShopItem, type CoinTransaction, type InsertTransaction,
  type Redemption, type InsertRedemption, type Lesson, type InsertLesson,
  type AuditLog, type InviteToken, type InsertInviteToken,
  type Company, type InsertCompany, type SubscriptionPlan, type InsertPlan,
  REDEMPTION_STATUS, TRANSACTION_STATUS
} from "@shared/schema";
import { eq, desc, sql, and } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<InsertUser>): Promise<User>;
  listUsers(companyId?: number): Promise<(User & { team: Team | null })[]>;

  getTeam(id: number): Promise<Team | undefined>;
  createTeam(team: InsertTeam): Promise<Team>;
  updateTeam(id: number, updates: Partial<InsertTeam>): Promise<Team>;
  listTeams(companyId?: number): Promise<Team[]>;

  listShopItems(companyId?: number): Promise<ShopItem[]>;
  getShopItem(id: number): Promise<ShopItem | undefined>;
  createShopItem(item: InsertShopItem): Promise<ShopItem>;
  updateShopItem(id: number, updates: Partial<InsertShopItem>): Promise<ShopItem>;

  createTransaction(tx: InsertTransaction): Promise<CoinTransaction>;
  getTransaction(id: number): Promise<CoinTransaction | undefined>;
  updateTransactionStatus(id: number, status: string): Promise<CoinTransaction>;
  getTransactionsByUser(userId: number): Promise<CoinTransaction[]>;
  getAllTransactions(companyId?: number): Promise<CoinTransaction[]>;
  getPendingTransactions(companyId?: number): Promise<CoinTransaction[]>;
  getBalance(userId: number): Promise<number>;

  createRedemption(redemption: InsertRedemption): Promise<Redemption>;
  getRedemptions(scope: 'my' | 'team' | 'all', userId: number, teamId?: number | null, companyId?: number): Promise<(Redemption & { item: ShopItem, user: User })[]>;
  updateRedemptionStatus(id: number, status: string, actorId: number): Promise<Redemption>;

  listLessons(companyId?: number): Promise<Lesson[]>;
  getLesson(id: number): Promise<Lesson | undefined>;
  createLesson(lesson: InsertLesson): Promise<Lesson>;
  updateLesson(id: number, updates: Partial<InsertLesson>): Promise<Lesson>;
  deleteLesson(id: number): Promise<void>;

  createAuditLog(log: { actorId: number; action: string; entity: string; entityId?: number; details?: any; companyId?: number | null }): Promise<AuditLog>;
  listAuditLogs(companyId?: number): Promise<(AuditLog & { actor: User | null })[]>;

  createInviteToken(token: InsertInviteToken): Promise<InviteToken>;
  getInviteTokenByToken(token: string): Promise<InviteToken | undefined>;
  listInviteTokens(companyId?: number): Promise<InviteToken[]>;
  incrementInviteTokenUsage(id: number, usedById: number): Promise<InviteToken>;
  deactivateInviteToken(id: number): Promise<InviteToken>;

  // Company management (Super Admin)
  listCompanies(): Promise<(Company & { plan: SubscriptionPlan | null; userCount: number })[]>;
  getCompany(id: number): Promise<Company | undefined>;
  getCompanyBySubdomain(subdomain: string): Promise<Company | undefined>;
  createCompany(company: InsertCompany): Promise<Company>;
  updateCompany(id: number, updates: Partial<InsertCompany>): Promise<Company>;

  listPlans(): Promise<SubscriptionPlan[]>;
  getPlan(id: number): Promise<SubscriptionPlan | undefined>;
  createPlan(plan: InsertPlan): Promise<SubscriptionPlan>;
  updatePlan(id: number, updates: Partial<InsertPlan>): Promise<SubscriptionPlan>;

  getUserCountByCompany(companyId: number): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User> {
    const [user] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return user;
  }

  async listUsers(companyId?: number): Promise<(User & { team: Team | null })[]> {
    if (companyId) {
      return await db.query.users.findMany({
        where: eq(users.companyId, companyId),
        with: { team: true },
        orderBy: desc(users.createdAt)
      });
    }
    return await db.query.users.findMany({
      with: { team: true },
      orderBy: desc(users.createdAt)
    });
  }

  async getTeam(id: number): Promise<Team | undefined> {
    const [team] = await db.select().from(teams).where(eq(teams.id, id));
    return team;
  }

  async createTeam(insertTeam: InsertTeam): Promise<Team> {
    const [team] = await db.insert(teams).values(insertTeam).returning();
    return team;
  }

  async updateTeam(id: number, updates: Partial<InsertTeam>): Promise<Team> {
    const [team] = await db.update(teams).set(updates).where(eq(teams.id, id)).returning();
    return team;
  }

  async listTeams(companyId?: number): Promise<Team[]> {
    if (companyId) {
      return await db.select().from(teams).where(eq(teams.companyId, companyId));
    }
    return await db.select().from(teams);
  }

  async listShopItems(companyId?: number): Promise<ShopItem[]> {
    if (companyId) {
      return await db.select().from(shopItems).where(eq(shopItems.companyId, companyId)).orderBy(desc(shopItems.createdAt));
    }
    return await db.select().from(shopItems).orderBy(desc(shopItems.createdAt));
  }

  async getShopItem(id: number): Promise<ShopItem | undefined> {
    const [item] = await db.select().from(shopItems).where(eq(shopItems.id, id));
    return item;
  }

  async createShopItem(insertItem: InsertShopItem): Promise<ShopItem> {
    const [item] = await db.insert(shopItems).values(insertItem).returning();
    return item;
  }

  async updateShopItem(id: number, updates: Partial<InsertShopItem>): Promise<ShopItem> {
    const [item] = await db.update(shopItems).set(updates).where(eq(shopItems.id, id)).returning();
    return item;
  }

  async createTransaction(tx: InsertTransaction): Promise<CoinTransaction> {
    const [transaction] = await db.insert(coinTransactions).values(tx).returning();
    return transaction;
  }

  async getTransaction(id: number): Promise<CoinTransaction | undefined> {
    const [tx] = await db.select().from(coinTransactions).where(eq(coinTransactions.id, id));
    return tx;
  }

  async updateTransactionStatus(id: number, status: string): Promise<CoinTransaction> {
    const [tx] = await db.update(coinTransactions).set({ status }).where(eq(coinTransactions.id, id)).returning();
    return tx;
  }

  async getTransactionsByUser(userId: number): Promise<CoinTransaction[]> {
    return await db.select()
      .from(coinTransactions)
      .where(eq(coinTransactions.userId, userId))
      .orderBy(desc(coinTransactions.createdAt));
  }

  async getAllTransactions(companyId?: number): Promise<CoinTransaction[]> {
    if (companyId) {
      return await db.select()
        .from(coinTransactions)
        .where(eq(coinTransactions.companyId, companyId))
        .orderBy(desc(coinTransactions.createdAt));
    }
    return await db.select()
      .from(coinTransactions)
      .orderBy(desc(coinTransactions.createdAt));
  }

  async getPendingTransactions(companyId?: number): Promise<CoinTransaction[]> {
    if (companyId) {
      return await db.select()
        .from(coinTransactions)
        .where(and(
          eq(coinTransactions.status, TRANSACTION_STATUS.PENDING),
          eq(coinTransactions.companyId, companyId)
        ))
        .orderBy(desc(coinTransactions.createdAt));
    }
    return await db.select()
      .from(coinTransactions)
      .where(eq(coinTransactions.status, TRANSACTION_STATUS.PENDING))
      .orderBy(desc(coinTransactions.createdAt));
  }

  async getBalance(userId: number): Promise<number> {
    const result = await db
      .select({
        balance: sql<number>`coalesce(sum(${coinTransactions.amount}), 0)`
      })
      .from(coinTransactions)
      .where(and(
        eq(coinTransactions.userId, userId),
        eq(coinTransactions.status, TRANSACTION_STATUS.APPROVED)
      ));
    return Number(result[0].balance);
  }

  async createRedemption(redemption: InsertRedemption): Promise<Redemption> {
    const [result] = await db.insert(redemptions).values(redemption).returning();
    return result;
  }

  async getRedemptions(scope: 'my' | 'team' | 'all', userId: number, teamId?: number | null, companyId?: number): Promise<(Redemption & { item: ShopItem, user: User })[]> {
    if (scope === 'my') {
      return await db.query.redemptions.findMany({
        where: eq(redemptions.userId, userId),
        with: { item: true, user: true },
        orderBy: desc(redemptions.createdAt)
      });
    }

    if (scope === 'team' && teamId) {
      const teamUsers = await db.select({ id: users.id }).from(users).where(eq(users.teamId, teamId));
      const teamUserIds = teamUsers.map(u => u.id);
      if (teamUserIds.length === 0) return [];

      return await db.query.redemptions.findMany({
        where: (redemption, { inArray }) => inArray(redemption.userId, teamUserIds),
        with: { item: true, user: true },
        orderBy: desc(redemptions.createdAt)
      });
    }

    if (companyId) {
      return await db.query.redemptions.findMany({
        where: eq(redemptions.companyId, companyId),
        with: { item: true, user: true },
        orderBy: desc(redemptions.createdAt)
      });
    }

    return await db.query.redemptions.findMany({
      with: { item: true, user: true },
      orderBy: desc(redemptions.createdAt)
    });
  }

  async updateRedemptionStatus(id: number, status: string, actorId: number): Promise<Redemption> {
    const updates: any = { status };
    if (status === REDEMPTION_STATUS.APPROVED) {
      updates.approvedById = actorId;
      updates.approvedAt = new Date();
    } else if (status === REDEMPTION_STATUS.ISSUED) {
      updates.issuedById = actorId;
      updates.issuedAt = new Date();
    }

    const [redemption] = await db.update(redemptions)
      .set(updates)
      .where(eq(redemptions.id, id))
      .returning();
    return redemption;
  }

  async listLessons(companyId?: number): Promise<Lesson[]> {
    if (companyId) {
      return await db.select().from(lessons).where(eq(lessons.companyId, companyId)).orderBy(lessons.orderIndex);
    }
    return await db.select().from(lessons).orderBy(lessons.orderIndex);
  }

  async createLesson(lesson: InsertLesson): Promise<Lesson> {
    const [result] = await db.insert(lessons).values(lesson).returning();
    return result;
  }

  async getLesson(id: number): Promise<Lesson | undefined> {
    const [result] = await db.select().from(lessons).where(eq(lessons.id, id));
    return result;
  }

  async updateLesson(id: number, updates: Partial<InsertLesson>): Promise<Lesson> {
    const [result] = await db.update(lessons).set(updates).where(eq(lessons.id, id)).returning();
    return result;
  }

  async deleteLesson(id: number): Promise<void> {
    await db.delete(lessons).where(eq(lessons.id, id));
  }

  async createAuditLog(log: { actorId: number; action: string; entity: string; entityId?: number; details?: any; companyId?: number | null }): Promise<AuditLog> {
    const [result] = await db.insert(auditLogs).values(log).returning();
    return result;
  }

  async listAuditLogs(companyId?: number): Promise<(AuditLog & { actor: User | null })[]> {
    const condition = companyId ? eq(auditLogs.companyId, companyId) : undefined;
    const logs = await db.select().from(auditLogs).where(condition).orderBy(desc(auditLogs.createdAt));
    const enriched = await Promise.all(logs.map(async (log) => {
      let actor: User | null = null;
      if (log.actorId) {
        actor = (await this.getUser(log.actorId)) || null;
      }
      return { ...log, actor };
    }));
    return enriched;
  }

  async createInviteToken(token: InsertInviteToken): Promise<InviteToken> {
    const [result] = await db.insert(inviteTokens).values(token).returning();
    return result;
  }

  async getInviteTokenByToken(token: string): Promise<InviteToken | undefined> {
    const [result] = await db.select().from(inviteTokens).where(eq(inviteTokens.token, token));
    return result;
  }

  async listInviteTokens(companyId?: number): Promise<InviteToken[]> {
    if (companyId) {
      return await db.select().from(inviteTokens).where(eq(inviteTokens.companyId, companyId)).orderBy(desc(inviteTokens.createdAt));
    }
    return await db.select().from(inviteTokens).orderBy(desc(inviteTokens.createdAt));
  }

  async incrementInviteTokenUsage(id: number, usedById: number): Promise<InviteToken> {
    const results = await db.update(inviteTokens)
      .set({
        usageCount: sql`${inviteTokens.usageCount} + 1`,
        usedAt: new Date(),
      })
      .where(and(
        eq(inviteTokens.id, id),
        eq(inviteTokens.isActive, true),
        sql`${inviteTokens.usageCount} < ${inviteTokens.usageLimit}`
      ))
      .returning();
    if (results.length === 0) {
      throw new Error("Лимит регистраций по ссылке исчерпан");
    }
    const result = results[0];
    if (result.usageLimit && result.usageCount !== null && result.usageCount >= result.usageLimit) {
      const [deactivated] = await db.update(inviteTokens)
        .set({ isActive: false })
        .where(eq(inviteTokens.id, id))
        .returning();
      return deactivated;
    }
    return result;
  }

  async deactivateInviteToken(id: number): Promise<InviteToken> {
    const [result] = await db.update(inviteTokens)
      .set({ isActive: false })
      .where(eq(inviteTokens.id, id))
      .returning();
    return result;
  }

  // === COMPANY MANAGEMENT ===

  async listCompanies(): Promise<(Company & { plan: SubscriptionPlan | null; userCount: number })[]> {
    const allCompanies = await db.query.companies.findMany({
      with: { plan: true },
      orderBy: desc(companies.createdAt),
    });
    const enriched = await Promise.all(allCompanies.map(async (c) => {
      const count = await this.getUserCountByCompany(c.id);
      return { ...c, userCount: count };
    }));
    return enriched;
  }

  async getCompany(id: number): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.id, id));
    return company;
  }

  async getCompanyBySubdomain(subdomain: string): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.subdomain, subdomain));
    return company;
  }

  async createCompany(insertCompany: InsertCompany): Promise<Company> {
    const [company] = await db.insert(companies).values(insertCompany).returning();
    return company;
  }

  async updateCompany(id: number, updates: Partial<InsertCompany>): Promise<Company> {
    const [company] = await db.update(companies).set(updates).where(eq(companies.id, id)).returning();
    return company;
  }

  async listPlans(): Promise<SubscriptionPlan[]> {
    return await db.select().from(subscriptionPlans).orderBy(subscriptionPlans.id);
  }

  async getPlan(id: number): Promise<SubscriptionPlan | undefined> {
    const [plan] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, id));
    return plan;
  }

  async createPlan(insertPlan: InsertPlan): Promise<SubscriptionPlan> {
    const [plan] = await db.insert(subscriptionPlans).values(insertPlan).returning();
    return plan;
  }

  async updatePlan(id: number, updates: Partial<InsertPlan>): Promise<SubscriptionPlan> {
    const [plan] = await db.update(subscriptionPlans).set(updates).where(eq(subscriptionPlans.id, id)).returning();
    return plan;
  }

  async getUserCountByCompany(companyId: number): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.companyId, companyId));
    return Number(result[0].count);
  }
}

export const storage = new DatabaseStorage();
