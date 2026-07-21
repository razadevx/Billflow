import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

const createPrismaClient = () => {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;
  const client = new PrismaClient({
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
