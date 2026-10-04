import { PrismaClient } from '@prisma/client';

/**
 * Prisma client singleton. Reused across hot reloads in dev so we don't exhaust
 * connections. All data access goes through the feature `data/` layer on top of
 * this — never a raw Prisma call from a component or route file (INV-2, structure.md).
 */
const globalForDb = globalThis as unknown as { db?: PrismaClient };

export const db: PrismaClient = globalForDb.db ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForDb.db = db;
}
