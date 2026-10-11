import type { Viewer } from '@/lib/auth/permissions';
import { listQuarterDefinitions } from '@/features/rocks/data/quartersRepo';
import { resolveCurrentQuarter } from '@/features/rocks/domain/quarter';
import { myRocksFor, teamRockSummary } from '@/features/rocks/data/rocksRepo';
import {
  myOffGoalMeasurablesFor,
  teamScorecardSummary,
} from '@/features/scorecard/data/scorecardRepo';
import { myOpenTodosFor, teamTodoSummary } from '@/features/todos/data/todosRepo';
import { myOpenIssuesFor, teamIssueSummary } from '@/features/issues/data/issuesRepo';
import { type MyWeekData, type TeamSummaries } from '../domain/home';

/** The viewer's current quarter, resolved from the org's definitions. */
async function currentQuarter(viewer: Viewer, now: Date) {
  const defs = await listQuarterDefinitions(viewer.orgId);
  return resolveCurrentQuarter(defs, now);
}

/** Assemble the viewer's personal "My Week" from the four INV-9 myItemsFor contracts. */
export async function loadMyWeek(viewer: Viewer, now: Date = new Date()): Promise<MyWeekData> {
  const quarter = await currentQuarter(viewer, now);
  const [rocks, todos, measurables, issues] = await Promise.all([
    myRocksFor(viewer.orgId, viewer.id, quarter),
    myOpenTodosFor(viewer.orgId, viewer.id),
    myOffGoalMeasurablesFor(viewer.orgId, viewer.id, now),
    myOpenIssuesFor(viewer.orgId, viewer.id),
  ]);
  return { rocks, todos, measurables, issues };
}

/** The four INV-9 teamSummary contracts for one team (team-dashboard landing). */
export async function loadTeamDashboard(
  viewer: Viewer,
  teamId: string,
  now: Date = new Date(),
): Promise<TeamSummaries> {
  const quarter = await currentQuarter(viewer, now);
  const [rocks, scorecard, todos, issues] = await Promise.all([
    teamRockSummary(viewer.orgId, teamId, quarter),
    teamScorecardSummary(viewer.orgId, teamId, now),
    teamTodoSummary(viewer.orgId, teamId, now),
    teamIssueSummary(viewer.orgId, teamId),
  ]);
  return { rocks, scorecard, todos, issues };
}
