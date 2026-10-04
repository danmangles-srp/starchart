import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { seed } from '@/features/org/data/seed';
import { logActivity, listActivity } from './activityLog';
import { ACTIVITY_ACTIONS } from '../domain/activity';
import { ForbiddenError } from '@/lib/auth/errors';
import type { Viewer } from '@/lib/auth/permissions';

const testUrl = process.env.DATABASE_URL_TEST;
const prisma = testUrl ? new PrismaClient({ datasources: { db: { url: testUrl } } }) : null;

describe.skipIf(!testUrl)('activity log (Tier 2.5)', () => {
  let orgId = '';
  let actorId = '';
  let marketing1 = '';

  beforeAll(async () => {
    if (!prisma) return;
    await seed(prisma, 2026);
    const org = await prisma.organization.findUniqueOrThrow({ where: { slug: 'cadence' } });
    orgId = org.id;
    actorId = (await prisma.user.findUniqueOrThrow({ where: { email: 'admin@example.com' } })).id;
    marketing1 = (
      await prisma.team.findUniqueOrThrow({
        where: { orgId_name: { orgId, name: 'Marketing Team 1' } },
      })
    ).id;
  });

  afterAll(async () => {
    await prisma?.$disconnect();
  });

  it('writes an entry and reads it back, scoped by team', async () => {
    if (!prisma) return;
    await logActivity(
      {
        orgId,
        actorId,
        action: ACTIVITY_ACTIONS.ROCK_STATUS_CHANGED,
        targetType: 'rock',
        targetId: 'r1',
        teamId: marketing1,
      },
      prisma,
    );

    const admin: Viewer = { id: actorId, orgId, isAdmin: true, memberships: [] };
    const all = await listActivity(admin, {}, prisma);
    expect(all.length).toBeGreaterThan(0);
    expect(all[0]?.actorName).toBeTruthy();

    const member: Viewer = {
      id: 'm',
      orgId,
      isAdmin: false,
      memberships: [{ teamId: marketing1, teamRole: 'MEMBER' }],
    };
    const teamActivity = await listActivity(member, { teamId: marketing1 }, prisma);
    expect(teamActivity.length).toBeGreaterThan(0);
    expect(teamActivity.every((r) => r.teamId === marketing1)).toBe(true);
  });

  it('refuses org-wide read for a non-admin and a team read for a non-member', async () => {
    if (!prisma) return;
    const member: Viewer = {
      id: 'm',
      orgId,
      isAdmin: false,
      memberships: [{ teamId: marketing1, teamRole: 'MEMBER' }],
    };
    await expect(listActivity(member, {}, prisma)).rejects.toBeInstanceOf(ForbiddenError);
    await expect(
      listActivity(member, { teamId: 'some-other-team' }, prisma),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });
});
