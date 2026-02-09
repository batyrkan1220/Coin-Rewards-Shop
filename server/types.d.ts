import type { User as SchemaUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User {
      id: number;
      username: string;
      password: string;
      role: string;
      name: string;
      teamId: number | null;
      isActive: boolean | null;
      createdAt: Date | null;
    }
  }
}

export {};
