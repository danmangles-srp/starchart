import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import type { Viewer } from '@/lib/auth/permissions';
import { searchReadable } from './searchRepo';

const testUrl = process.env.DATABASE_URL_TEST;
const prisma = testUrl ? new PrismaClient({ datasources: { db: { url: testUrl } } }) : null;
const stamp = Date.now();

describe.skipIf(!testUrl)('searchReadable (Tier 2.5)', () => {
  let orgId = '';
  let myTeam = '';
  let otherTeam = '';
  let userId = '';

  beforeAll(async () => {
    if (!prisma) return;
    const org = await prisma.organization.create({ data: { name: 'Se', slug: `se-${stamp}` } });
    orgId = org.id;
    userId = (await prisma.user.create({ data: { email: `se-${stamp}@x.com`, orgId } })).id;
    myTeam = (await prisma.team.create({ data: { orgId, name: 'Mine' } })).id;
    otherTeam = (await prisma.team.create({ data: { orgId, name: 'Theirs' } })).id;
    // Issues with the same searchable token on both teams.
    await prisma.issue.create({
      data: { orgId, teamId: myTeam, title: 'Widget latency', raiserId: userId, listType: 'SHORT' },
    });
    await prisma.issue.create({
      data: {
        orgId,
        teamId: otherTeam,
        title: 'Widget pricing',
        raiserId: userId,
        listType: 'SHORT',
      },
    });
    await prisma.todo.create({
      data: { orgId, teamId: myTeam, title: 'Widget demo', ownerId: userId, dueDate: new Date() },
    });
  });

  afterAll(async () => {
    if (!prisma) return;
    await prisma.todo.deleteMany({ where: { orgId } });
    await prisma.issue.deleteMany({ where: { orgId } });
    await prisma.team.deleteMany({ where: { orgId } });
    await prisma.user.deleteMany({ where: { orgId } });
    await prisma.organization.deleteMany({ where: { id: orgId } });
    await prisma.$disconnect();
  });

  const member = (): Viewer => ({
    id: userId,
    orgId,
    isAdmin: false,
    memberships: [{ teamId: myTeam, teamRole: 'MEMBER' }],
  });

  it('returns matches only from the viewer’s readable teams (INV-2)', async () => {
    if (!prisma) return;
    const results = await searchReadable(member(), 'Widget', prisma);
    const titles = results.map((r) => r.title);
    expect(titles).toContain('Widget latency'); // my team
    expect(titles).toContain('Widget demo'); // my team todo
    expect(titles).not.toContain('Widget pricing'); // other team — excluded
  });

  it('an Admin searches every team in the org', async () => {
    if (!prisma) return;
    const admin: Viewer = { id: userId, orgId, isAdmin: true, memberships: [] };
    const titles = (await searchReadable(admin, 'Widget', prisma)).map((r) => r.title);
    expect(titles).toContain('Widget pricing'); // other team now visible
  });

  it('ignores a too-short query', async () => {
    if (!prisma) return;
    expect(await searchReadable(member(), 'W', prisma)).toEqual([]);
  });

  it('a user on no teams sees nothing', async () => {
    if (!prisma) return;
    const none: Viewer = { id: userId, orgId, isAdmin: false, memberships: [] };
    expect(await searchReadable(none, 'Widget', prisma)).toEqual([]);
  });
});
