import { Prisma, type PrismaClient } from '@prisma/client';
import { db } from '@/lib/db';
import { canReadTeam, type Viewer } from '@/lib/auth/permissions';
import { ForbiddenError } from '@/lib/auth/errors';
import type { ActivityRow } from '../domain/activity';

export interface ActivityEntry {
  orgId: string;
  actorId: string;
  action: string;
  targetType: string;
  targetId?: string | null;
  teamId?: string | null;
  metadata?: Record<string, unknown> | null;
}

/** Append an activity record (FR-2.6 / INV-10). Append-only — never updated or deleted. */
export async function logActivity(entry: ActivityEntry, prisma: PrismaClient = db): Promise<void> {
  await prisma.activityLog.create({
    data: {
      orgId: entry.orgId,
      actorId: entry.actorId,
      action: entry.action,
      targetType: entry.targetType,
      targetId: entry.targetId ?? null,
      teamId: entry.teamId ?? null,
      metadata: entry.metadata == null ? undefined : (entry.metadata as Prisma.InputJsonValue),
    },
  });
}

/**
 * Read activity, scoped (FR-2.6): a team's activity is readable by its members (or
 * an Admin); org-wide activity is Admin-only. Bounded (NFR-2.3).
 */
export async function listActivity(
  viewer: Viewer,
  opts: { teamId?: string; limit?: number } = {},
  prisma: PrismaClient = db,
): Promise<ActivityRow[]> {
  const take = Math.min(opts.limit ?? 50, 100);

  let where: { orgId: string; teamId?: string };
  if (opts.teamId) {
    if (!canReadTeam(viewer, opts.teamId)) throw new ForbiddenError();
    where = { orgId: viewer.orgId, teamId: opts.teamId };
  } else {
    if (!viewer.isAdmin) throw new ForbiddenError();
    where = { orgId: viewer.orgId };
  }

  const rows = await prisma.activityLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take,
    include: { actor: { select: { name: true, email: true } } },
  });

  return rows.map((r) => ({
    id: r.id,
    action: r.action,
    actorName: r.actor.name ?? r.actor.email,
    targetType: r.targetType,
    targetId: r.targetId,
    teamId: r.teamId,
    createdAt: r.createdAt.toISOString(),
  }));
}
