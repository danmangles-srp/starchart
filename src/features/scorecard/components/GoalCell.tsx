'use client';

import Box from '@mui/material/Box';
import type { ScorecardCell, WeekColumn } from '../domain/viewModel';
import { GOAL_STATUS_META } from './goalStatusMeta';

/**
 * One Scorecard cell: the week's value with a color role AND a marker icon AND
 * a text label for assistive tech — never color alone (INV-6 / NFR-3.3).
 * Empty is neutral (muted em dash), distinct from a real 0.
 */
export default function GoalCell({ cell, week }: { cell: ScorecardCell; week: WeekColumn }) {
  const meta = GOAL_STATUS_META[cell.status] ?? GOAL_STATUS_META.empty;
  const Icon = meta.icon;
  const isColored = meta.color !== 'default';
  // One tone for both the icon and the value, so empty cells read consistently.
  const tone = isColored ? `${meta.color}.main` : 'text.secondary';

  return (
    <Box
      aria-label={`Week ${week.isoWeek}: ${cell.display}, ${meta.label}`}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 0.5,
        width: '100%',
        height: '100%',
        color: tone,
        fontVariantNumeric: 'tabular-nums',
        fontWeight: isColored ? 600 : 400,
      }}
    >
      <Icon fontSize="small" aria-hidden sx={{ color: tone }} />
      <span>{cell.display}</span>
    </Box>
  );
}
