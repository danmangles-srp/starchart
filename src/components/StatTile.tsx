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
// color alone (INV-6 / NFR-3.3).
const TONE: Record<StatTone, { color: string; icon: ComponentType<SvgIconProps> }> = {
  success: { color: 'success.main', icon: CheckCircleIcon },
  error: { color: 'error.main', icon: ErrorIcon },
  warning: { color: 'warning.main', icon: WarningIcon },
  neutral: { color: 'text.secondary', icon: CircleIcon },
};

/**
 * A dashboard stat tile (T8.10): a prominent number with its label and a
 * tone-matched icon — replacing the old chip-walls. One accessible label
 * ("<label>: <value>") names the whole tile for screen readers.
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
      role="group"
      aria-label={`${label}: ${value}`}
      sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}
    >
      <Icon aria-hidden sx={{ color, fontSize: 22, flexShrink: 0 }} />
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="h6" component="div" lineHeight={1.1} sx={{ color }}>
          {value}
        </Typography>
        <Typography variant="caption" color="text.secondary" noWrap>
          {label}
        </Typography>
      </Box>
    </Paper>
  );
}
