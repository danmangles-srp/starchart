import { describe, it, expect } from 'vitest';
import { normalizeEntryValue, recomputeCell, applyCellEdit, findChangedWeek } from './editing';
import type { ScorecardRowVM, WeekColumn } from './viewModel';

const weeks: WeekColumn[] = [
  { key: '2026-40', isoYear: 2026, isoWeek: 40, label: 'W40', current: true },
  { key: '2026-39', isoYear: 2026, isoWeek: 39, label: 'W39', current: false },
];

function row(): ScorecardRowVM {
  return {
    id: 'm1',
    name: 'Calls',
    ownerName: 'Alice',
    goalLabel: '≥ 50',
    summary: '0/1 on goal',
    comparator: 'GTE',
    goalValue: 50,
    goalMax: null,
    format: 'NUMBER',
    unit: null,
    cellsByWeek: {
      '2026-40': { value: 48, status: 'off', display: '48' },
      '2026-39': { value: null, status: 'empty', display: '—' },
    },
  };
}

describe('normalizeEntryValue', () => {
  it('clears to null for blank/invalid, keeps a real 0', () => {
    expect(normalizeEntryValue('')).toBeNull();
    expect(normalizeEntryValue(null)).toBeNull();
    expect(normalizeEntryValue(undefined)).toBeNull();
    expect(normalizeEntryValue('abc')).toBeNull();
    expect(normalizeEntryValue(0)).toBe(0);
    expect(normalizeEntryValue('5')).toBe(5);
    expect(normalizeEntryValue(3.2)).toBe(3.2);
  });
});

describe('recomputeCell / applyCellEdit', () => {
  it('re-evaluates status + display, keeping empty distinct from 0', () => {
    const r = row();
    expect(recomputeCell(r, 60)).toEqual({ value: 60, status: 'on', display: '60' });
    expect(recomputeCell(r, 0)).toEqual({ value: 0, status: 'off', display: '0' });
    expect(recomputeCell(r, null)).toEqual({ value: null, status: 'empty', display: '—' });
  });

  it('returns a new row with only the edited week changed', () => {
    const r = row();
    const next = applyCellEdit(r, '2026-40', 60);
    expect(next).not.toBe(r);
    expect(next.cellsByWeek['2026-40']).toEqual({ value: 60, status: 'on', display: '60' });
    expect(next.cellsByWeek['2026-39']).toEqual(r.cellsByWeek['2026-39']);
  });
});

describe('findChangedWeek', () => {
  it('finds the single edited week', () => {
    const before = row();
    const after = applyCellEdit(before, '2026-39', 0); // null → 0 is a change
    expect(findChangedWeek(after, before, weeks)?.key).toBe('2026-39');
  });

  it('returns null when nothing changed', () => {
    const r = row();
    expect(findChangedWeek(r, r, weeks)).toBeNull();
  });
});
