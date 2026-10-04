import type { ComponentType } from 'react';
import type { SvgIconProps } from '@mui/material/SvgIcon';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/ChangeHistory';
import CancelIcon from '@mui/icons-material/Cancel';
import CircleIcon from '@mui/icons-material/CheckCircleOutline';

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
  'on-track': { label: 'On track', color: 'success', icon: CheckCircleIcon },
  'at-risk': { label: 'At risk', color: 'warning', icon: WarningIcon },
  'off-track': { label: 'Off track', color: 'error', icon: CancelIcon },
  done: { label: 'Done', color: 'primary', icon: CircleIcon },
};

export const ROCK_STATUSES = Object.keys(ROCK_STATUS_META) as readonly RockStatus[];
