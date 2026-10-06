import type { GoalStatus } from './scorecard';
import type { Comparator, MeasurableFormat } from './measurable';

/** One ISO-week column, newest-first (FR-4.2). */
export interface WeekColumn {
  /** `${isoYear}-${isoWeek}`, the row cell-map key. */
  key: string;
  isoYear: number;
  isoWeek: number;
  /** Short header, e.g. "W40". */
  label: string;
  /** The newest week in the window — gets the current-week highlight. */
  current: boolean;
}

export interface ScorecardCell {
  value: number | null;
  status: GoalStatus;
  /** Formatted for display (empty → "—"). */
  display: string;
}

export interface ScorecardRowVM {
  id: string;
  name: string;
  ownerId: string;
  ownerName: string;
  /** e.g. "≥ 50 calls". */
  goalLabel: string;
  /** e.g. "9/11 on goal". */
  summary: string;
  /** Goal definition, carried so the client can re-evaluate a cell after an inline edit. */
  comparator: Comparator;
  goalValue: number;
  goalMax: number | null;
  format: MeasurableFormat;
  unit: string | null;
  /** Cell per week, keyed by WeekColumn.key. */
  cellsByWeek: Record<string, ScorecardCell>;
}

export interface ScorecardVM {
  teamId: string;
  weeks: WeekColumn[];
  rows: ScorecardRowVM[];
  /** The viewer may edit this team's entries (member or Admin). */
  canEdit: boolean;
  /** The viewer may add/edit/reorder/archive measurables (Team Lead or Admin). */
  canManage: boolean;
  /** Team members, for the owner picker in the manage dialog. */
  members: { userId: string; name: string }[];
  /** Window offset in weeks (0 = the trailing/current window). */
  offsetWeeks: number;
  /** An older window exists to page back to (always true for a bounded history). */
  hasOlder: boolean;
  /** A newer window exists (offset > 0). */
  hasNewer: boolean;
}
