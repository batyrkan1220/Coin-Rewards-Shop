
import { db } from "./db";
import { 
  users, teams, shopItems, coinTransactions, redemptions, lessons,
  type User, type InsertUser, type Team, type InsertTeam,
  type ShopItem, type InsertShopItem, type CoinTransaction, type InsertTransaction,
  type Redemption, type InsertRedemption, type Lesson, type InsertLesson,
  REDEMPTION_STATUS
} from "@shared/schema";
import { eq, desc, sql, and } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<InsertUser>): Promise<User>;
  listUsers(): Promise<(User & { team: Team | null })[]>;

  // Teams
  getTeam(id: number): Promise<Team | undefined>;
  createTeam(team: InsertTeam): Promise<Team>;
  updateTeam(id: number, updates: Partial<InsertTeam>): Promise<Team>;
  listTeams(): Promise<Team[]>;

  // ... (existing methods)

  // Audit Logs
  createAuditLog(log: any): Promise<AuditLog>;
  listAuditLogs(): Promise<AuditLog[]>;
}

export class DatabaseStorage implements IStorage {
  // === Users ===
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

  async listUsers(): Promise<(User & { team: Team | null })[]> {
    return await db.query.users.findMany({
      with: { team: true },
      orderBy: desc(users.createdAt)
    });
  }

  // === Teams ===
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

  async listTeams(): Promise<Team[]> {
    return await db.select().from(teams);
  }

  // ... (implement other existing methods carefully)

  // === Audit Logs ===
  async createAuditLog(log: any): Promise<AuditLog> {
    const [result] = await db.insert(auditLogs).values(log).returning();
    return result;
  }

  async listAuditLogs(): Promise<AuditLog[]> {
    return await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt));
  }
}

  // === Shop ===
  async listShopItems(): Promise<ShopItem[]> {
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

  // === Transactions ===
  async createTransaction(tx: InsertTransaction): Promise<CoinTransaction> {
    const [transaction] = await db.insert(coinTransactions).values(tx).returning();
    return transaction;
  }

  async getTransactionsByUser(userId: number): Promise<CoinTransaction[]> {
    return await db.select()
      .from(coinTransactions)
      .where(eq(coinTransactions.userId, userId))
      .orderBy(desc(coinTransactions.createdAt));
  }

  async getBalance(userId: number): Promise<number> {
    const result = await db
      .select({ 
        balance: sql<number>`coalesce(sum(${coinTransactions.amount}), 0)` 
      })
      .from(coinTransactions)
      .where(eq(coinTransactions.userId, userId));
    return Number(result[0].balance);
  }

  // === Redemptions ===
  async createRedemption(redemption: InsertRedemption): Promise<Redemption> {
    const [result] = await db.insert(redemptions).values(redemption).returning();
    return result;
  }

  async getRedemptions(scope: 'my' | 'team' | 'all', userId: number, teamId?: number | null): Promise<(Redemption & { item: ShopItem, user: User })[]> {
    if (scope === 'my') {
      return await db.query.redemptions.findMany({
        where: eq(redemptions.userId, userId),
        with: { item: true, user: true },
        orderBy: desc(redemptions.createdAt)
      });
    }
    
    if (scope === 'team' && teamId) {
      // Get all users in team
      const teamUsers = await db.select({ id: users.id }).from(users).where(eq(users.teamId, teamId));
      const teamUserIds = teamUsers.map(u => u.id);
      
      if (teamUserIds.length === 0) return [];

      return await db.query.redemptions.findMany({
        where: (redemption, { inArray }) => inArray(redemption.userId, teamUserIds),
        with: { item: true, user: true },
        orderBy: desc(redemptions.createdAt)
      });
    }

    // scope === 'all' (Admin)
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

  // === Lessons ===
  async listLessons(): Promise<Lesson[]> {
    return await db.select().from(lessons).orderBy(lessons.orderIndex);
  }

  async createLesson(lesson: InsertLesson): Promise<Lesson> {
    const [result] = await db.insert(lessons).values(lesson).returning();
    return result;
  }
}

export const storage = new DatabaseStorage();
