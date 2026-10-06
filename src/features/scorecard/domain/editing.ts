import { evaluateGoal, formatMeasurableValue } from './scorecard';
import type { ScorecardCell, ScorecardRowVM, WeekColumn } from './viewModel';

/**
 * Coerce a raw grid-editor value into a stored value. Blank / null / NaN → null
 * (empty, cleared), so empty stays distinct from a real 0 (FR-4.2).
 */
export function normalizeEntryValue(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === '') return null;
  const n = typeof raw === 'number' ? raw : Number(raw);
  return Number.isFinite(n) ? n : null;
}

/** Recompute one cell (status + display) for a row's goal after an edit — optimistic UI. */
export function recomputeCell(row: ScorecardRowVM, value: number | null): ScorecardCell {
  return {
    value,
    status: evaluateGoal(value, row.comparator, row.goalValue, row.goalMax),
    display: formatMeasurableValue(value, row.format, row.unit),
  };
}

/** Return a copy of `row` with one week's cell replaced by the recomputed value. */
export function applyCellEdit(
  row: ScorecardRowVM,
  weekKey: string,
  value: number | null,
): ScorecardRowVM {
  return { ...row, cellsByWeek: { ...row.cellsByWeek, [weekKey]: recomputeCell(row, value) } };
}

/** The single week whose value changed between two row versions, or null if none did. */
export function findChangedWeek(
  newRow: ScorecardRowVM,
  oldRow: ScorecardRowVM,
  weeks: readonly WeekColumn[],
): WeekColumn | null {
  for (const week of weeks) {
    const a = newRow.cellsByWeek[week.key]?.value ?? null;
    const b = oldRow.cellsByWeek[week.key]?.value ?? null;
    if (a !== b) return week;
  }
  return null;
}
