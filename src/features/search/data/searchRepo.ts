import { Prisma, type PrismaClient } from '@prisma/client';
import { db } from '@/lib/db';
import type { Viewer } from '@/lib/auth/permissions';
import { isSearchable, normalizeQuery, type SearchResult } from '../domain/search';

const PER_TYPE = 8;

/**
 * Cross-module search over the viewer's readable teams only (INV-2): an Admin
 * searches every team in the org; everyone else only the teams they're on.
 * Team-scoped entities only, so every hit deep-links to a team module (INV-8).
 */
export async function searchReadable(
  viewer: Viewer,
  rawQuery: string,
  prisma: PrismaClient = db,
): Promise<SearchResult[]> {
  const q = normalizeQuery(rawQuery);
  if (!isSearchable(q)) return [];

  const teamIds = viewer.memberships.map((m) => m.teamId);
  if (!viewer.isAdmin && teamIds.length === 0) return [];

  const teamWhere = viewer.isAdmin ? {} : { teamId: { in: teamIds } };
  const contains: Prisma.StringFilter = { contains: q, mode: 'insensitive' };
  const team = { select: { name: true } } as const;
  const take = PER_TYPE;

  const [rocks, measurables, issues, todos] = await Promise.all([
    prisma.rock.findMany({
      where: { orgId: viewer.orgId, level: 'TEAM', title: contains, ...teamWhere },
      include: { team },
      take,
    }),
    prisma.measurable.findMany({
      where: { orgId: viewer.orgId, archivedAt: null, name: contains, ...teamWhere },
      include: { team },
      take,
    }),
    prisma.issue.findMany({
      where: { orgId: viewer.orgId, title: contains, ...teamWhere },
      include: { team },
      take,
    }),
    prisma.todo.findMany({
      where: { orgId: viewer.orgId, title: contains, ...teamWhere },
      include: { team },
      take,
    }),
  ]);

  const results: SearchResult[] = [];
  for (const r of rocks) {
    if (r.teamId) {
      results.push({
        type: 'rock',
        id: r.id,
        title: r.title,
        teamId: r.teamId,
        teamName: r.team?.name ?? '',
      });
    }
  }
  for (const m of measurables) {
    results.push({
      type: 'measurable',
      id: m.id,
      title: m.name,
      teamId: m.teamId,
      teamName: m.team.name,
    });
  }
  for (const i of issues) {
    results.push({
      type: 'issue',
      id: i.id,
      title: i.title,
      teamId: i.teamId,
      teamName: i.team.name,
    });
  }
  for (const t of todos) {
    results.push({
      type: 'todo',
      id: t.id,
      title: t.title,
      teamId: t.teamId,
      teamName: t.team.name,
    });
  }
  return results;
}
