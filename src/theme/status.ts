import type { ComponentType } from 'react';
import type { SvgIconProps } from '@mui/material/SvgIcon';
// Named by role, not by glyph, so the mapping below reads truthfully.
import OnTrackIcon from '@mui/icons-material/CheckCircle';
import AtRiskIcon from '@mui/icons-material/ChangeHistory';
import OffTrackIcon from '@mui/icons-material/Cancel';
import DoneIcon from '@mui/icons-material/CheckCircleOutline';

/**
 * Rock status. Status is NEVER encoded by color alone (NFR-3.3): every status
 * carries a color role, an icon, and a text label, surfaced via StatusChip (T0.6).
 */
export type RockStatus = 'on-track' | 'at-risk' | 'off-track' | 'done';

/** MUI palette color role a status maps onto (semantic, theme-driven — never a raw hex). */
export type StatusColor = 'success' | 'warning' | 'error' | 'primary';

export interface StatusMeta {
  readonly label: string;
  readonly color: StatusColor;
  readonly icon: ComponentType<SvgIconProps>;
}

export const ROCK_STATUS_META: Readonly<Record<RockStatus, StatusMeta>> = {
  'on-track': { label: 'On track', color: 'success', icon: OnTrackIcon },
  'at-risk': { label: 'At risk', color: 'warning', icon: AtRiskIcon },
  'off-track': { label: 'Off track', color: 'error', icon: OffTrackIcon },
  done: { label: 'Done', color: 'primary', icon: DoneIcon },
};

export const ROCK_STATUSES = Object.keys(ROCK_STATUS_META) as readonly RockStatus[];
