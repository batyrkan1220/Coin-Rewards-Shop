import { z } from "zod";
import {
  insertUserSchema,
  insertTeamSchema,
  insertShopItemSchema,
  insertLessonSchema,
  users,
  teams,
  shopItems,
  coinTransactions,
  redemptions,
  lessons,
  auditLogs,
  inviteTokens
} from "./schema";

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
};

export const api = {
  auth: {
    login: {
      method: "POST" as const,
      path: "/api/login" as const,
      input: z.object({
        username: z.string(),
        password: z.string(),
      }),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
    logout: {
      method: "POST" as const,
      path: "/api/logout" as const,
      responses: {
        200: z.void(),
      },
    },
    me: {
      method: "GET" as const,
      path: "/api/user" as const,
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
  },
  shop: {
    list: {
      method: "GET" as const,
      path: "/api/shop" as const,
      responses: {
        200: z.array(z.custom<typeof shopItems.$inferSelect>()),
      },
    },
    get: {
      method: "GET" as const,
      path: "/api/shop/:id" as const,
      responses: {
        200: z.custom<typeof shopItems.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: "POST" as const,
      path: "/api/shop" as const,
      input: insertShopItemSchema,
      responses: {
        201: z.custom<typeof shopItems.$inferSelect>(),
        403: errorSchemas.unauthorized,
      },
    },
    update: {
      method: "PATCH" as const,
      path: "/api/shop/:id" as const,
      input: insertShopItemSchema.partial(),
      responses: {
        200: z.custom<typeof shopItems.$inferSelect>(),
        403: errorSchemas.unauthorized,
      },
    },
  },
  redemptions: {
    list: {
      method: "GET" as const,
      path: "/api/redemptions" as const,
      input: z.object({
        scope: z.enum(["my", "team", "all"]).optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof redemptions.$inferSelect & { item: typeof shopItems.$inferSelect, user: typeof users.$inferSelect }>()),
      },
    },
    create: {
      method: "POST" as const,
      path: "/api/redemptions" as const,
      input: z.object({
        shopItemId: z.number(),
        comment: z.string().optional(),
      }),
      responses: {
        201: z.custom<typeof redemptions.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    updateStatus: {
      method: "PATCH" as const,
      path: "/api/redemptions/:id/status" as const,
      input: z.object({
        status: z.enum(["APPROVED", "REJECTED", "ISSUED"]),
      }),
      responses: {
        200: z.custom<typeof redemptions.$inferSelect>(),
        403: errorSchemas.unauthorized,
      },
    },
  },
  transactions: {
    list: {
      method: "GET" as const,
      path: "/api/transactions" as const,
      input: z.object({
        userId: z.coerce.number().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof coinTransactions.$inferSelect>()),
      },
    },
    listAll: {
      method: "GET" as const,
      path: "/api/transactions/all" as const,
      responses: {
        200: z.array(z.custom<typeof coinTransactions.$inferSelect>()),
      },
    },
    create: {
      method: "POST" as const,
      path: "/api/transactions" as const,
      input: z.object({
        userId: z.number(),
        amount: z.number(),
        type: z.enum(["EARN", "SPEND", "ADJUST"]),
        reason: z.string(),
      }),
      responses: {
        201: z.custom<typeof coinTransactions.$inferSelect>(),
        403: errorSchemas.unauthorized,
      },
    },
    zeroOut: {
      method: "POST" as const,
      path: "/api/transactions/zero-out" as const,
      input: z.object({
        userId: z.number(),
      }),
      responses: {
        201: z.custom<typeof coinTransactions.$inferSelect>(),
        403: errorSchemas.unauthorized,
      },
    },
    pending: {
      method: "GET" as const,
      path: "/api/transactions/pending" as const,
      responses: {
        200: z.array(z.custom<typeof coinTransactions.$inferSelect>()),
      },
    },
    updateStatus: {
      method: "PATCH" as const,
      path: "/api/transactions/:id/status" as const,
      input: z.object({
        status: z.enum(["APPROVED", "REJECTED"]),
      }),
      responses: {
        200: z.custom<typeof coinTransactions.$inferSelect>(),
      },
    },
    balance: {
      method: "GET" as const,
      path: "/api/balance/:userId" as const,
      responses: {
        200: z.object({ balance: z.number() }),
      },
    },
  },
  lessons: {
    list: {
      method: "GET" as const,
      path: "/api/lessons" as const,
      responses: {
        200: z.array(z.custom<typeof lessons.$inferSelect>()),
      },
    },
    create: {
      method: "POST" as const,
      path: "/api/lessons" as const,
      input: insertLessonSchema,
      responses: {
        201: z.custom<typeof lessons.$inferSelect>(),
        403: errorSchemas.unauthorized,
      },
    },
    update: {
      method: "PATCH" as const,
      path: "/api/lessons/:id" as const,
      input: insertLessonSchema.partial(),
      responses: {
        200: z.custom<typeof lessons.$inferSelect>(),
        403: errorSchemas.unauthorized,
      },
    },
    get: {
      method: "GET" as const,
      path: "/api/lessons/:id" as const,
      responses: {
        200: z.custom<typeof lessons.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: "DELETE" as const,
      path: "/api/lessons/:id" as const,
      responses: {
        200: z.object({ success: z.boolean() }),
        403: errorSchemas.unauthorized,
      },
    },
  },
  users: {
    list: {
      method: "GET" as const,
      path: "/api/users" as const,
      responses: {
        200: z.array(z.custom<typeof users.$inferSelect & { team: typeof teams.$inferSelect | null }>()),
      },
    },
    create: {
      method: "POST" as const,
      path: "/api/users" as const,
      input: z.object({
        username: z.string().min(1),
        password: z.string().min(3),
        name: z.string().min(1),
        role: z.enum(["MANAGER", "ROP", "ADMIN"]),
        teamId: z.number().nullable().optional(),
        isActive: z.boolean().optional(),
      }),
      responses: {
        201: z.custom<typeof users.$inferSelect>(),
        403: errorSchemas.unauthorized,
        400: errorSchemas.validation,
      },
    },
    update: {
      method: "PATCH" as const,
      path: "/api/users/:id" as const,
      input: z.object({
        name: z.string().min(1).optional(),
        username: z.string().min(1).optional(),
        password: z.string().min(3).optional(),
        role: z.enum(["MANAGER", "ROP", "ADMIN"]).optional(),
        teamId: z.number().nullable().optional(),
        isActive: z.boolean().optional(),
      }),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        403: errorSchemas.unauthorized,
      },
    },
  },
  teams: {
    list: {
      method: "GET" as const,
      path: "/api/teams" as const,
      responses: {
        200: z.array(z.custom<typeof teams.$inferSelect>()),
      },
    },
    create: {
      method: "POST" as const,
      path: "/api/teams" as const,
      input: insertTeamSchema,
      responses: {
        201: z.custom<typeof teams.$inferSelect>(),
        403: errorSchemas.unauthorized,
      },
    },
    update: {
      method: "PATCH" as const,
      path: "/api/teams/:id" as const,
      input: insertTeamSchema.partial(),
      responses: {
        200: z.custom<typeof teams.$inferSelect>(),
        403: errorSchemas.unauthorized,
      },
    },
  },
  audit: {
    list: {
      method: "GET" as const,
      path: "/api/audit" as const,
      responses: {
        200: z.array(z.custom<typeof auditLogs.$inferSelect & { actor: typeof users.$inferSelect | null }>()),
      },
    },
  },
  invites: {
    list: {
      method: "GET" as const,
      path: "/api/invites" as const,
      responses: {
        200: z.array(z.custom<typeof inviteTokens.$inferSelect>()),
      },
    },
    create: {
      method: "POST" as const,
      path: "/api/invites" as const,
      input: z.object({
        teamId: z.number().nullable().optional(),
        usageLimit: z.number().min(1).max(100).optional(),
      }),
      responses: {
        201: z.custom<typeof inviteTokens.$inferSelect>(),
        403: errorSchemas.unauthorized,
      },
    },
    validate: {
      method: "GET" as const,
      path: "/api/invites/validate/:token" as const,
      responses: {
        200: z.object({ valid: z.boolean(), teamId: z.number().nullable().optional() }),
        400: errorSchemas.validation,
      },
    },
    deactivate: {
      method: "PATCH" as const,
      path: "/api/invites/:id/deactivate" as const,
      responses: {
        200: z.custom<typeof inviteTokens.$inferSelect>(),
        403: errorSchemas.unauthorized,
      },
    },
  },
  register: {
    method: "POST" as const,
    path: "/api/register" as const,
    input: z.object({
      token: z.string(),
      username: z.string().min(1),
      password: z.string().min(3),
      name: z.string().min(1),
      gender: z.enum(["male", "female"]),
    }),
    responses: {
      201: z.custom<typeof users.$inferSelect>(),
      400: errorSchemas.validation,
    },
  },
  profile: {
    update: {
      method: "PATCH" as const,
      path: "/api/profile" as const,
      input: z.object({
        name: z.string().min(1).optional(),
        currentPassword: z.string().optional(),
        newPassword: z.string().min(3).optional(),
        avatarStyle: z.string().optional(),
      }),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

export type InsertShopItem = z.infer<typeof api.shop.create.input>;
export type InsertUser = z.infer<typeof api.users.create.input>;
export type InsertTeam = z.infer<typeof api.teams.create.input>;
export type InsertLesson = z.infer<typeof api.lessons.create.input>;
