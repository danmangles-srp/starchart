import NextLink from 'next/link';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import StatusChip from '@/components/StatusChip';
import { ROCK_STATUSES, ROCK_STATUS_META, type RockStatus } from '@/theme/status';
import { milestoneProgress, type RockSummary } from '../domain/rock';

export default function RockCard({
  rock,
  onStatusChange,
  disabled = false,
}: {
  rock: RockSummary;
  onStatusChange?: (status: RockStatus) => void;
  disabled?: boolean;
}) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="subtitle1"
              fontWeight={600}
              noWrap
              component={NextLink}
              href={rock.teamId ? `/t/${rock.teamId}/rocks/${rock.id}` : '#'}
              sx={{
                color: 'inherit',
                textDecoration: 'none',
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              {rock.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {rock.ownerName} · {rock.level.toLowerCase()}
            </Typography>
            {rock.milestonesTotal > 0 ? (
              <Typography variant="caption" color="text.secondary">
                Milestones {milestoneProgress(rock.milestonesDone, rock.milestonesTotal)}
              </Typography>
            ) : null}
          </Box>
          {onStatusChange ? (
            <Select
              size="small"
              value={rock.status}
              disabled={disabled}
              aria-label={`Status for ${rock.title}`}
              onChange={(e) => onStatusChange(e.target.value as RockStatus)}
              sx={{ minWidth: 150 }}
            >
              {ROCK_STATUSES.map((s) => (
                <MenuItem key={s} value={s}>
                  {ROCK_STATUS_META[s].label}
                </MenuItem>
              ))}
            </Select>
          ) : (
            <StatusChip status={rock.status} />
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
