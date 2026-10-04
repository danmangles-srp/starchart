import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@mui/material/styles';
import theme from '@/theme/theme';
import RocksView from './RocksView';
import type { RockSummary } from '../domain/rock';

const push = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  usePathname: () => '/t/mk1/rocks',
}));

function rock(partial: Partial<RockSummary> & { id: string }): RockSummary {
  return {
    title: partial.id,
    ownerId: 'u1',
    ownerName: 'Alice',
    level: 'TEAM',
    teamId: 'mk1',
    fiscalYear: 2026,
    quarterIndex: 1,
    status: 'on-track',
    milestonesDone: 0,
    milestonesTotal: 0,
    dueDate: null,
    ...partial,
  };
}

const rocks: RockSummary[] = [
  rock({ id: 'Launch', status: 'on-track', ownerId: 'u1', ownerName: 'Alice' }),
  rock({ id: 'Hire', status: 'off-track', ownerId: 'u2', ownerName: 'Bob' }),
];
const quarterOptions = [
  { fiscalYear: 2026, quarterIndex: 1, label: 'Q1 2026' },
  { fiscalYear: 2026, quarterIndex: 2, label: 'Q2 2026' },
];

function renderView(items = rocks) {
  return render(
    <ThemeProvider theme={theme}>
      <RocksView
        rocks={items}
        quarterOptions={quarterOptions}
        selected={{ fiscalYear: 2026, quarterIndex: 1 }}
      />
    </ThemeProvider>,
  );
}

describe('RocksView', () => {
  beforeEach(() => push.mockReset());

  it('lists the quarter rocks with a quarter selector', () => {
    renderView();
    expect(screen.getByText('Launch')).toBeInTheDocument();
    expect(screen.getByText('Hire')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Quarter' })).toBeInTheDocument();
  });

  it('filters by status', async () => {
    renderView();
    await userEvent.click(screen.getByRole('combobox', { name: 'Status' }));
    await userEvent.click(screen.getByRole('option', { name: 'Off track' }));
    expect(screen.queryByText('Launch')).not.toBeInTheDocument();
    expect(screen.getByText('Hire')).toBeInTheDocument();
  });

  it('changes quarter via the URL', async () => {
    renderView();
    await userEvent.click(screen.getByRole('combobox', { name: 'Quarter' }));
    await userEvent.click(screen.getByRole('option', { name: 'Q2 2026' }));
    expect(push).toHaveBeenCalledWith('/t/mk1/rocks?fy=2026&q=2');
  });

  it('shows an inviting empty state', () => {
    renderView([]);
    expect(screen.getByText(/no rocks here yet/i)).toBeInTheDocument();
  });
});
