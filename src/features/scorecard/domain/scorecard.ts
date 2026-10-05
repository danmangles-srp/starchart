import { isoWeekEquals, type IsoWeekKey } from '@/lib/time';
import type { Comparator } from './measurable';

/**
 * Goal evaluation for one weekly value (INV-3, pure). Empty (no entry) is neutral —
 * never green, never red, and distinct from a real 0 (FR-4.2).
 */
export type GoalStatus = 'on' | 'off' | 'empty';

export function evaluateGoal(
  value: number | null,
  comparator: Comparator,
  goal: number,
  goalMax: number | null = null,
): GoalStatus {
  if (value === null) return 'empty';
  switch (comparator) {
    case 'GTE':
      return value >= goal ? 'on' : 'off';
    case 'LTE':
      return value <= goal ? 'on' : 'off';
    case 'EQ':
      return value === goal ? 'on' : 'off';
    case 'GT':
      return value > goal ? 'on' : 'off';
    case 'LT':
      return value < goal ? 'on' : 'off';
    case 'BETWEEN': {
      // goal..goalMax inclusive; tolerate either order, fall back to an exact match.
      const hi = goalMax ?? goal;
      const lo = Math.min(goal, hi);
      const up = Math.max(goal, hi);
      return value >= lo && value <= up ? 'on' : 'off';
    }
  }
}

/** A measurable row paired with its values across a week window (newest-first). */
export interface RowSummary {
  /** Weeks with a real entry (empty weeks excluded). */
  entered: number;
  sum: number;
  /** Mean of entered weeks, or null when none entered (empty ≠ 0). */
  average: number | null;
  onGoal: number;
  /** e.g. "9/11 on goal" — denominator is entered weeks, since empty is neutral. */
  hitRate: string;
}

export function summarizeRow(
  values: readonly (number | null)[],
  comparator: Comparator,
  goal: number,
  goalMax: number | null = null,
): RowSummary {
  const entered = values.filter((v): v is number => v !== null);
  const sum = entered.reduce((acc, v) => acc + v, 0);
  const average = entered.length > 0 ? sum / entered.length : null;
  const onGoal = entered.filter((v) => evaluateGoal(v, comparator, goal, goalMax) === 'on').length;
  return {
    entered: entered.length,
    sum,
    average,
    onGoal,
    hitRate: `${onGoal}/${entered.length} on goal`,
  };
}

/**
 * The most recent entered value across a newest-first week window — used by the
 * home/dashboard rollups (INV-9). Empty weeks are skipped; null when none entered.
 */
export function latestEnteredValue(
  entriesByWeek: ReadonlyMap<string, number | null>,
  weeksNewestFirst: readonly IsoWeekKey[],
): number | null {
  for (const week of weeksNewestFirst) {
    const v = entriesByWeek.get(weekMapKey(week));
    if (v !== null && v !== undefined) return v;
  }
  return null;
}

/** Stable string key for an ISO week, for map lookups. */
export function weekMapKey(week: IsoWeekKey): string {
  return `${week.isoYear}-${week.isoWeek}`;
}

/** True when `week` is the first (newest) in the window — the current-week highlight. */
export function isCurrentWeek(week: IsoWeekKey, weeksNewestFirst: readonly IsoWeekKey[]): boolean {
  const first = weeksNewestFirst[0];
  return first !== undefined && isoWeekEquals(week, first);
}
