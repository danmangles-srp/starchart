import { describe, it, expect, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';

// Tier 2.5 (testing.md): runs against a dedicated test database. Skips cleanly
// when DATABASE_URL_TEST is unset so the unit suite still runs without a DB.
const testUrl = process.env.DATABASE_URL_TEST;
const client = testUrl ? new PrismaClient({ datasources: { db: { url: testUrl } } }) : null;

describe.skipIf(!testUrl)('Postgres connection (Tier 2.5)', () => {
  afterAll(async () => {
    await client?.$disconnect();
  });

  it('connects and runs a query round-trip', async () => {
    if (!client) return;
    const rows = await client.$queryRaw<Array<{ one: number }>>`SELECT 1 AS one`;
    expect(Number(rows[0]?.one)).toBe(1);
  });
});
