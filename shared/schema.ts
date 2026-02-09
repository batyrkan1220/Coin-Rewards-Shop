
import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === ENUMS ===
export const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
  ROP: "ROP",
  MANAGER: "MANAGER",
} as const;

export const TRANSACTION_TYPES = {
  EARN: "EARN",
  SPEND: "SPEND",
  ADJUST: "ADJUST",
} as const;

export const TRANSACTION_STATUS = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;

export const REDEMPTION_STATUS = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  ISSUED: "ISSUED",
} as const;

export const CONTENT_TYPES = {
  LINK: "LINK",
  TEXT: "TEXT",
  VIDEO: "VIDEO",
  ARTICLE: "ARTICLE",
} as const;

// === TABLES ===

export const subscriptionPlans = pgTable("subscription_plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  maxUsers: integer("max_users").notNull().default(10),
  priceMonthly: integer("price_monthly").notNull().default(0),
  features: jsonb("features"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  subdomain: text("subdomain").notNull().unique(),
  planId: integer("plan_id").references(() => subscriptionPlans.id),
  isActive: boolean("is_active").default(true),
  supportEmail: text("support_email"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  ropUserId: integer("rop_user_id"),
  companyId: integer("company_id").references(() => companies.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default(ROLES.MANAGER),
  name: text("name").notNull(),
  gender: text("gender"),
  avatarStyle: text("avatar_style"),
  companyId: integer("company_id").references(() => companies.id),
  teamId: integer("team_id").references(() => teams.id),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const shopItems = pgTable("shop_items", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  priceCoins: integer("price_coins").notNull(),
  stock: integer("stock").default(0),
  isActive: boolean("is_active").default(true),
  imageUrl: text("image_url"),
  companyId: integer("company_id").references(() => companies.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const coinTransactions = pgTable("coin_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  type: text("type").notNull(),
  amount: integer("amount").notNull(),
  reason: text("reason").notNull(),
  status: text("status").notNull().default(TRANSACTION_STATUS.APPROVED),
  refType: text("ref_type"),
  refId: integer("ref_id"),
  companyId: integer("company_id").references(() => companies.id),
  createdById: integer("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const redemptions = pgTable("redemptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  shopItemId: integer("shop_item_id").notNull().references(() => shopItems.id),
  priceCoinsSnapshot: integer("price_coins_snapshot").notNull(),
  status: text("status").notNull().default(REDEMPTION_STATUS.PENDING),
  comment: text("comment"),
  companyId: integer("company_id").references(() => companies.id),
  approvedById: integer("approved_by_id").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  issuedById: integer("issued_by_id").references(() => users.id),
  issuedAt: timestamp("issued_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const lessons = pgTable("lessons", {
  id: serial("id").primaryKey(),
  course: text("course").notNull(),
  title: text("title").notNull(),
  contentType: text("content_type").notNull().default(CONTENT_TYPES.LINK),
  content: text("content").notNull(),
  orderIndex: integer("order_index").notNull().default(0),
  isActive: boolean("is_active").default(true),
  companyId: integer("company_id").references(() => companies.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const inviteTokens = pgTable("invite_tokens", {
  id: serial("id").primaryKey(),
  token: text("token").notNull().unique(),
  teamId: integer("team_id").references(() => teams.id),
  companyId: integer("company_id").references(() => companies.id),
  createdById: integer("created_by_id").references(() => users.id),
  usedById: integer("used_by_id").references(() => users.id),
  usedAt: timestamp("used_at"),
  expiresAt: timestamp("expires_at"),
  usageLimit: integer("usage_limit").default(1),
  usageCount: integer("usage_count").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  actorId: integer("actor_id").references(() => users.id),
  action: text("action").notNull(),
  entity: text("entity").notNull(),
  entityId: integer("entity_id"),
  details: jsonb("details"),
  companyId: integer("company_id").references(() => companies.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// === RELATIONS ===

export const companiesRelations = relations(companies, ({ one, many }) => ({
  plan: one(subscriptionPlans, {
    fields: [companies.planId],
    references: [subscriptionPlans.id],
  }),
  users: many(users),
  teams: many(teams),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  team: one(teams, {
    fields: [users.teamId],
    references: [teams.id],
  }),
  company: one(companies, {
    fields: [users.companyId],
    references: [companies.id],
  }),
  transactions: many(coinTransactions, { relationName: "userTransactions" }),
  redemptions: many(redemptions, { relationName: "userRedemptions" }),
}));

export const teamsRelations = relations(teams, ({ many, one }) => ({
  members: many(users),
  rop: one(users, {
    fields: [teams.ropUserId],
    references: [users.id],
  }),
  company: one(companies, {
    fields: [teams.companyId],
    references: [companies.id],
  }),
}));

export const coinTransactionsRelations = relations(coinTransactions, ({ one }) => ({
  user: one(users, {
    fields: [coinTransactions.userId],
    references: [users.id],
    relationName: "userTransactions",
  }),
  createdBy: one(users, {
    fields: [coinTransactions.createdById],
    references: [users.id],
  }),
}));

export const redemptionsRelations = relations(redemptions, ({ one }) => ({
  user: one(users, {
    fields: [redemptions.userId],
    references: [users.id],
    relationName: "userRedemptions",
  }),
  item: one(shopItems, {
    fields: [redemptions.shopItemId],
    references: [shopItems.id],
  }),
}));

// === ZOD SCHEMAS ===

export const insertCompanySchema = createInsertSchema(companies).omit({ id: true, createdAt: true });
export const insertPlanSchema = createInsertSchema(subscriptionPlans).omit({ id: true, createdAt: true });
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertTeamSchema = createInsertSchema(teams).omit({ id: true, createdAt: true });
export const insertShopItemSchema = createInsertSchema(shopItems).omit({ id: true, createdAt: true });
export const insertTransactionSchema = createInsertSchema(coinTransactions).omit({ id: true, createdAt: true });
export const insertRedemptionSchema = createInsertSchema(redemptions).omit({ id: true, createdAt: true, approvedAt: true, issuedAt: true });
export const insertLessonSchema = createInsertSchema(lessons).omit({ id: true, createdAt: true });
export const insertInviteTokenSchema = createInsertSchema(inviteTokens).omit({ id: true, createdAt: true, usedAt: true });

// === TYPES ===

export type Company = typeof companies.$inferSelect;
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type User = typeof users.$inferSelect;
export type Team = typeof teams.$inferSelect;
export type ShopItem = typeof shopItems.$inferSelect;
export type CoinTransaction = typeof coinTransactions.$inferSelect;
export type Redemption = typeof redemptions.$inferSelect;
export type Lesson = typeof lessons.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type InviteToken = typeof inviteTokens.$inferSelect;

export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type InsertPlan = z.infer<typeof insertPlanSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type InsertShopItem = z.infer<typeof insertShopItemSchema>;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type InsertRedemption = z.infer<typeof insertRedemptionSchema>;
export type InsertLesson = z.infer<typeof insertLessonSchema>;
export type InsertInviteToken = z.infer<typeof insertInviteTokenSchema>;
