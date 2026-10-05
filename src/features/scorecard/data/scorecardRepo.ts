import type { PrismaClient } from '@prisma/client';
import { db } from '@/lib/db';
import { NotFoundError } from '@/lib/auth/errors';
import type {
  Comparator,
  EntryRow,
  MeasurableFormat,
  MeasurableRow,
  WeekKey,
} from '../domain/measurable';

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

/** Set/clear one week's value. null = empty (distinct from 0). orgId-scoped via the measurable. */
export async function upsertWeeklyEntry(
  orgId: string,
  measurableId: string,
  isoYear: number,
  isoWeek: number,
  value: number | null,
  prisma: PrismaClient = db,
): Promise<void> {
  const measurable = await prisma.measurable.findFirst({
    where: { id: measurableId, orgId },
    select: { id: true },
  });
  if (!measurable) throw new NotFoundError('Measurable not found.');
  await prisma.weeklyEntry.upsert({
    where: { measurableId_isoYear_isoWeek: { measurableId, isoYear, isoWeek } },
    update: { value },
    create: { measurableId, isoYear, isoWeek, value },
  });
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
