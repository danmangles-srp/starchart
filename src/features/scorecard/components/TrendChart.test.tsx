import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import theme from '@/theme/theme';
import TrendChart from './TrendChart';
import { buildTrend } from '../domain/trend';
import type { ScorecardRowVM, WeekColumn } from '../domain/viewModel';

const weeks: WeekColumn[] = [
  { key: '2026-40', isoYear: 2026, isoWeek: 40, label: 'W40', current: true },
  { key: '2026-39', isoYear: 2026, isoWeek: 39, label: 'W39', current: false },
];

const row: ScorecardRowVM = {
  id: 'm1',
  name: 'Revenue',
  ownerId: 'u1',
  ownerName: 'Alice',
  goalLabel: '≥ 1000',
  summary: '1/2 on goal',
  comparator: 'GTE',
  goalValue: 1000,
  goalMax: null,
  format: 'CURRENCY',
  unit: null,
  cellsByWeek: {
    '2026-40': { value: 1200, status: 'on', display: '$1200' },
    '2026-39': { value: null, status: 'empty', display: '—' },
  },
};

function renderChart() {
  return render(
    <ThemeProvider theme={theme}>
      <TrendChart row={row} trend={buildTrend(row, weeks)} />
    </ThemeProvider>,
  );
}

describe('TrendChart', () => {
  it('provides a text-alternative table with a summarizing caption', () => {
    renderChart();
    const table = screen.getByRole('table');
    expect(within(table).getByText(/Trend for Revenue/)).toBeInTheDocument();
    expect(within(table).getByText(/1\/1 on goal/)).toBeInTheDocument();
  });

  it('lists each week with its formatted value and status (empty ≠ 0)', () => {
    renderChart();
    const table = screen.getByRole('table');
    // oldest-first: W39 empty, then W40 on goal
    const rows = within(table).getAllByRole('row');
    // header row + 2 data rows
    expect(rows).toHaveLength(3);
    expect(within(table).getByText('$1200')).toBeInTheDocument();
    expect(within(table).getByText('—')).toBeInTheDocument();
    expect(within(table).getByText('no entry')).toBeInTheDocument();
    expect(within(table).getByText('on goal')).toBeInTheDocument();
  });
});
