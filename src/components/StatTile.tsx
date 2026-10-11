import type { ComponentType } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import type { SvgIconProps } from '@mui/material/SvgIcon';
import CheckCircleIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorIcon from '@mui/icons-material/ErrorOutline';
import WarningIcon from '@mui/icons-material/WarningAmberOutlined';
import CircleIcon from '@mui/icons-material/RadioButtonUncheckedOutlined';

export type StatTone = 'success' | 'error' | 'warning' | 'neutral';

// Each tone carries BOTH a color and an icon, so meaning is never conveyed by
// color alone (INV-6 / NFR-3.3). The color rides on the icon (a graphical object,
// 3:1) — never on the number text, which must stay at the 4.5:1 AA text floor.
const TONE: Record<StatTone, { color: string; icon: ComponentType<SvgIconProps> }> = {
  success: { color: 'success.main', icon: CheckCircleIcon },
  error: { color: 'error.main', icon: ErrorIcon },
  warning: { color: 'warning.main', icon: WarningIcon },
  neutral: { color: 'text.secondary', icon: CircleIcon },
};

/**
 * A dashboard stat tile (T8.10): a prominent, high-contrast number with its label
 * and a tone-matched icon — replacing the old chip-walls. `role="img"` with a
 * combined label makes a screen reader announce the tile as one unit
 * ("<label>: <value>"), reliably, in reading mode.
 */
export default function StatTile({
  label,
  value,
  tone = 'neutral',
}: {
  label: string;
  value: number;
  tone?: StatTone;
}) {
  const { color, icon: Icon } = TONE[tone];
  return (
    <Paper
      variant="outlined"
      role="img"
      aria-label={`${label}: ${value}`}
      sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}
    >
      <Icon aria-hidden sx={{ color, fontSize: 22, flexShrink: 0 }} />
      <Box aria-hidden sx={{ minWidth: 0 }}>
        <Typography variant="h6" component="div" lineHeight={1.1}>
          {value}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
      </Box>
    </Paper>
  );
}
