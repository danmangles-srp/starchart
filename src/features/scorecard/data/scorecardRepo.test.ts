import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { NotFoundError } from '@/lib/auth/errors';
import {
  listMeasurables,
  createMeasurable,
  upsertWeeklyEntry,
  getWeeklyEntries,
} from './scorecardRepo';

const testUrl = process.env.DATABASE_URL_TEST;
const prisma = testUrl ? new PrismaClient({ datasources: { db: { url: testUrl } } }) : null;
const stamp = Date.now();

describe.skipIf(!testUrl)('scorecardRepo (Tier 2.5)', () => {
  let orgId = '';
  let teamId = '';
  let userId = '';

  beforeAll(async () => {
    if (!prisma) return;
    const org = await prisma.organization.create({
      data: { name: 'SC Test', slug: `sc-${stamp}` },
    });
    orgId = org.id;
    userId = (await prisma.user.create({ data: { email: `sc-${stamp}@example.com`, orgId } })).id;
    teamId = (await prisma.team.create({ data: { orgId, name: 'SC Team' } })).id;
  });

  afterAll(async () => {
    if (!prisma) return;
    await prisma.measurable.deleteMany({ where: { orgId } }); // cascades weekly entries
    await prisma.team.deleteMany({ where: { orgId } });
    await prisma.user.deleteMany({ where: { orgId } });
    await prisma.organization.deleteMany({ where: { id: orgId } });
    await prisma.$disconnect();
  });

  it('creates and lists measurables', async () => {
    if (!prisma) return;
    const m = await createMeasurable(
      orgId,
      { teamId, name: 'Website leads', ownerId: userId, goalValue: 50, comparator: 'GTE' },
      prisma,
    );
    const list = await listMeasurables(orgId, teamId, prisma);
    expect(list.map((x) => x.id)).toContain(m.id);
    expect(list.find((x) => x.id === m.id)?.comparator).toBe('GTE');
  });

  it('upserts a week uniquely and keeps empty distinct from 0', async () => {
    if (!prisma) return;
    const m = await createMeasurable(
      orgId,
      { teamId, name: 'Revenue', ownerId: userId, goalValue: 1000, comparator: 'GTE' },
      prisma,
    );

    await upsertWeeklyEntry(orgId, m.id, 2026, 40, 48, prisma);
    await upsertWeeklyEntry(orgId, m.id, 2026, 40, 50, prisma); // same week → update, not duplicate
    const w40 = (
      await getWeeklyEntries(orgId, teamId, [{ isoYear: 2026, isoWeek: 40 }], prisma)
    ).filter((e) => e.measurableId === m.id);
    expect(w40).toHaveLength(1);
    expect(w40[0]?.value).toBe(50);

    await upsertWeeklyEntry(orgId, m.id, 2026, 41, 0, prisma);
    await upsertWeeklyEntry(orgId, m.id, 2026, 42, null, prisma);
    const later = await getWeeklyEntries(
      orgId,
      teamId,
      [
        { isoYear: 2026, isoWeek: 41 },
        { isoYear: 2026, isoWeek: 42 },
      ],
      prisma,
    );
    expect(later.find((e) => e.measurableId === m.id && e.isoWeek === 41)?.value).toBe(0);
    expect(later.find((e) => e.measurableId === m.id && e.isoWeek === 42)?.value).toBeNull();
  });

  it('refuses a cross-org entry write', async () => {
    if (!prisma) return;
    const m = await createMeasurable(
      orgId,
      { teamId, name: 'Churn', ownerId: userId, goalValue: 5, comparator: 'LTE' },
      prisma,
    );
    await expect(upsertWeeklyEntry('other-org', m.id, 2026, 40, 1, prisma)).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});
