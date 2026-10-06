import { evaluateGoal, summarizeRow, type GoalStatus } from './scorecard';
import type { Comparator } from './measurable';
import type { ScorecardRowVM, WeekColumn } from './viewModel';

export interface TrendPoint {
  key: string;
  label: string;
  value: number | null;
  status: GoalStatus;
}

export interface Trend {
  /** Oldest-first, for a left-to-right time axis (the grid shows newest-left). */
  points: TrendPoint[];
  goal: number;
  goalMax: number | null;
  comparator: Comparator;
  average: number | null;
  onGoal: number;
  entered: number;
  hitRate: string;
}

/** Build a measurable's trend (chart series + summary) from its row + the week window. */
export function buildTrend(row: ScorecardRowVM, weeksNewestFirst: readonly WeekColumn[]): Trend {
  const oldestFirst = [...weeksNewestFirst].reverse();
  const points: TrendPoint[] = oldestFirst.map((w) => {
    const value = row.cellsByWeek[w.key]?.value ?? null;
    return {
      key: w.key,
      label: w.label,
      value,
      status: evaluateGoal(value, row.comparator, row.goalValue, row.goalMax),
    };
  });
  const s = summarizeRow(
    points.map((p) => p.value),
    row.comparator,
    row.goalValue,
    row.goalMax,
  );
  return {
    points,
    goal: row.goalValue,
    goalMax: row.goalMax,
    comparator: row.comparator,
    average: s.average,
    onGoal: s.onGoal,
    entered: s.entered,
    hitRate: s.hitRate,
  };
}
