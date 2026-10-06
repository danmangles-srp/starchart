import { describe, it, expect } from 'vitest';
import { buildTrend } from './trend';
import type { ScorecardRowVM, WeekColumn } from './viewModel';

const weeks: WeekColumn[] = [
  { key: '2026-40', isoYear: 2026, isoWeek: 40, label: 'W40', current: true },
  { key: '2026-39', isoYear: 2026, isoWeek: 39, label: 'W39', current: false },
  { key: '2026-38', isoYear: 2026, isoWeek: 38, label: 'W38', current: false },
];

const row: ScorecardRowVM = {
  id: 'm1',
  name: 'Calls',
  ownerId: 'u1',
  ownerName: 'Alice',
  goalLabel: '≥ 50',
  summary: '',
  comparator: 'GTE',
  goalValue: 50,
  goalMax: null,
  format: 'NUMBER',
  unit: null,
  cellsByWeek: {
    '2026-40': { value: 60, status: 'on', display: '60' },
    '2026-39': { value: null, status: 'empty', display: '—' },
    '2026-38': { value: 40, status: 'off', display: '40' },
  },
};

describe('buildTrend', () => {
  it('orders points oldest-first for the time axis', () => {
    const t = buildTrend(row, weeks);
    expect(t.points.map((p) => p.key)).toEqual(['2026-38', '2026-39', '2026-40']);
  });

  it('carries per-point value + status, keeping empty distinct from 0', () => {
    const t = buildTrend(row, weeks);
    expect(t.points.map((p) => p.value)).toEqual([40, null, 60]);
    expect(t.points.map((p) => p.status)).toEqual(['off', 'empty', 'on']);
  });

  it('summarizes over entered weeks only', () => {
    const t = buildTrend(row, weeks);
    expect(t.entered).toBe(2);
    expect(t.average).toBe(50); // (40 + 60) / 2
    expect(t.onGoal).toBe(1);
    expect(t.hitRate).toBe('1/2 on goal');
    expect(t.goal).toBe(50);
  });
});
