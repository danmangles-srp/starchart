import type { PrismaClient } from '@prisma/client';
import { db } from '@/lib/db';
import { NotFoundError } from '@/lib/auth/errors';
import type { IssueCounts, IssueListType, IssueRow } from '../domain/issue';

type UserRef = { name: string | null; email: string };
type IssueWithRefs = {
  id: string;
  title: string;
  description: string | null;
  teamId: string;
  raiserId: string;
  raiser: UserRef;
  ownerId: string | null;
  owner: UserRef | null;
  listType: IssueListType;
  rank: number;
  solved: boolean;
  solvedAt: Date | null;
  solvedById: string | null;
  resolutionNote: string | null;
  createdTodoId: string | null;
  createdRockId: string | null;
};

const refs = {
  raiser: { select: { name: true, email: true } },
  owner: { select: { name: true, email: true } },
} as const;

function name(u: UserRef | null): string | null {
  return u ? (u.name ?? u.email) : null;
}

function toRow(i: IssueWithRefs): IssueRow {
  return {
    id: i.id,
    title: i.title,
    description: i.description,
    teamId: i.teamId,
    raiserId: i.raiserId,
    raiserName: name(i.raiser) ?? 'Unknown',
    ownerId: i.ownerId,
    ownerName: name(i.owner),
    listType: i.listType,
    rank: i.rank,
    solved: i.solved,
    solvedAt: i.solvedAt ? i.solvedAt.toISOString() : null,
    solvedById: i.solvedById,
    resolutionNote: i.resolutionNote,
    createdTodoId: i.createdTodoId,
    createdRockId: i.createdRockId,
  };
}

export interface CreateIssueInput {
  teamId: string;
  title: string;
  description?: string | null;
  raiserId: string;
  ownerId?: string | null;
  listType: IssueListType;
}

export async function createIssue(
  orgId: string,
  input: CreateIssueInput,
  prisma: PrismaClient = db,
) {
  // Append after every issue in the list — count all (incl. solved) so a new
  // rank never collides with one a solved issue still holds. Explicit reordering
  // lands in T5.3; ties under rare concurrent creates are resolved there.
  const count = await prisma.issue.count({
    where: { orgId, teamId: input.teamId, listType: input.listType },
  });
  return prisma.issue.create({
    data: {
      orgId,
      teamId: input.teamId,
      title: input.title,
      description: input.description ?? null,
      raiserId: input.raiserId,
      ownerId: input.ownerId ?? null,
      listType: input.listType,
      rank: count + 1,
    },
  });
}

/** A team's issues, open first, ordered by list then rank (solved last). */
export async function listTeamIssues(
  orgId: string,
  teamId: string,
  prisma: PrismaClient = db,
): Promise<IssueRow[]> {
  const rows = await prisma.issue.findMany({
    where: { orgId, teamId },
    include: refs,
    orderBy: [{ solved: 'asc' }, { listType: 'asc' }, { rank: 'asc' }],
  });
  return rows.map((r) => toRow(r as unknown as IssueWithRefs));
}

/** INV-9: issues assigned to a user, still open, across all their teams. */
export async function myOpenIssuesFor(
  orgId: string,
  ownerId: string,
  prisma: PrismaClient = db,
): Promise<IssueRow[]> {
  const rows = await prisma.issue.findMany({
    where: { orgId, ownerId, solved: false },
    include: refs,
    orderBy: [{ listType: 'asc' }, { rank: 'asc' }],
  });
  return rows.map((r) => toRow(r as unknown as IssueWithRefs));
}

/** INV-9: short-open / long-open / solved counts for a team (team dashboard, M6). */
export async function teamIssueSummary(
  orgId: string,
  teamId: string,
  prisma: PrismaClient = db,
): Promise<IssueCounts> {
  const rows = await prisma.issue.findMany({
    where: { orgId, teamId },
    select: { listType: true, solved: true },
  });
  const counts: IssueCounts = { total: rows.length, shortOpen: 0, longOpen: 0, solved: 0 };
  for (const r of rows) {
    if (r.solved) counts.solved += 1;
    else if (r.listType === 'SHORT') counts.shortOpen += 1;
    else counts.longOpen += 1;
  }
  return counts;
}

/** Persist a new order for the open issues of one (team, list). orgId-scoped, transactional. */
export async function reorderIssues(
  orgId: string,
  teamId: string,
  listType: IssueListType,
  orderedIds: string[],
  prisma: PrismaClient = db,
): Promise<void> {
  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.issue.updateMany({
        where: { id, orgId, teamId, listType },
        data: { rank: index + 1 },
      }),
    ),
  );
}

/** Move an issue to the other list, appending it to the end of the target list. Returns teamId. */
export async function moveIssue(
  orgId: string,
  issueId: string,
  toListType: IssueListType,
  prisma: PrismaClient = db,
): Promise<string> {
  const existing = await prisma.issue.findFirst({
    where: { id: issueId, orgId },
    select: { teamId: true },
  });
  if (!existing) throw new NotFoundError('Issue not found.');
  // Count ALL issues in the target list (incl. solved), same as createIssue, so the
  // new rank never collides with one a solved issue still holds. It still sorts last
  // among open issues; the client's optimistic rank is reconciled on refresh.
  const count = await prisma.issue.count({
    where: { orgId, teamId: existing.teamId, listType: toListType },
  });
  await prisma.issue.update({
    where: { id: issueId },
    data: { listType: toListType, rank: count + 1 },
  });
  return existing.teamId;
}

/** The team an issue belongs to, or null if not in this org (authz for issue writes). */
export async function getIssueTeamId(
  orgId: string,
  issueId: string,
  prisma: PrismaClient = db,
): Promise<string | null> {
  const i = await prisma.issue.findFirst({
    where: { id: issueId, orgId },
    select: { teamId: true },
  });
  return i?.teamId ?? null;
}
