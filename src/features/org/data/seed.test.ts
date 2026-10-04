import { describe, it, expect, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { seed, calendarQuarters, DEPARTMENTS, TEAMS_PER_DEPARTMENT } from './seed';

describe('calendarQuarters', () => {
  it('builds four calendar quarters (Q1 = Jan–Mar)', () => {
    const quarters = calendarQuarters(2026);
    expect(quarters).toHaveLength(4);
    expect(quarters[0]?.label).toBe('Q1 2026');
    expect(quarters[0]?.startsOn.toISOString().slice(0, 10)).toBe('2026-01-01');
    expect(quarters[0]?.endsOn.toISOString().slice(0, 10)).toBe('2026-03-31');
    expect(quarters[3]?.endsOn.toISOString().slice(0, 10)).toBe('2026-12-31');
  });
});

const testUrl = process.env.DATABASE_URL_TEST;
const prisma = testUrl ? new PrismaClient({ datasources: { db: { url: testUrl } } }) : null;

describe.skipIf(!testUrl)('org seed + org scoping (Tier 2.5)', () => {
  afterAll(async () => {
    await prisma?.$disconnect();
  });

  it('seeds a Leadership team + 4x5 department teams and 4 quarters, idempotently', async () => {
    if (!prisma) return;
    const expectedTeams = 1 + DEPARTMENTS.length * TEAMS_PER_DEPARTMENT; // 21

    await seed(prisma, 2026);
    const first = await prisma.organization.findUniqueOrThrow({
      where: { slug: 'cadence' },
      include: { teams: true, quarterDefinitions: { where: { fiscalYear: 2026 } } },
    });
    expect(first.teams).toHaveLength(expectedTeams);
    expect(first.quarterDefinitions).toHaveLength(4);

    await seed(prisma, 2026);
    const second = await prisma.organization.findUniqueOrThrow({
      where: { slug: 'cadence' },
      include: { teams: true },
    });
    expect(second.teams).toHaveLength(expectedTeams);
  });

  it('never leaks rows across orgs when filtered by orgId (FR-2.7)', async () => {
    if (!prisma) return;
    const stamp = Date.now();
    const orgA = await prisma.organization.create({ data: { name: 'A', slug: `iso-a-${stamp}` } });
    const orgB = await prisma.organization.create({ data: { name: 'B', slug: `iso-b-${stamp}` } });
    await prisma.team.create({ data: { name: 'A Team', org: { connect: { id: orgA.id } } } });
    await prisma.team.create({ data: { name: 'B Team', org: { connect: { id: orgB.id } } } });

    const aTeams = await prisma.team.findMany({ where: { orgId: orgA.id } });
    expect(aTeams).toHaveLength(1);
    expect(aTeams[0]?.name).toBe('A Team');

    await prisma.team.deleteMany({ where: { orgId: { in: [orgA.id, orgB.id] } } });
    await prisma.organization.deleteMany({ where: { id: { in: [orgA.id, orgB.id] } } });
  });
});
