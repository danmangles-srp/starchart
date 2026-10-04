import type { PrismaClient, TeamRole } from '@prisma/client';
import { db } from '@/lib/db';
import { NotFoundError } from '@/lib/auth/errors';

// Every write is scoped to orgId so an Admin can only touch their own org (FR-2.7).

export async function createDepartment(orgId: string, name: string, prisma: PrismaClient = db) {
  const count = await prisma.department.count({ where: { orgId } });
  return prisma.department.create({ data: { orgId, name, order: count + 1 } });
}

export async function createTeam(
  orgId: string,
  input: { name: string; departmentId?: string | null },
  prisma: PrismaClient = db,
) {
  if (input.departmentId) {
    const dept = await prisma.department.findFirst({
      where: { id: input.departmentId, orgId },
      select: { id: true },
    });
    if (!dept) throw new NotFoundError('Department not found.');
  }
  return prisma.team.create({
    data: { orgId, name: input.name, departmentId: input.departmentId ?? null },
  });
}

export async function renameTeam(
  orgId: string,
  teamId: string,
  name: string,
  prisma: PrismaClient = db,
) {
  const res = await prisma.team.updateMany({ where: { id: teamId, orgId }, data: { name } });
  if (res.count === 0) throw new NotFoundError('Team not found.');
}

/** Retire = archive, never hard-delete (INV-10 / NFR-5.2). */
export async function archiveTeam(orgId: string, teamId: string, prisma: PrismaClient = db) {
  const res = await prisma.team.updateMany({
    where: { id: teamId, orgId, archivedAt: null },
    data: { archivedAt: new Date() },
  });
  if (res.count === 0) throw new NotFoundError('Team not found or already archived.');
}

export async function addMembership(
  orgId: string,
  input: { userId: string; teamId: string; teamRole: TeamRole },
  prisma: PrismaClient = db,
) {
  const [user, team] = await Promise.all([
    prisma.user.findFirst({ where: { id: input.userId, orgId }, select: { id: true } }),
    prisma.team.findFirst({ where: { id: input.teamId, orgId }, select: { id: true } }),
  ]);
  if (!user || !team) throw new NotFoundError('User or team not found in this organization.');
  return prisma.membership.upsert({
    where: { userId_teamId: { userId: input.userId, teamId: input.teamId } },
    update: { teamRole: input.teamRole },
    create: { orgId, userId: input.userId, teamId: input.teamId, teamRole: input.teamRole },
  });
}

export async function removeMembership(
  orgId: string,
  userId: string,
  teamId: string,
  prisma: PrismaClient = db,
) {
  const res = await prisma.membership.deleteMany({ where: { orgId, userId, teamId } });
  if (res.count === 0) throw new NotFoundError('Membership not found.');
}

export async function setTeamRole(
  orgId: string,
  input: { userId: string; teamId: string; teamRole: TeamRole },
  prisma: PrismaClient = db,
) {
  const res = await prisma.membership.updateMany({
    where: { orgId, userId: input.userId, teamId: input.teamId },
    data: { teamRole: input.teamRole },
  });
  if (res.count === 0) throw new NotFoundError('Membership not found.');
}

export async function setUserAdmin(
  orgId: string,
  userId: string,
  isAdmin: boolean,
  prisma: PrismaClient = db,
) {
  const res = await prisma.user.updateMany({ where: { id: userId, orgId }, data: { isAdmin } });
  if (res.count === 0) throw new NotFoundError('User not found.');
}

export async function upsertQuarterDefinition(
  orgId: string,
  input: { fiscalYear: number; index: number; label: string; startsOn: string; endsOn: string },
  prisma: PrismaClient = db,
) {
  const startsOn = new Date(`${input.startsOn}T00:00:00.000Z`);
  const endsOn = new Date(`${input.endsOn}T00:00:00.000Z`);
  return prisma.quarterDefinition.upsert({
    where: { orgId_fiscalYear_index: { orgId, fiscalYear: input.fiscalYear, index: input.index } },
    update: { label: input.label, startsOn, endsOn },
    create: {
      orgId,
      fiscalYear: input.fiscalYear,
      index: input.index,
      label: input.label,
      startsOn,
      endsOn,
    },
  });
}

export async function getAdminOverview(orgId: string, prisma: PrismaClient = db) {
  const [departments, teams, users, quarters] = await Promise.all([
    prisma.department.findMany({ where: { orgId }, orderBy: { order: 'asc' } }),
    prisma.team.findMany({
      where: { orgId },
      orderBy: [{ isLeadership: 'desc' }, { order: 'asc' }],
    }),
    prisma.user.findMany({
      where: { orgId },
      orderBy: { email: 'asc' },
      include: { memberships: { select: { teamId: true, teamRole: true } } },
    }),
    prisma.quarterDefinition.findMany({
      where: { orgId },
      orderBy: [{ fiscalYear: 'asc' }, { index: 'asc' }],
    }),
  ]);
  return { departments, teams, users, quarters };
}
