'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import NextLink from 'next/link';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import StatusChip from '@/components/StatusChip';
import type { RockStatus } from '@/theme/status';
import type { RockSummary } from '../domain/rock';
import { linkRockAction, unlinkRockAction } from '../server/actions';

export default function CompanyRockLinks({
  companyRockId,
  teamId,
  supporting,
  rolledUp,
  linkable,
  canEdit,
}: {
  companyRockId: string;
  teamId: string;
  supporting: RockSummary[];
  rolledUp: RockStatus;
  linkable: RockSummary[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [pick, setPick] = useState('');

  const act = (fn: () => Promise<{ ok: boolean; message?: string }>) => {
    setError(null);
    startTransition(async () => {
      const result = await fn();
      if (!result.ok) setError(result.message ?? 'Something went wrong.');
      else router.refresh();
    });
  };

  return (
    <Box sx={{ mt: 3, maxWidth: 680 }}>
      <Divider sx={{ mb: 2 }} />
      <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 1 }} flexWrap="wrap">
        <Typography variant="h6">Supporting Team Rocks</Typography>
        <Typography variant="body2" color="text.secondary">
          rolled up:
        </Typography>
        <StatusChip status={rolledUp} />
      </Stack>
      {error ? (
        <Alert severity="error" sx={{ mb: 1 }}>
          {error}
        </Alert>
      ) : null}

      {supporting.length === 0 ? (
        <Typography color="text.secondary">No supporting Team Rocks linked yet.</Typography>
      ) : (
        <Stack spacing={0.5}>
          {supporting.map((r) => (
            <Stack
              key={r.id}
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              gap={1}
            >
              <Typography
                component={NextLink}
                href={`/t/${teamId}/rocks/${r.id}`}
                sx={{
                  color: 'inherit',
                  textDecoration: 'none',
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                {r.title}
              </Typography>
              <Stack direction="row" alignItems="center" gap={1}>
                <StatusChip status={r.status} />
                {canEdit ? (
                  <Button
                    size="small"
                    color="error"
                    disabled={pending}
                    onClick={() =>
                      act(() => unlinkRockAction({ companyRockId, teamRockId: r.id, teamId }))
                    }
                  >
                    Unlink
                  </Button>
                ) : null}
              </Stack>
            </Stack>
          ))}
        </Stack>
      )}

      {canEdit && linkable.length > 0 ? (
        <Stack direction="row" gap={1} sx={{ mt: 2 }}>
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel id="link-rock-label">Link a Team Rock</InputLabel>
            <Select
              labelId="link-rock-label"
              label="Link a Team Rock"
              value={pick}
              onChange={(e) => setPick(e.target.value)}
            >
              {linkable.map((r) => (
                <MenuItem key={r.id} value={r.id}>
                  {r.title}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            disabled={pending || !pick}
            onClick={() => {
              const id = pick;
              setPick('');
              act(() => linkRockAction({ companyRockId, teamRockId: id, teamId }));
            }}
          >
            Link
          </Button>
        </Stack>
      ) : null}
    </Box>
  );
}
