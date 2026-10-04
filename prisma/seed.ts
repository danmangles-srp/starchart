/**
 * Database seed runner. The seed logic lives in src so it is unit-testable and
 * coverage-counted; this just wires it to a PrismaClient for `pnpm prisma db seed`.
 */
import { PrismaClient } from '@prisma/client';
import { seed } from '../src/features/org/data/seed';

const prisma = new PrismaClient();

seed(prisma)
  .then(() => prisma.$disconnect())
  .catch((error: unknown) => {
    process.exitCode = 1;
    return prisma.$disconnect().then(() => {
      throw error;
    });
  });
