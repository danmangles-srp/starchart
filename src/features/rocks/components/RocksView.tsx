'use client';

import { useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import EmptyState from '@/components/states/EmptyState';
import { ROCK_STATUSES, ROCK_STATUS_META } from '@/theme/status';
import type { RockSummary, RockLevel } from '../domain/rock';
import type { QuarterOption, QuarterKey } from '../domain/quarter';
import RockCard from './RockCard';

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
}: {
  rocks: RockSummary[];
  quarterOptions: QuarterOption[];
  selected: QuarterKey;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [owner, setOwner] = useState('all');
  const [status, setStatus] = useState('all');
  const [level, setLevel] = useState('all');

  const owners = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of rocks) map.set(r.ownerId, r.ownerName);
    return [...map].map(([id, name]) => ({ id, name }));
  }, [rocks]);

  const filtered = rocks.filter(
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
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel id="quarter-label">Quarter</InputLabel>
          <Select
            labelId="quarter-label"
            label="Quarter"
            value={selectedValue}
            onChange={(e) => changeQuarter(e.target.value)}
          >
            {!hasSelected ? (
              <MenuItem value={selectedValue}>
                {`Q${selected.quarterIndex} ${selected.fiscalYear}`}
              </MenuItem>
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
      </Stack>

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
        />
      ) : (
        <Stack spacing={1.5}>
          {filtered.map((rock) => (
            <RockCard key={rock.id} rock={rock} />
          ))}
        </Stack>
      )}
    </Box>
  );
}
