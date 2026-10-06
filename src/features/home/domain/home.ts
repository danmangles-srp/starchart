import type { RockSummary } from '@/features/rocks/domain/rock';
import type { TeamRockCounts } from '@/features/rocks/data/rocksRepo';
import type { MeasurableStatusRow } from '@/features/scorecard/data/scorecardRepo';
import type { TeamScorecardCounts } from '@/features/scorecard/data/scorecardRepo';
import type { TodoRow, TodoCounts } from '@/features/todos/domain/todo';
import { isOverdue } from '@/features/todos/domain/todo';
import type { IssueRow, IssueCounts } from '@/features/issues/domain/issue';

/** The four personal lists behind "My Week" (INV-9 myItemsFor, assembled). */
export interface MyWeekData {
  /** My Rocks this quarter. */
  rocks: RockSummary[];
  /** My open Todos across teams. */
  todos: TodoRow[];
  /** Measurables I own whose latest week is off goal. */
  measurables: MeasurableStatusRow[];
  /** Issues assigned to me, still open. */
  issues: IssueRow[];
}

export interface MyWeekPanel {
  key: 'rocks' | 'todos' | 'measurables' | 'issues';
  title: string;
  count: number;
}

/** Panel descriptors for the My-Week landing (pure, INV-3). */
export function myWeekPanels(d: MyWeekData): MyWeekPanel[] {
  return [
    { key: 'rocks', title: 'My Rocks', count: d.rocks.length },
    { key: 'todos', title: 'My Todos', count: d.todos.length },
    { key: 'measurables', title: 'Off-goal measurables', count: d.measurables.length },
    { key: 'issues', title: 'My Issues', count: d.issues.length },
  ];
}

/**
 * How many of my items need attention now: overdue todos, off-goal measurables,
 * and at-risk/off-track rocks. Pure; `now` drives overdue.
 */
export function myWeekAttentionCount(d: MyWeekData, now: Date): number {
  const overdueTodos = d.todos.filter((t) => isOverdue(new Date(t.dueDate), t.done, now)).length;
  const offGoal = d.measurables.length; // already filtered to off-goal
  const rocksAtRisk = d.rocks.filter(
    (r) => r.status === 'at-risk' || r.status === 'off-track',
  ).length;
  return overdueTodos + offGoal + rocksAtRisk;
}

/** One team's four-module dashboard counts. */
export interface TeamDashboardData {
  teamId: string;
  teamName: string;
  rocks: TeamRockCounts;
  scorecard: TeamScorecardCounts;
  todos: TodoCounts;
  issues: IssueCounts;
}

export interface TeamSummaries {
  rocks: TeamRockCounts;
  scorecard: TeamScorecardCounts;
  todos: TodoCounts;
  issues: IssueCounts;
}

/**
 * Zip a viewer's teams with their per-module summaries into dashboard rows,
 * alphabetical by team name. Pure (INV-3): teams missing a summary are skipped.
 */
export function assembleTeamDashboards(
  teams: readonly { id: string; name: string }[],
  byTeam: ReadonlyMap<string, TeamSummaries>,
): TeamDashboardData[] {
  const rows: TeamDashboardData[] = [];
  for (const team of teams) {
    const s = byTeam.get(team.id);
    if (!s) continue;
    rows.push({ teamId: team.id, teamName: team.name, ...s });
  }
  return rows.sort((a, b) => a.teamName.localeCompare(b.teamName));
}

/** Total open items on a team dashboard — a quick "activity" signal. */
export function teamOpenTotal(d: TeamDashboardData): number {
  return (
    d.rocks.onTrack +
    d.rocks.atRisk +
    d.rocks.offTrack +
    d.todos.open +
    d.issues.shortOpen +
    d.issues.longOpen
  );
}
