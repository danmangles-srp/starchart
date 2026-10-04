import type { PrismaClient } from '@prisma/client';
import { db } from '@/lib/db';
import { canReadTeam, type Viewer } from '@/lib/auth/permissions';
import type { TeamSummaryRow } from '../domain/teams';

/**
 * Teams the viewer may read (INV-2): an Admin sees every team in their org, a
 * member sees only the teams they're on. Always scoped by orgId; archived teams
 * excluded. The Prisma client is injectable so data-access tests can target the
 * test database.
 */
export async function listReadableTeams(
  viewer: Viewer,
  prisma: PrismaClient = db,
): Promise<TeamSummaryRow[]> {
  const base = { orgId: viewer.orgId, archivedAt: null };
  const where = viewer.isAdmin
    ? base
    : { ...base, id: { in: viewer.memberships.map((m) => m.teamId) } };

  const teams = await prisma.team.findMany({ where, include: { department: true } });
  return teams.map((t) => ({
    id: t.id,
    name: t.name,
    isLeadership: t.isLeadership,
    departmentId: t.departmentId,
    departmentName: t.department?.name ?? null,
    order: t.order,
    departmentOrder: t.department?.order ?? -1,
  }));
}

/** A team the viewer may read, or null (a direct link to an unreadable team → not-found, FR-2.4). */
export async function getReadableTeam(
  viewer: Viewer,
  teamId: string,
  prisma: PrismaClient = db,
): Promise<{ id: string; name: string } | null> {
  if (!canReadTeam(viewer, teamId)) return null;
  return prisma.team.findFirst({
    where: { id: teamId, orgId: viewer.orgId, archivedAt: null },
    select: { id: true, name: true },
  });
}
