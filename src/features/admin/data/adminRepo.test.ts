import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { NotFoundError } from '@/lib/auth/errors';
import {
  createDepartment,
  createTeam,
  renameTeam,
  archiveTeam,
  addMembership,
  removeMembership,
  setTeamRole,
  setUserAdmin,
  upsertQuarterDefinition,
  getAdminOverview,
} from './adminRepo';

const testUrl = process.env.DATABASE_URL_TEST;
const prisma = testUrl ? new PrismaClient({ datasources: { db: { url: testUrl } } }) : null;
const stamp = Date.now();

// Runs against its own disposable org so it never perturbs the shared seeded org.
describe.skipIf(!testUrl)('adminRepo (Tier 2.5)', () => {
  let orgId = '';
  let userId = '';

  beforeAll(async () => {
    if (!prisma) return;
    const org = await prisma.organization.create({
      data: { name: 'AdminRepo Test Org', slug: `admrepo-${stamp}` },
    });
    orgId = org.id;
    const user = await prisma.user.create({
      data: { email: `admrepo-${stamp}@example.com`, orgId },
    });
    userId = user.id;
  });

  afterAll(async () => {
    if (!prisma) return;
    await prisma.membership.deleteMany({ where: { orgId } });
    await prisma.team.deleteMany({ where: { orgId } });
    await prisma.department.deleteMany({ where: { orgId } });
    await prisma.quarterDefinition.deleteMany({ where: { orgId } });
    await prisma.user.deleteMany({ where: { orgId } });
    await prisma.organization.deleteMany({ where: { id: orgId } });
    await prisma.$disconnect();
  });

  it('creates/renames/archives a team, scoped to the org', async () => {
    if (!prisma) return;
    const dept = await createDepartment(orgId, 'Growth Dept', prisma);
    const team = await createTeam(orgId, { name: 'Growth', departmentId: dept.id }, prisma);
    expect(team.orgId).toBe(orgId);

    await renameTeam(orgId, team.id, 'Growth 2', prisma);
    expect((await prisma.team.findUniqueOrThrow({ where: { id: team.id } })).name).toBe('Growth 2');

    await archiveTeam(orgId, team.id, prisma);
    expect(
      (await prisma.team.findUniqueOrThrow({ where: { id: team.id } })).archivedAt,
    ).not.toBeNull();

    await expect(renameTeam('other-org', team.id, 'nope', prisma)).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it('adds, re-roles, and removes a membership', async () => {
    if (!prisma) return;
    const team = await createTeam(orgId, { name: 'Members' }, prisma);
    await addMembership(orgId, { userId, teamId: team.id, teamRole: 'MEMBER' }, prisma);
    await setTeamRole(orgId, { userId, teamId: team.id, teamRole: 'LEAD' }, prisma);
    const m = await prisma.membership.findUniqueOrThrow({
      where: { userId_teamId: { userId, teamId: team.id } },
    });
    expect(m.teamRole).toBe('LEAD');
    await removeMembership(orgId, userId, team.id, prisma);
    await expect(removeMembership(orgId, userId, team.id, prisma)).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it('toggles admin, upserts a quarter, and reads the overview', async () => {
    if (!prisma) return;
    await setUserAdmin(orgId, userId, true, prisma);
    expect((await prisma.user.findUniqueOrThrow({ where: { id: userId } })).isAdmin).toBe(true);

    const q = await upsertQuarterDefinition(
      orgId,
      {
        fiscalYear: 2099,
        index: 1,
        label: 'Q1 2099',
        startsOn: '2099-01-01',
        endsOn: '2099-03-31',
      },
      prisma,
    );
    expect(q.label).toBe('Q1 2099');

    const overview = await getAdminOverview(orgId, prisma);
    expect(overview.teams.length).toBeGreaterThan(0);
    expect(overview.users.length).toBe(1);
  });
});
