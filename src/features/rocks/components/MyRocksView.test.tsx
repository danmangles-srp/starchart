import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@mui/material/styles';
import theme from '@/theme/theme';
import MyRocksView from './MyRocksView';
import type { RockSummary } from '../domain/rock';

type Result = { ok: boolean; error?: string; message?: string; data?: unknown };
const h = vi.hoisted(() => ({
  push: vi.fn(),
  updateRockStatusAction: vi.fn(async (): Promise<Result> => ({ ok: true, data: {} })),
  createRockAction: vi.fn(async (): Promise<Result> => ({ ok: true, data: { id: 'x' } })),
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: h.push, refresh: vi.fn() }),
  usePathname: () => '/me/rocks',
}));
vi.mock('../server/actions', () => ({
  updateRockStatusAction: h.updateRockStatusAction,
  createRockAction: h.createRockAction,
}));

const base = {
  ownerId: 'me',
  ownerName: 'Me',
  level: 'INDIVIDUAL' as const,
  teamId: null,
  fiscalYear: 2026,
  quarterIndex: 1,
  milestonesDone: 0,
  milestonesTotal: 0,
  dueDate: null,
};
const rocks: RockSummary[] = [{ ...base, id: 'r1', title: 'Learn Rust', status: 'on-track' }];
const quarterOptions = [{ fiscalYear: 2026, quarterIndex: 1, label: 'Q1 2026' }];

function renderView(items = rocks) {
  return render(
    <ThemeProvider theme={theme}>
      <MyRocksView
        rocks={items}
        quarterOptions={quarterOptions}
        selected={{ fiscalYear: 2026, quarterIndex: 1 }}
        self={{ userId: 'me', name: 'Me' }}
      />
    </ThemeProvider>,
  );
}

describe('MyRocksView', () => {
  beforeEach(() => {
    h.updateRockStatusAction.mockReset();
    h.updateRockStatusAction.mockResolvedValue({ ok: true, data: {} });
    h.createRockAction.mockReset();
    h.createRockAction.mockResolvedValue({ ok: true, data: { id: 'x' } });
  });

  it('lists the viewer’s individual rocks', () => {
    renderView();
    expect(screen.getByRole('heading', { name: 'My Rocks' })).toBeInTheDocument();
    expect(screen.getByText('Learn Rust')).toBeInTheDocument();
  });

  it('shows an inviting empty state with no rocks', () => {
    renderView([]);
    expect(screen.getByText(/no personal rocks this quarter/i)).toBeInTheDocument();
  });

  it('creates an individual rock owned by the viewer', async () => {
    renderView([]);
    // Empty state shows a header + CTA Add button; open via the first.
    await userEvent.click(screen.getAllByRole('button', { name: 'Add Rock' })[0] as HTMLElement);
    await userEvent.type(await screen.findByLabelText('Title'), 'Run a marathon');
    await userEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Add Rock' }),
    );
    await waitFor(() =>
      expect(h.createRockAction).toHaveBeenCalledWith(
        expect.objectContaining({ level: 'INDIVIDUAL', ownerId: 'me', teamId: null }),
      ),
    );
  });

  it('optimistically updates a rock status', async () => {
    renderView();
    const card = screen.getByText('Learn Rust').closest('.MuiCard-root') as HTMLElement;
    await userEvent.click(within(card).getByRole('combobox'));
    await userEvent.click(screen.getByRole('option', { name: 'At risk' }));
    await waitFor(() =>
      expect(h.updateRockStatusAction).toHaveBeenCalledWith({ rockId: 'r1', status: 'at-risk' }),
    );
  });
});
