'use client';

import { useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useOptimisticAction } from '@/lib/optimistic/useOptimisticAction';
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
  allowedLevels,
  companyRocks,
}: {
  rocks: RockSummary[];
  quarterOptions: QuarterOption[];
  selected: QuarterKey;
  teamId: string;
  members: { userId: string; name: string }[];
  allowedLevels: RockLevel[];
  /** When provided (the Leadership board), the org's Company Rocks render above team rocks. */
  companyRocks?: RockSummary[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  // One optimistic seam (INV-5): base is the server prop (re-fetched on a quarter
  // change); a status change applies instantly and rolls back on failure.
  const { state: items, run, isPending } = useOptimisticAction(rocks);
  const canEditCompany = allowedLevels.includes('COMPANY');
  const {
    state: company,
    run: runCompany,
    isPending: companyPending,
  } = useOptimisticAction(companyRocks ?? []);
  const [owner, setOwner] = useState('all');
  const [status, setStatus] = useState('all');
  const [level, setLevel] = useState('all');
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

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
    setError(null);
    run(
      (cur) => cur.map((r) => (r.id === rockId ? { ...r, status: next } : r)),
      () => updateRockStatusAction({ rockId, status: next }),
      (message) => setError(message),
    );
  };

  const changeCompanyStatus = (rockId: string, next: RockStatus) => {
    setError(null);
    runCompany(
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
          {allowedLevels.length > 0 ? (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
              Add Rock
            </Button>
          ) : null}
        </Stack>
      </Stack>

      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}

      {companyRocks !== undefined ? (
        <Box component="section" aria-label="Company Rocks" sx={{ mb: 3 }}>
          <Typography variant="h6" component="h2" sx={{ mb: 1 }}>
            Company Rocks
          </Typography>
          {company.length === 0 ? (
            <EmptyState
              title="No Company Rocks yet"
              description="Company Rocks set the org-wide priorities for the quarter. Add one from here."
            />
          ) : (
            <Stack spacing={1.5}>
              {company.map((rock) => (
                <RockCard
                  key={rock.id}
                  rock={rock}
                  disabled={companyPending}
                  onStatusChange={
                    canEditCompany ? (next) => changeCompanyStatus(rock.id, next) : undefined
                  }
                />
              ))}
            </Stack>
          )}
          <Typography variant="h6" component="h2" sx={{ mt: 3, mb: 1 }}>
            Team Rocks
          </Typography>
        </Box>
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
            allowedLevels.length > 0 ? (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setDialogOpen(true)}
              >
                Add Rock
              </Button>
            ) : undefined
          }
        />
      ) : (
        <Stack spacing={1.5}>
          {filtered.map((rock) => (
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
        teamId={teamId}
        members={members}
        allowedLevels={allowedLevels}
        quarter={selected}
      />
    </Box>
  );
}
