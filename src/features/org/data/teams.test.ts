import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { seed } from './seed';
import { listReadableTeams, getReadableTeam } from './teams';
import type { Viewer } from '@/lib/auth/permissions';

const testUrl = process.env.DATABASE_URL_TEST;
const prisma = testUrl ? new PrismaClient({ datasources: { db: { url: testUrl } } }) : null;

describe.skipIf(!testUrl)('readable teams (Tier 2.5)', () => {
  let orgId = '';
  let marketing1 = '';
  let leadershipId = '';

  beforeAll(async () => {
    if (!prisma) return;
    await seed(prisma, 2026);
    const org = await prisma.organization.findUniqueOrThrow({ where: { slug: 'cadence' } });
    orgId = org.id;
    marketing1 = (
      await prisma.team.findUniqueOrThrow({
        where: { orgId_name: { orgId, name: 'Marketing Team 1' } },
      })
    ).id;
    leadershipId = (
      await prisma.team.findUniqueOrThrow({
        where: { orgId_name: { orgId, name: 'Leadership Team' } },
      })
    ).id;
  });

  afterAll(async () => {
    await prisma?.$disconnect();
  });

  it('an Admin sees all 21 teams; a member sees only theirs', async () => {
    if (!prisma) return;
    const admin: Viewer = { id: 'a', orgId, isAdmin: true, memberships: [] };
    const member: Viewer = {
      id: 'm',
      orgId,
      isAdmin: false,
      memberships: [{ teamId: marketing1, teamRole: 'MEMBER' }],
    };
    expect(await listReadableTeams(admin, prisma)).toHaveLength(21);
    const memberTeams = await listReadableTeams(member, prisma);
    expect(memberTeams.map((t) => t.id)).toEqual([marketing1]);
  });

  it('refuses a direct link to an unreadable team for a member', async () => {
    if (!prisma) return;
    const member: Viewer = {
      id: 'm',
      orgId,
      isAdmin: false,
      memberships: [{ teamId: marketing1, teamRole: 'MEMBER' }],
    };
    expect(await getReadableTeam(member, leadershipId, prisma)).toBeNull();
    expect(await getReadableTeam(member, marketing1, prisma)).toMatchObject({ id: marketing1 });

    const admin: Viewer = { id: 'a', orgId, isAdmin: true, memberships: [] };
    expect(await getReadableTeam(admin, leadershipId, prisma)).toMatchObject({ id: leadershipId });
  });
});
