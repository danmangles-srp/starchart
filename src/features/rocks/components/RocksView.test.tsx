import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@mui/material/styles';
import theme from '@/theme/theme';
import RocksView from './RocksView';
import type { RockSummary } from '../domain/rock';

type Result = { ok: boolean; error?: string; message?: string; data?: unknown };
const h = vi.hoisted(() => ({
  push: vi.fn(),
  updateRockStatusAction: vi.fn(async (): Promise<Result> => ({ ok: true, data: {} })),
  createRockAction: vi.fn(async (): Promise<Result> => ({ ok: true, data: { id: 'x' } })),
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: h.push, refresh: vi.fn() }),
  usePathname: () => '/t/mk1/rocks',
}));
vi.mock('../server/actions', () => ({
  updateRockStatusAction: h.updateRockStatusAction,
  createRockAction: h.createRockAction,
}));

const base = {
  ownerId: 'u1',
  ownerName: 'Alice',
  level: 'TEAM' as const,
  teamId: 'mk1',
  fiscalYear: 2026,
  quarterIndex: 1,
  milestonesDone: 0,
  milestonesTotal: 0,
  dueDate: null,
};
const rocks: RockSummary[] = [
  { ...base, id: 'r1', title: 'Launch', status: 'on-track' },
  { ...base, id: 'r2', title: 'Hire', ownerId: 'u2', ownerName: 'Bob', status: 'off-track' },
];
const quarterOptions = [
  { fiscalYear: 2026, quarterIndex: 1, label: 'Q1 2026' },
  { fiscalYear: 2026, quarterIndex: 2, label: 'Q2 2026' },
];
const members = [
  { userId: 'u1', name: 'Alice' },
  { userId: 'u2', name: 'Bob' },
];

function renderView(items = rocks) {
  return render(
    <ThemeProvider theme={theme}>
      <RocksView
        rocks={items}
        quarterOptions={quarterOptions}
        selected={{ fiscalYear: 2026, quarterIndex: 1 }}
        teamId="mk1"
        members={members}
      />
    </ThemeProvider>,
  );
}

describe('RocksView', () => {
  beforeEach(() => {
    h.push.mockReset();
    h.updateRockStatusAction.mockReset();
    h.updateRockStatusAction.mockResolvedValue({ ok: true, data: {} });
  });

  it('lists rocks with a quarter selector', () => {
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
    expect(h.push).toHaveBeenCalledWith('/t/mk1/rocks?fy=2026&q=2');
  });

  function launchCard() {
    return screen.getByText('Launch').closest('.MuiCard-root') as HTMLElement;
  }

  it('optimistically updates a rock status', async () => {
    renderView();
    await userEvent.click(within(launchCard()).getByRole('combobox'));
    await userEvent.click(screen.getByRole('option', { name: 'At risk' }));
    await waitFor(() =>
      expect(h.updateRockStatusAction).toHaveBeenCalledWith({ rockId: 'r1', status: 'at-risk' }),
    );
  });

  it('rolls back + surfaces an error when the status save fails', async () => {
    h.updateRockStatusAction.mockResolvedValue({
      ok: false,
      error: 'forbidden',
      message: 'Quarter is closed',
    });
    renderView();
    await userEvent.click(within(launchCard()).getByRole('combobox'));
    await userEvent.click(screen.getByRole('option', { name: 'Done' }));
    expect(await screen.findByText('Quarter is closed')).toBeInTheDocument();
  });

  it('shows an inviting empty state', () => {
    renderView([]);
    expect(screen.getByText(/no rocks here yet/i)).toBeInTheDocument();
  });
});
