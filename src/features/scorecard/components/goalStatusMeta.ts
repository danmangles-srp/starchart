import type { ComponentType } from 'react';
import type { SvgIconProps } from '@mui/material/SvgIcon';
// Named by role, not glyph.
import OnGoalIcon from '@mui/icons-material/CheckCircle';
import OffGoalIcon from '@mui/icons-material/Cancel';
import EmptyIcon from '@mui/icons-material/RemoveCircleOutline';
import type { GoalStatus } from '../domain/scorecard';

/** MUI palette role for a goal status (semantic — never a raw hex). */
export type GoalColor = 'success' | 'error' | 'default';

export interface GoalStatusMeta {
  /** Screen-reader phrase, appended to the week + value in the cell aria-label. */
  readonly label: string;
  readonly color: GoalColor;
  readonly icon: ComponentType<SvgIconProps>;
}

/**
 * A Scorecard cell is NEVER color alone (INV-6 / NFR-3.3): green/red carries a
 * matching marker icon and a text label surfaced to assistive tech.
 */
export const GOAL_STATUS_META: Readonly<Record<GoalStatus, GoalStatusMeta>> = {
  on: { label: 'on goal', color: 'success', icon: OnGoalIcon },
  off: { label: 'off goal', color: 'error', icon: OffGoalIcon },
  empty: { label: 'no entry', color: 'default', icon: EmptyIcon },
};
