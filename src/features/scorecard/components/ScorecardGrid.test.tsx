import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@mui/material/styles';
import theme from '@/theme/theme';
import ScorecardGrid from './ScorecardGrid';
import type { ScorecardVM } from '../domain/viewModel';

const h = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: h.push, refresh: vi.fn() }),
}));

function vm(overrides: Partial<ScorecardVM> = {}): ScorecardVM {
  return {
    teamId: 'mk1',
    offsetWeeks: 0,
    hasOlder: true,
    hasNewer: false,
    canEdit: true,
    weeks: [
      { key: '2026-40', isoYear: 2026, isoWeek: 40, label: 'W40', current: true },
      { key: '2026-39', isoYear: 2026, isoWeek: 39, label: 'W39', current: false },
      { key: '2026-38', isoYear: 2026, isoWeek: 38, label: 'W38', current: false },
    ],
    rows: [
      {
        id: 'm1',
        name: 'Calls',
        ownerName: 'Alice',
        goalLabel: '≥ 50 calls',
        summary: '1/2 on goal',
        cellsByWeek: {
          '2026-40': { value: 48, status: 'off', display: '48 calls' },
          '2026-39': { value: 60, status: 'on', display: '60 calls' },
          '2026-38': { value: null, status: 'empty', display: '—' },
        },
      },
    ],
    ...overrides,
  };
}

function renderGrid(model: ScorecardVM) {
  return render(
    <ThemeProvider theme={theme}>
      <ScorecardGrid vm={model} />
    </ThemeProvider>,
  );
}

describe('ScorecardGrid', () => {
  beforeEach(() => h.push.mockReset());

  it('renders the measurable with its owner, goal and hit-rate', () => {
    renderGrid(vm());
    expect(screen.getByText('Calls')).toBeInTheDocument();
    expect(screen.getByText(/Alice · ≥ 50 calls/)).toBeInTheDocument();
    expect(screen.getByText('1/2 on goal')).toBeInTheDocument();
  });

  it('shows value + marker + text status for each cell — never color alone', () => {
    renderGrid(vm());
    // aria-label carries the week, the value, and a textual goal status.
    const off = screen.getByLabelText('Week 40: 48 calls, off goal');
    const on = screen.getByLabelText('Week 39: 60 calls, on goal');
    const empty = screen.getByLabelText('Week 38: —, no entry');
    // each cell also renders a marker icon (svg), so status is not by color alone
    expect(off.querySelector('svg')).toBeInTheDocument();
    expect(on.querySelector('svg')).toBeInTheDocument();
    expect(empty.querySelector('svg')).toBeInTheDocument();
  });

  it('is a navigable grid of cells (arrow-key navigation surface)', () => {
    renderGrid(vm());
    expect(screen.getByRole('grid')).toBeInTheDocument();
    expect(screen.getAllByRole('gridcell').length).toBeGreaterThan(0);
  });

  it('marks the current week in the header', () => {
    renderGrid(vm());
    expect(screen.getByText(/W40.*now|now/)).toBeInTheDocument();
  });

  it('pages older/newer and disables Newer on the current window', async () => {
    const user = userEvent.setup();
    renderGrid(vm());
    const newer = screen.getByRole('button', { name: /newer/i });
    expect(newer).toBeDisabled();
    await user.click(screen.getByRole('button', { name: /older/i }));
    expect(h.push).toHaveBeenCalledWith('?w=13');
  });

  it('pages toward the current window from an older offset', async () => {
    const user = userEvent.setup();
    renderGrid(vm({ offsetWeeks: 26, hasNewer: true }));
    await user.click(screen.getByRole('button', { name: /newer/i }));
    expect(h.push).toHaveBeenCalledWith('?w=13');
  });

  it('shows an empty state when there are no measurables', () => {
    renderGrid(vm({ rows: [] }));
    expect(screen.getByText('No measurables yet')).toBeInTheDocument();
  });
});
