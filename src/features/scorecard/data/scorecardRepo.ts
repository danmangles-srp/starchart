import type { PrismaClient } from '@prisma/client';
import { db } from '@/lib/db';
import { NotFoundError } from '@/lib/auth/errors';
import { trailingIsoWeeks } from '@/lib/time';
import { evaluateGoal, latestEnteredValue, weekMapKey, type GoalStatus } from '../domain/scorecard';
import type {
  Comparator,
  EntryRow,
  MeasurableFormat,
  MeasurableRow,
  WeekKey,
} from '../domain/measurable';

/** Trailing ISO-week window length for the Scorecard (FR-4.2). */
const WINDOW_WEEKS = 13;

type MeasurableWithOwner = {
  id: string;
  name: string;
  ownerId: string;
  owner: { name: string | null; email: string };
  goalValue: number;
  goalMax: number | null;
  comparator: Comparator;
  format: MeasurableFormat;
  unit: string | null;
  order: number;
};

function toRow(m: MeasurableWithOwner): MeasurableRow {
  return {
    id: m.id,
    name: m.name,
    ownerId: m.ownerId,
    ownerName: m.owner.name ?? m.owner.email,
    goalValue: m.goalValue,
    goalMax: m.goalMax,
    comparator: m.comparator,
    format: m.format,
    unit: m.unit,
    order: m.order,
  };
}

export interface CreateMeasurableInput {
  teamId: string;
  name: string;
  ownerId: string;
  goalValue: number;
  goalMax?: number | null;
  comparator: Comparator;
  format?: MeasurableFormat;
  unit?: string | null;
}

export async function listMeasurables(
  orgId: string,
  teamId: string,
  prisma: PrismaClient = db,
): Promise<MeasurableRow[]> {
  const rows = await prisma.measurable.findMany({
    where: { orgId, teamId, archivedAt: null },
    include: { owner: { select: { name: true, email: true } } },
    orderBy: { order: 'asc' },
  });
  return rows.map((r) => toRow(r as unknown as MeasurableWithOwner));
}

export async function createMeasurable(
  orgId: string,
  input: CreateMeasurableInput,
  prisma: PrismaClient = db,
) {
  const count = await prisma.measurable.count({ where: { orgId, teamId: input.teamId } });
  return prisma.measurable.create({
    data: {
      orgId,
      teamId: input.teamId,
      name: input.name,
      ownerId: input.ownerId,
      goalValue: input.goalValue,
      goalMax: input.goalMax ?? null,
      comparator: input.comparator,
      format: input.format ?? 'NUMBER',
      unit: input.unit ?? null,
      order: count + 1,
    },
  });
}

/** The team a measurable belongs to, or null if it isn't in this org (authz for entry writes). */
export async function getMeasurableTeamId(
  orgId: string,
  measurableId: string,
  prisma: PrismaClient = db,
): Promise<string | null> {
  const m = await prisma.measurable.findFirst({
    where: { id: measurableId, orgId },
    select: { teamId: true },
  });
  return m?.teamId ?? null;
}

/**
 * Set/clear one week's value. null = empty (distinct from 0). orgId-scoped via the
 * measurable. Returns the measurable's teamId so callers can revalidate without a
 * second lookup.
 */
export async function upsertWeeklyEntry(
  orgId: string,
  measurableId: string,
  isoYear: number,
  isoWeek: number,
  value: number | null,
  prisma: PrismaClient = db,
): Promise<string> {
  const measurable = await prisma.measurable.findFirst({
    where: { id: measurableId, orgId },
    select: { teamId: true },
  });
  if (!measurable) throw new NotFoundError('Measurable not found.');
  await prisma.weeklyEntry.upsert({
    where: { measurableId_isoYear_isoWeek: { measurableId, isoYear, isoWeek } },
    update: { value },
    create: { measurableId, isoYear, isoWeek, value },
  });
  return measurable.teamId;
}

/** Entries for a team's measurables across the given weeks (bounded, NFR-2.3). */
export async function getWeeklyEntries(
  orgId: string,
  teamId: string,
  weeks: WeekKey[],
  prisma: PrismaClient = db,
): Promise<EntryRow[]> {
  if (weeks.length === 0) return [];
  const rows = await prisma.weeklyEntry.findMany({
    where: {
      measurable: { orgId, teamId },
      OR: weeks.map((w) => ({ isoYear: w.isoYear, isoWeek: w.isoWeek })),
    },
    select: { measurableId: true, isoYear: true, isoWeek: true, value: true },
  });
  return rows;
}

// --- INV-9 dashboard rollups (consumed by the home / team dashboards, M6) ---

type MeasurableWithEntries = MeasurableWithOwner & {
  entries: { isoYear: number; isoWeek: number; value: number | null }[];
};

/** Status of a measurable's most recent entered week across the trailing window. */
function latestStatus(m: MeasurableWithEntries, weeks: ReturnType<typeof trailingIsoWeeks>) {
  const byWeek = new Map<string, number | null>();
  for (const e of m.entries)
    byWeek.set(weekMapKey({ isoYear: e.isoYear, isoWeek: e.isoWeek }), e.value);
  const latestValue = latestEnteredValue(byWeek, weeks);
  const status = evaluateGoal(latestValue, m.comparator, m.goalValue, m.goalMax);
  return { latestValue, status };
}

export interface MeasurableStatusRow extends MeasurableRow {
  latestValue: number | null;
  status: GoalStatus;
}

/** INV-9: a user's own measurables whose latest entered week is off-goal ("red"). */
export async function myOffGoalMeasurablesFor(
  orgId: string,
  ownerId: string,
  asOf: Date,
  prisma: PrismaClient = db,
): Promise<MeasurableStatusRow[]> {
  const weeks = trailingIsoWeeks(asOf, WINDOW_WEEKS);
  const rows = await prisma.measurable.findMany({
    where: { orgId, ownerId, archivedAt: null },
    include: {
      owner: { select: { name: true, email: true } },
      entries: {
        where: { OR: weeks.map((w) => ({ isoYear: w.isoYear, isoWeek: w.isoWeek })) },
        select: { isoYear: true, isoWeek: true, value: true },
      },
    },
    orderBy: { order: 'asc' },
  });
  const out: MeasurableStatusRow[] = [];
  for (const raw of rows) {
    const m = raw as unknown as MeasurableWithEntries;
    const { latestValue, status } = latestStatus(m, weeks);
    if (status === 'off') out.push({ ...toRow(m), latestValue, status });
  }
  return out;
}

export interface TeamScorecardCounts {
  total: number;
  onGoal: number;
  offGoal: number;
  empty: number;
}

/** INV-9: on-goal / off-goal / empty counts for a team's current week (team dashboard, M6). */
export async function teamScorecardSummary(
  orgId: string,
  teamId: string,
  asOf: Date,
  prisma: PrismaClient = db,
): Promise<TeamScorecardCounts> {
  const weeks = trailingIsoWeeks(asOf, WINDOW_WEEKS);
  const rows = await prisma.measurable.findMany({
    where: { orgId, teamId, archivedAt: null },
    include: {
      owner: { select: { name: true, email: true } },
      entries: {
        where: { OR: weeks.map((w) => ({ isoYear: w.isoYear, isoWeek: w.isoWeek })) },
        select: { isoYear: true, isoWeek: true, value: true },
      },
    },
  });
  const counts: TeamScorecardCounts = { total: 0, onGoal: 0, offGoal: 0, empty: 0 };
  for (const raw of rows) {
    const { status } = latestStatus(raw as unknown as MeasurableWithEntries, weeks);
    counts.total += 1;
    if (status === 'on') counts.onGoal += 1;
    else if (status === 'off') counts.offGoal += 1;
    else counts.empty += 1;
  }
  return counts;
}
