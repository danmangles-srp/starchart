'use client';

import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import type { QuarterOption, QuarterKey } from '../domain/quarter';

/**
 * Quarter picker shared by the team Rocks board and personal "My Rocks" (T8.4).
 * Emits the selected `"fiscalYear-quarterIndex"` string; the caller routes it.
 * If the active quarter isn't among the options it's shown as a leading entry so
 * the control never renders empty.
 */
export default function QuarterSelect({
  quarterOptions,
  selected,
  onChange,
}: {
  quarterOptions: QuarterOption[];
  selected: QuarterKey;
  onChange: (value: string) => void;
}) {
  const selectedValue = `${selected.fiscalYear}-${selected.quarterIndex}`;
  const hasSelected = quarterOptions.some(
    (o) => `${o.fiscalYear}-${o.quarterIndex}` === selectedValue,
  );
  return (
    <FormControl size="small" sx={{ minWidth: 150 }}>
      <InputLabel id="quarter-label">Quarter</InputLabel>
      <Select
        labelId="quarter-label"
        label="Quarter"
        value={selectedValue}
        onChange={(e) => onChange(e.target.value)}
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
  );
}
