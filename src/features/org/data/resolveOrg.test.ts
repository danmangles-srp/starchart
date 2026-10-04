import { describe, it, expect, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { getOrCreateDefaultOrg, DEFAULT_ORG_SLUG } from './resolveOrg';

const testUrl = process.env.DATABASE_URL_TEST;
const prisma = testUrl ? new PrismaClient({ datasources: { db: { url: testUrl } } }) : null;

describe.skipIf(!testUrl)('getOrCreateDefaultOrg (Tier 2.5)', () => {
  afterAll(async () => {
    await prisma?.$disconnect();
  });

  it('returns the single org and is stable across calls', async () => {
    if (!prisma) return;
    const first = await getOrCreateDefaultOrg(prisma);
    const second = await getOrCreateDefaultOrg(prisma);
    expect(first.slug).toBe(DEFAULT_ORG_SLUG);
    expect(second.id).toBe(first.id);
  });
});
