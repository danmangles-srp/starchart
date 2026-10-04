/**
 * Database seed. The real seed (one Organization, a Leadership team + 4 departments
 * x 5 teams, demo users/memberships, and calendar quarter definitions) lands with
 * the schema in M1 (T1.2). For now this is a wired no-op so `pnpm prisma db seed`
 * works from day one.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  // Seed data added in T1.2 once the domain models exist.
}

main()
  .then(() => prisma.$disconnect())
  .catch((error: unknown) => {
    process.exitCode = 1;
    return prisma.$disconnect().then(() => {
      throw error;
    });
  });
