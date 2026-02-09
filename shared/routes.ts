
import { z } from "zod";
import { 
  insertUserSchema, 
  insertTeamSchema, 
  insertShopItemSchema, 
  insertTransactionSchema, 
  insertRedemptionSchema, 
  insertLessonSchema,
  users,
  teams,
  shopItems,
  coinTransactions,
  redemptions,
  lessons
} from "./schema";

// Shared error schemas
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
      path: "/api/redemptions" as const, // Can filter by ?scope=my|team|all
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
        400: errorSchemas.validation, // Insufficient funds
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
    create: {
      method: "POST" as const,
      path: "/api/transactions" as const,
      input: z.object({
        userId: z.number(),
        amount: z.number(),
        type: z.enum(["EARN", "ADJUST"]),
        reason: z.string(),
      }),
      responses: {
        201: z.custom<typeof coinTransactions.$inferSelect>(),
        403: errorSchemas.unauthorized,
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
  },
  users: {
    list: {
      method: "GET" as const,
      path: "/api/users" as const,
      responses: {
        200: z.array(z.custom<typeof users.$inferSelect & { team: typeof teams.$inferSelect | null }>()),
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
  }
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
