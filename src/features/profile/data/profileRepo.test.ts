import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { NotFoundError } from '@/lib/auth/errors';
import { getProfile, getIdentity, updateJobTitle } from './profileRepo';

const testUrl = process.env.DATABASE_URL_TEST;
const prisma = testUrl ? new PrismaClient({ datasources: { db: { url: testUrl } } }) : null;
const stamp = Date.now();

describe.skipIf(!testUrl)('profileRepo (Tier 2.5)', () => {
  let orgId = '';
  let userId = '';
  let teamId = '';

  beforeAll(async () => {
    if (!prisma) return;
    const org = await prisma.organization.create({
      data: { name: 'Profile Test', slug: `profile-${stamp}` },
    });
    orgId = org.id;
    userId = (
      await prisma.user.create({
        data: { email: `profile-${stamp}@example.com`, name: 'Pat Profile', orgId },
      })
    ).id;
    const dept = await prisma.department.create({ data: { orgId, name: 'Ops', order: 1 } });
    teamId = (
      await prisma.team.create({ data: { orgId, name: 'Ops Team', departmentId: dept.id } })
    ).id;
    await prisma.membership.create({ data: { orgId, userId, teamId, teamRole: 'LEAD' } });
  });

  afterAll(async () => {
    if (!prisma) return;
    await prisma.membership.deleteMany({ where: { orgId } });
    await prisma.team.deleteMany({ where: { orgId } });
    await prisma.department.deleteMany({ where: { orgId } });
    await prisma.user.deleteMany({ where: { orgId } });
    await prisma.organization.deleteMany({ where: { id: orgId } });
    await prisma.$disconnect();
  });

  it('returns identity + memberships with team/department names', async () => {
    if (!prisma) return;
    const profile = await getProfile(orgId, userId, prisma);
    expect(profile.name).toBe('Pat Profile');
    expect(profile.memberships).toHaveLength(1);
    expect(profile.memberships[0]).toMatchObject({
      teamName: 'Ops Team',
      teamRole: 'LEAD',
      departmentName: 'Ops',
    });
  });

  it('sets and clears the job title, scoped to org', async () => {
    if (!prisma) return;
    await updateJobTitle(orgId, userId, '  Head of Ops  ', prisma);
    expect((await getIdentity(orgId, userId, prisma)).jobTitle).toBe('Head of Ops');
    await updateJobTitle(orgId, userId, '   ', prisma);
    expect((await getIdentity(orgId, userId, prisma)).jobTitle).toBeNull();

    await expect(updateJobTitle('other-org', userId, 'X', prisma)).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it('refuses to read a user outside the org', async () => {
    if (!prisma) return;
    await expect(getProfile('other-org', userId, prisma)).rejects.toBeInstanceOf(NotFoundError);
  });
});
