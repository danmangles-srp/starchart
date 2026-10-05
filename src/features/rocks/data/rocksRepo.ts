import type { PrismaClient } from '@prisma/client';
import { db } from '@/lib/db';
import { AppError, NotFoundError } from '@/lib/auth/errors';
import type { RockStatus } from '@/theme/status';
import {
  toRockStatus,
  toDbRockStatus,
  type DbRockStatus,
  type RockLevel,
  type RockSummary,
  type RockDetail,
} from '../domain/rock';

export interface QuarterRef {
  fiscalYear: number;
  quarterIndex: number;
}

type RockRow = {
  id: string;
  title: string;
  ownerId: string;
  owner: { name: string | null; email: string };
  level: RockLevel;
  teamId: string | null;
  fiscalYear: number;
  quarterIndex: number;
  status: DbRockStatus;
  dueDate: Date | null;
  milestones: { done: boolean }[];
};

function toSummary(r: RockRow): RockSummary {
  return {
    id: r.id,
    title: r.title,
    ownerId: r.ownerId,
    ownerName: r.owner.name ?? r.owner.email,
    level: r.level,
    teamId: r.teamId,
    fiscalYear: r.fiscalYear,
    quarterIndex: r.quarterIndex,
    status: toRockStatus(r.status),
    milestonesDone: r.milestones.filter((m) => m.done).length,
    milestonesTotal: r.milestones.length,
    dueDate: r.dueDate ? r.dueDate.toISOString() : null,
  };
}

const withMilestones = {
  milestones: { select: { done: true } },
  owner: { select: { name: true, email: true } },
} as const;

export interface CreateRockInput {
  title: string;
  description?: string | null;
  ownerId: string;
  level: RockLevel;
  teamId?: string | null;
  fiscalYear: number;
  quarterIndex: number;
  dueDate?: Date | null;
}

export async function createRock(orgId: string, input: CreateRockInput, prisma: PrismaClient = db) {
  // A TEAM rock belongs to a team; COMPANY/INDIVIDUAL rocks do not.
  if (input.level === 'TEAM' && !input.teamId) {
    throw new AppError('invalid-input', 'A team rock must have a team.');
  }
  if (input.level !== 'TEAM' && input.teamId) {
    throw new AppError('invalid-input', 'Only team rocks can belong to a team.');
  }
  return prisma.rock.create({
    data: {
      orgId,
      title: input.title,
      description: input.description ?? null,
      ownerId: input.ownerId,
      level: input.level,
      teamId: input.teamId ?? null,
      fiscalYear: input.fiscalYear,
      quarterIndex: input.quarterIndex,
      dueDate: input.dueDate ?? null,
    },
  });
}

export async function listTeamRocks(
  orgId: string,
  teamId: string,
  quarter: QuarterRef,
  prisma: PrismaClient = db,
): Promise<RockSummary[]> {
  const rocks = await prisma.rock.findMany({
    where: { orgId, teamId, fiscalYear: quarter.fiscalYear, quarterIndex: quarter.quarterIndex },
    include: withMilestones,
    orderBy: { createdAt: 'asc' },
  });
  return rocks.map((r) => toSummary(r as unknown as RockRow));
}

export async function getRockDetail(
  orgId: string,
  rockId: string,
  prisma: PrismaClient = db,
): Promise<RockDetail | null> {
  const rock = await prisma.rock.findFirst({
    where: { id: rockId, orgId },
    include: {
      milestones: { orderBy: { order: 'asc' } },
      owner: { select: { name: true, email: true } },
    },
  });
  if (!rock) return null;
  return {
    id: rock.id,
    title: rock.title,
    description: rock.description,
    ownerId: rock.ownerId,
    ownerName: rock.owner.name ?? rock.owner.email,
    level: rock.level as RockLevel,
    teamId: rock.teamId,
    fiscalYear: rock.fiscalYear,
    quarterIndex: rock.quarterIndex,
    status: toRockStatus(rock.status as DbRockStatus),
    dueDate: rock.dueDate ? rock.dueDate.toISOString() : null,
    milestones: rock.milestones.map((m) => ({
      id: m.id,
      title: m.title,
      dueDate: m.dueDate ? m.dueDate.toISOString() : null,
      done: m.done,
      order: m.order,
    })),
  };
}

export async function setRockStatus(
  orgId: string,
  rockId: string,
  status: RockStatus,
  prisma: PrismaClient = db,
): Promise<void> {
  const res = await prisma.rock.updateMany({
    where: { id: rockId, orgId },
    data: { status: toDbRockStatus(status) },
  });
  if (res.count === 0) throw new NotFoundError('Rock not found.');
}

/** INV-9: a person's rocks for a quarter (consumed by My Week, M6). */
export async function myRocksFor(
  orgId: string,
  ownerId: string,
  quarter: QuarterRef,
  prisma: PrismaClient = db,
): Promise<RockSummary[]> {
  const rocks = await prisma.rock.findMany({
    where: { orgId, ownerId, fiscalYear: quarter.fiscalYear, quarterIndex: quarter.quarterIndex },
    include: withMilestones,
    orderBy: { createdAt: 'asc' },
  });
  return rocks.map((r) => toSummary(r as unknown as RockRow));
}

export interface TeamRockCounts {
  total: number;
  onTrack: number;
  atRisk: number;
  offTrack: number;
  done: number;
}

/** INV-9: on-track/at-risk/off-track/done counts for a team's quarter (team dashboard, M6). */
export async function teamRockSummary(
  orgId: string,
  teamId: string,
  quarter: QuarterRef,
  prisma: PrismaClient = db,
): Promise<TeamRockCounts> {
  const grouped = await prisma.rock.groupBy({
    by: ['status'],
    where: { orgId, teamId, fiscalYear: quarter.fiscalYear, quarterIndex: quarter.quarterIndex },
    _count: { _all: true },
  });
  const counts: TeamRockCounts = { total: 0, onTrack: 0, atRisk: 0, offTrack: 0, done: 0 };
  for (const row of grouped) {
    const n = row._count._all;
    counts.total += n;
    if (row.status === 'ON_TRACK') counts.onTrack = n;
    else if (row.status === 'AT_RISK') counts.atRisk = n;
    else if (row.status === 'OFF_TRACK') counts.offTrack = n;
    else if (row.status === 'DONE') counts.done = n;
  }
  return counts;
}

// --- Milestones (T2.5) ---

export async function addMilestone(
  orgId: string,
  rockId: string,
  title: string,
  prisma: PrismaClient = db,
) {
  const rock = await prisma.rock.findFirst({ where: { id: rockId, orgId }, select: { id: true } });
  if (!rock) throw new NotFoundError('Rock not found.');
  const count = await prisma.milestone.count({ where: { rockId } });
  return prisma.milestone.create({ data: { rockId, title, order: count + 1 } });
}

export async function setMilestoneDone(
  orgId: string,
  rockId: string,
  milestoneId: string,
  done: boolean,
  prisma: PrismaClient = db,
): Promise<void> {
  // Scope by rockId (not just org) so a milestone can only be toggled through the
  // rock the caller actually authorized — prevents an in-org cross-rock IDOR.
  const res = await prisma.milestone.updateMany({
    where: { id: milestoneId, rockId, rock: { orgId } },
    data: { done },
  });
  if (res.count === 0) throw new NotFoundError('Milestone not found.');
}

export async function reorderMilestones(
  orgId: string,
  rockId: string,
  orderedIds: string[],
  prisma: PrismaClient = db,
): Promise<void> {
  const rock = await prisma.rock.findFirst({ where: { id: rockId, orgId }, select: { id: true } });
  if (!rock) throw new NotFoundError('Rock not found.');
  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.milestone.updateMany({ where: { id, rockId }, data: { order: index + 1 } }),
    ),
  );
}

// --- Company <-> Team links (T2.6) ---

export async function linkRocks(
  orgId: string,
  companyRockId: string,
  teamRockId: string,
  prisma: PrismaClient = db,
) {
  const [company, team] = await Promise.all([
    prisma.rock.findFirst({ where: { id: companyRockId, orgId }, select: { level: true } }),
    prisma.rock.findFirst({ where: { id: teamRockId, orgId }, select: { level: true } }),
  ]);
  if (!company || !team) throw new NotFoundError('Rock not found.');
  if (company.level !== 'COMPANY' || team.level !== 'TEAM') {
    throw new AppError('invalid-input', 'Links go from a Company Rock to a Team Rock.');
  }
  return prisma.rockLink.upsert({
    where: { companyRockId_teamRockId: { companyRockId, teamRockId } },
    update: {},
    create: { companyRockId, teamRockId },
  });
}

export async function unlinkRocks(
  orgId: string,
  companyRockId: string,
  teamRockId: string,
  prisma: PrismaClient = db,
): Promise<void> {
  const res = await prisma.rockLink.deleteMany({
    where: { companyRockId, teamRockId, companyRock: { orgId } },
  });
  if (res.count === 0) throw new NotFoundError('Link not found.');
}

/** Team Rocks supporting a Company Rock (FR-3.4 roll-up source). */
export async function getSupportingRocks(
  orgId: string,
  companyRockId: string,
  prisma: PrismaClient = db,
): Promise<RockSummary[]> {
  const links = await prisma.rockLink.findMany({
    where: { companyRockId, companyRock: { orgId } },
    include: { teamRock: { include: withMilestones } },
  });
  return links.map((l) => toSummary(l.teamRock as unknown as RockRow));
}

/** The Company Rock a Team Rock supports, if any (back-link). */
export async function getSupportedCompanyRock(
  orgId: string,
  teamRockId: string,
  prisma: PrismaClient = db,
): Promise<{ id: string; title: string } | null> {
  const link = await prisma.rockLink.findFirst({
    where: { teamRockId, teamRock: { orgId } },
    include: { companyRock: { select: { id: true, title: true } } },
  });
  return link ? { id: link.companyRock.id, title: link.companyRock.title } : null;
}

/** Team Rocks in the Company Rock's quarter not yet linked to it (link picker). */
export async function listLinkableTeamRocks(
  orgId: string,
  companyRockId: string,
  quarter: QuarterRef,
  prisma: PrismaClient = db,
): Promise<RockSummary[]> {
  const linked = await prisma.rockLink.findMany({
    where: { companyRockId },
    select: { teamRockId: true },
  });
  const excludeIds = linked.map((l) => l.teamRockId);
  const rocks = await prisma.rock.findMany({
    where: {
      orgId,
      level: 'TEAM',
      fiscalYear: quarter.fiscalYear,
      quarterIndex: quarter.quarterIndex,
      id: excludeIds.length ? { notIn: excludeIds } : undefined,
    },
    include: withMilestones,
    orderBy: { title: 'asc' },
  });
  return rocks.map((r) => toSummary(r as unknown as RockRow));
}
