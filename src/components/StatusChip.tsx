import Chip from '@mui/material/Chip';
import { ROCK_STATUS_META, type RockStatus } from '@/theme/status';

/**
 * Rock status as color + icon + label — never color alone (INV-6 / NFR-3.3).
 * The single place status is rendered, reused across Rocks, dashboards, My Week.
 */
export default function StatusChip({
  status,
  size = 'small',
}: {
  status: RockStatus;
  size?: 'small' | 'medium';
}) {
  const { label, color, icon: Icon } = ROCK_STATUS_META[status];
  return (
    <Chip
      size={size}
      color={color}
      variant="outlined"
      icon={<Icon fontSize="small" />}
      label={label}
      aria-label={`Status: ${label}`}
    />
  );
}
