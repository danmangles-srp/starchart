'use client';

import { useMemo, useState, useTransition } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import AddIcon from '@mui/icons-material/Add';
import EmptyState from '@/components/states/EmptyState';
import { ROCK_STATUSES, ROCK_STATUS_META, type RockStatus } from '@/theme/status';
import type { RockSummary, RockLevel } from '../domain/rock';
import type { QuarterOption, QuarterKey } from '../domain/quarter';
import { updateRockStatusAction } from '../server/actions';
import RockCard from './RockCard';
import CreateRockDialog from './CreateRockDialog';

const LEVELS: RockLevel[] = ['COMPANY', 'TEAM', 'INDIVIDUAL'];

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <FormControl size="small" sx={{ minWidth: 150 }}>
      <InputLabel id={`${label}-label`}>{label}</InputLabel>
      <Select
        labelId={`${label}-label`}
        label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <MenuItem key={o.value} value={o.value}>
            {o.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

export default function RocksView({
  rocks,
  quarterOptions,
  selected,
  teamId,
  members,
}: {
  rocks: RockSummary[];
  quarterOptions: QuarterOption[];
  selected: QuarterKey;
  teamId: string;
  members: { userId: string; name: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [items, setItems] = useState(rocks);
  const [prevRocks, setPrevRocks] = useState(rocks);
  const [owner, setOwner] = useState('all');
  const [status, setStatus] = useState('all');
  const [level, setLevel] = useState('all');
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  // Resync when the server sends a new set (quarter change / refresh) — render-time
  // reset rather than an effect (no cascading-render lint, React-recommended pattern).
  if (rocks !== prevRocks) {
    setPrevRocks(rocks);
    setItems(rocks);
  }

  const owners = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of items) map.set(r.ownerId, r.ownerName);
    return [...map].map(([id, name]) => ({ id, name }));
  }, [items]);

  const filtered = items.filter(
    (r) =>
      (owner === 'all' || r.ownerId === owner) &&
      (status === 'all' || r.status === status) &&
      (level === 'all' || r.level === level),
  );

  const selectedValue = `${selected.fiscalYear}-${selected.quarterIndex}`;
  const hasSelected = quarterOptions.some(
    (o) => `${o.fiscalYear}-${o.quarterIndex}` === selectedValue,
  );

  const changeQuarter = (value: string) => {
    const [fy, q] = value.split('-');
    router.push(`${pathname}?fy=${fy}&q=${q}`);
  };

  // Optimistic status change with rollback (NFR-5.1).
  const changeStatus = (rockId: string, next: RockStatus) => {
    const previous = items;
    setError(null);
    setItems((cur) => cur.map((r) => (r.id === rockId ? { ...r, status: next } : r)));
    startTransition(async () => {
      const result = await updateRockStatusAction({ rockId, status: next });
      if (!result.ok) {
        setItems(previous);
        setError(result.message);
      }
    });
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
          Rocks
        </Typography>
        <Stack direction="row" gap={1} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="quarter-label">Quarter</InputLabel>
            <Select
              labelId="quarter-label"
              label="Quarter"
              value={selectedValue}
              onChange={(e) => changeQuarter(e.target.value)}
            >
              {!hasSelected ? (
                <MenuItem
                  value={selectedValue}
                >{`Q${selected.quarterIndex} ${selected.fiscalYear}`}</MenuItem>
              ) : null}
              {quarterOptions.map((o) => (
                <MenuItem
                  key={`${o.fiscalYear}-${o.quarterIndex}`}
                  value={`${o.fiscalYear}-${o.quarterIndex}`}
                >
                  {o.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
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

      <Stack direction="row" gap={1} flexWrap="wrap" sx={{ mb: 2 }}>
        <FilterSelect
          label="Owner"
          value={owner}
          onChange={setOwner}
          options={[
            { value: 'all', label: 'All owners' },
            ...owners.map((o) => ({ value: o.id, label: o.name })),
          ]}
        />
        <FilterSelect
          label="Status"
          value={status}
          onChange={setStatus}
          options={[
            { value: 'all', label: 'All statuses' },
            ...ROCK_STATUSES.map((s) => ({ value: s, label: ROCK_STATUS_META[s].label })),
          ]}
        />
        <FilterSelect
          label="Level"
          value={level}
          onChange={setLevel}
          options={[
            { value: 'all', label: 'All levels' },
            ...LEVELS.map((l) => ({ value: l, label: l[0] + l.slice(1).toLowerCase() })),
          ]}
        />
      </Stack>

      {filtered.length === 0 ? (
        <EmptyState
          title="No Rocks here yet"
          description="No Rocks match this quarter and filter. Add your team's first Rock to get started."
          action={
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
              Add Rock
            </Button>
          }
        />
      ) : (
        <Stack spacing={1.5}>
          {filtered.map((rock) => (
            <RockCard
              key={rock.id}
              rock={rock}
              disabled={pending}
              onStatusChange={(next) => changeStatus(rock.id, next)}
            />
          ))}
        </Stack>
      )}

      <CreateRockDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        teamId={teamId}
        members={members}
        quarter={selected}
      />
    </Box>
  );
}
