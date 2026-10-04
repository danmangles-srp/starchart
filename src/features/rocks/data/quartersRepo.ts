import type { PrismaClient } from '@prisma/client';
import { db } from '@/lib/db';
import type { QuarterDef } from '../domain/quarter';

/** Org quarter definitions (FR-3.2 / AC-3.2.4), ordered. Empty → callers fall back to calendar. */
export async function listQuarterDefinitions(
  orgId: string,
  prisma: PrismaClient = db,
): Promise<QuarterDef[]> {
  const rows = await prisma.quarterDefinition.findMany({
    where: { orgId },
    orderBy: [{ fiscalYear: 'asc' }, { index: 'asc' }],
  });
  return rows.map((r) => ({
    fiscalYear: r.fiscalYear,
    quarterIndex: r.index,
    label: r.label,
    startsOn: r.startsOn,
    endsOn: r.endsOn,
  }));
}
