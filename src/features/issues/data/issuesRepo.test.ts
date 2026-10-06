import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import {
  createIssue,
  listTeamIssues,
  myOpenIssuesFor,
  teamIssueSummary,
  getIssueTeamId,
} from './issuesRepo';

const testUrl = process.env.DATABASE_URL_TEST;
const prisma = testUrl ? new PrismaClient({ datasources: { db: { url: testUrl } } }) : null;
const stamp = Date.now();

describe.skipIf(!testUrl)('issuesRepo (Tier 2.5)', () => {
  let orgId = '';
  let teamId = '';
  let otherTeamId = '';
  let userId = '';
  let otherUserId = '';

  beforeAll(async () => {
    if (!prisma) return;
    const org = await prisma.organization.create({
      data: { name: 'Is Test', slug: `is-${stamp}` },
    });
    orgId = org.id;
    userId = (await prisma.user.create({ data: { email: `is-${stamp}@example.com`, orgId } })).id;
    otherUserId = (await prisma.user.create({ data: { email: `is2-${stamp}@example.com`, orgId } }))
      .id;
    teamId = (await prisma.team.create({ data: { orgId, name: 'Is Team' } })).id;
    otherTeamId = (await prisma.team.create({ data: { orgId, name: 'Is Team 2' } })).id;
  });

  afterAll(async () => {
    if (!prisma) return;
    await prisma.issue.deleteMany({ where: { orgId } });
    await prisma.team.deleteMany({ where: { orgId } });
    await prisma.user.deleteMany({ where: { orgId } });
    await prisma.organization.deleteMany({ where: { id: orgId } });
    await prisma.$disconnect();
  });

  it('creates issues with incrementing rank per list', async () => {
    if (!prisma) return;
    const a = await createIssue(
      orgId,
      { teamId, title: 'A', raiserId: userId, listType: 'SHORT' },
      prisma,
    );
    const b = await createIssue(
      orgId,
      { teamId, title: 'B', raiserId: userId, listType: 'SHORT' },
      prisma,
    );
    const long = await createIssue(
      orgId,
      { teamId, title: 'L', raiserId: userId, listType: 'LONG' },
      prisma,
    );
    expect(a.rank).toBe(1);
    expect(b.rank).toBe(2);
    expect(long.rank).toBe(1); // separate list ranks from 1

    const list = await listTeamIssues(orgId, teamId, prisma);
    expect(list.find((i) => i.id === a.id)?.raiserName).toBeTruthy();
    expect(await getIssueTeamId(orgId, a.id, prisma)).toBe(teamId);
    expect(await getIssueTeamId('other-org', a.id, prisma)).toBeNull();
  });

  it('aggregates a user’s open assigned issues across teams, excluding solved + others', async () => {
    if (!prisma) return;
    const mine = await createIssue(
      orgId,
      {
        teamId: otherTeamId,
        title: 'Mine',
        raiserId: otherUserId,
        ownerId: userId,
        listType: 'SHORT',
      },
      prisma,
    );
    const solvedMine = await createIssue(
      orgId,
      { teamId, title: 'Solved', raiserId: otherUserId, ownerId: userId, listType: 'SHORT' },
      prisma,
    );
    await prisma.issue.update({
      where: { id: solvedMine.id },
      data: { solved: true, solvedAt: new Date(), solvedById: userId },
    });
    await createIssue(
      orgId,
      { teamId, title: 'Not mine', raiserId: userId, ownerId: otherUserId, listType: 'SHORT' },
      prisma,
    );

    const open = await myOpenIssuesFor(orgId, userId, prisma);
    expect(open.every((i) => i.ownerId === userId && !i.solved)).toBe(true);
    expect(open.some((i) => i.id === mine.id)).toBe(true);
    expect(open.some((i) => i.id === solvedMine.id)).toBe(false);
  });

  it('summarizes short-open / long-open / solved for a team', async () => {
    if (!prisma) return;
    // team has: A, B (short open), L (long open), Solved (short solved), Not mine (short open)
    const summary = await teamIssueSummary(orgId, teamId, prisma);
    expect(summary.solved).toBe(1);
    expect(summary.longOpen).toBe(1);
    expect(summary.shortOpen).toBe(3);
    expect(summary.total).toBe(5);
  });
});
