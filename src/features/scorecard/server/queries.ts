import { trailingIsoWeeks } from '@/lib/time';
import { assertCanReadTeam, canEditTeam, type Viewer } from '@/lib/auth/permissions';
import {
  evaluateGoal,
  formatGoal,
  formatMeasurableValue,
  summarizeRow,
  weekMapKey,
} from '../domain/scorecard';
import type { ScorecardRowVM, ScorecardVM, WeekColumn } from '../domain/viewModel';
import { getWeeklyEntries, listMeasurables } from '../data/scorecardRepo';

const WINDOW_WEEKS = 13;

/**
 * Assemble the team Scorecard view model for the trailing 13-ISO-week window
 * (FR-4.2), paged by `offsetWeeks`. Read is authorized here (members + Admin).
 */
export async function loadTeamScorecard(
  viewer: Viewer,
  teamId: string,
  offsetWeeks = 0,
  now: Date = new Date(),
): Promise<ScorecardVM> {
  assertCanReadTeam(viewer, teamId);

  const offset = Math.max(0, Math.trunc(offsetWeeks));
  const weeks = trailingIsoWeeks(now, WINDOW_WEEKS, offset);
  const columns: WeekColumn[] = weeks.map((w, i) => ({
    key: weekMapKey(w),
    isoYear: w.isoYear,
    isoWeek: w.isoWeek,
    label: `W${w.isoWeek}`,
    current: offset === 0 && i === 0,
  }));

  const measurables = await listMeasurables(viewer.orgId, teamId, undefined);
  const entries = await getWeeklyEntries(viewer.orgId, teamId, weeks, undefined);

  // index entries by measurable + week for O(1) cell lookup
  const byMeasurable = new Map<string, Map<string, number | null>>();
  for (const e of entries) {
    const key = weekMapKey({ isoYear: e.isoYear, isoWeek: e.isoWeek });
    let m = byMeasurable.get(e.measurableId);
    if (!m) {
      m = new Map();
      byMeasurable.set(e.measurableId, m);
    }
    m.set(key, e.value);
  }

  const rows: ScorecardRowVM[] = measurables.map((m) => {
    const values = byMeasurable.get(m.id) ?? new Map<string, number | null>();
    const cellsByWeek: ScorecardRowVM['cellsByWeek'] = {};
    const orderedValues: (number | null)[] = [];
    for (const col of columns) {
      const value = values.has(col.key) ? (values.get(col.key) ?? null) : null;
      orderedValues.push(value);
      cellsByWeek[col.key] = {
        value,
        status: evaluateGoal(value, m.comparator, m.goalValue, m.goalMax),
        display: formatMeasurableValue(value, m.format, m.unit),
      };
    }
    return {
      id: m.id,
      name: m.name,
      ownerName: m.ownerName,
      goalLabel: formatGoal(m.comparator, m.goalValue, m.goalMax, m.format, m.unit),
      summary: summarizeRow(orderedValues, m.comparator, m.goalValue, m.goalMax).hitRate,
      cellsByWeek,
    };
  });

  return {
    teamId,
    weeks: columns,
    rows,
    canEdit: canEditTeam(viewer, teamId),
    offsetWeeks: offset,
    hasOlder: true,
    hasNewer: offset > 0,
  };
}
