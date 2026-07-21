import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

const createPrismaClient = () => {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const client = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
  if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = client;
  return client;
};

export const db = new Proxy({} as PrismaClient, {
  get: (target, prop) => {
    const client = createPrismaClient();
    const value = (client as any)[prop];
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  }
});

import { Prisma } from "@prisma/client";

export type DbClient = PrismaClient | Prisma.TransactionClient;

export class TransactionManager {
  /**
   * Executes a callback within a Prisma transaction.
   * If any step fails, the entire transaction is rolled back.
   */
  static async run<T>(
    operation: (tx: Prisma.TransactionClient) => Promise<T>
  ): Promise<T> {
    return await db.$transaction(operation);
  }
}
