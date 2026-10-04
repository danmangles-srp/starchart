import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import StatusChip from '@/components/StatusChip';
import { milestoneProgress, type RockSummary } from '../domain/rock';

export default function RockCard({ rock }: { rock: RockSummary }) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle1" fontWeight={600} noWrap>
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
          <StatusChip status={rock.status} />
        </Stack>
      </CardContent>
    </Card>
  );
}
