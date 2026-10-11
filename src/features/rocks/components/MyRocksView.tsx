'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useOptimisticAction } from '@/lib/optimistic/useOptimisticAction';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import EmptyState from '@/components/states/EmptyState';
import type { RockStatus } from '@/theme/status';
import type { RockSummary } from '../domain/rock';
import type { QuarterOption, QuarterKey } from '../domain/quarter';
import { updateRockStatusAction } from '../server/actions';
import RockCard from './RockCard';
import CreateRockDialog from './CreateRockDialog';
import QuarterSelect from './QuarterSelect';

/**
 * Personal "My Rocks" — the viewer's Individual rocks for a quarter (T8.4 / B1).
 * Individual rocks have no team, so they were previously unreachable; this surface
 * lists, creates (owner forced to the viewer), and lets the owner update status.
 */
export default function MyRocksView({
  rocks,
  quarterOptions,
  selected,
  self,
}: {
  rocks: RockSummary[];
  quarterOptions: QuarterOption[];
  selected: QuarterKey;
  self: { userId: string; name: string };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { state: items, run, isPending } = useOptimisticAction(rocks);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const changeQuarter = (value: string) => {
    const [fy, q] = value.split('-');
    router.push(`${pathname}?fy=${fy}&q=${q}`);
  };

  const changeStatus = (rockId: string, next: RockStatus) => {
    setError(null);
    run(
      (cur) => cur.map((r) => (r.id === rockId ? { ...r, status: next } : r)),
      () => updateRockStatusAction({ rockId, status: next }),
      (message) => setError(message),
    );
  };

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ sm: 'center' }}
        gap={2}
        sx={{ mb: 2 }}
      >
        <Typography variant="h4" component="h1">
          My Rocks
        </Typography>
        <Stack direction="row" gap={1} alignItems="center">
          <QuarterSelect
            quarterOptions={quarterOptions}
            selected={selected}
            onChange={changeQuarter}
          />
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
            Add Rock
          </Button>
        </Stack>
      </Stack>

      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}

      {items.length === 0 ? (
        <EmptyState
          title="No personal Rocks this quarter"
          description="Individual Rocks are your own quarterly priorities. Add your first to get started."
          action={
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
              Add Rock
            </Button>
          }
        />
      ) : (
        <Stack spacing={1.5}>
          {items.map((rock) => (
            <RockCard
              key={rock.id}
              rock={rock}
              disabled={isPending}
              onStatusChange={(next) => changeStatus(rock.id, next)}
            />
          ))}
        </Stack>
      )}

      <CreateRockDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        allowedLevels={['INDIVIDUAL']}
        fixedOwner={self}
        quarter={selected}
      />
    </Box>
  );
}
