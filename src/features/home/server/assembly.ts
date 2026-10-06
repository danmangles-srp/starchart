import type { Viewer } from '@/lib/auth/permissions';
import { listReadableTeams } from '@/features/org/data/teams';
import { listQuarterDefinitions } from '@/features/rocks/data/quartersRepo';
import { resolveCurrentQuarter } from '@/features/rocks/domain/quarter';
import { myRocksFor, teamRockSummary } from '@/features/rocks/data/rocksRepo';
import {
  myOffGoalMeasurablesFor,
  teamScorecardSummary,
} from '@/features/scorecard/data/scorecardRepo';
import { myOpenTodosFor, teamTodoSummary } from '@/features/todos/data/todosRepo';
import { myOpenIssuesFor, teamIssueSummary } from '@/features/issues/data/issuesRepo';
import {
  assembleTeamDashboards,
  type MyWeekData,
  type TeamDashboardData,
  type TeamSummaries,
} from '../domain/home';

/** Assemble the viewer's personal "My Week" from the four INV-9 myItemsFor contracts. */
export async function loadMyWeek(viewer: Viewer, now: Date = new Date()): Promise<MyWeekData> {
  const defs = await listQuarterDefinitions(viewer.orgId);
  const quarter = resolveCurrentQuarter(defs, now);
  const [rocks, todos, measurables, issues] = await Promise.all([
    myRocksFor(viewer.orgId, viewer.id, quarter),
    myOpenTodosFor(viewer.orgId, viewer.id),
    myOffGoalMeasurablesFor(viewer.orgId, viewer.id, now),
    myOpenIssuesFor(viewer.orgId, viewer.id),
  ]);
  return { rocks, todos, measurables, issues };
}

/** Assemble a team dashboard per readable team from the four INV-9 teamSummary contracts. */
export async function loadTeamDashboards(
  viewer: Viewer,
  now: Date = new Date(),
): Promise<TeamDashboardData[]> {
  const defs = await listQuarterDefinitions(viewer.orgId);
  const quarter = resolveCurrentQuarter(defs, now);
  const teams = await listReadableTeams(viewer);

  const entries = await Promise.all(
    teams.map(async (team): Promise<[string, TeamSummaries]> => {
      const [rocks, scorecard, todos, issues] = await Promise.all([
        teamRockSummary(viewer.orgId, team.id, quarter),
        teamScorecardSummary(viewer.orgId, team.id, now),
        teamTodoSummary(viewer.orgId, team.id, now),
        teamIssueSummary(viewer.orgId, team.id),
      ]);
      return [team.id, { rocks, scorecard, todos, issues }];
    }),
  );

  return assembleTeamDashboards(
    teams.map((t) => ({ id: t.id, name: t.name })),
    new Map(entries),
  );
}
