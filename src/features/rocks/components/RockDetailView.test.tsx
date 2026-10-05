import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@mui/material/styles';
import theme from '@/theme/theme';
import RockDetailView from './RockDetailView';
import type { RockDetail } from '../domain/rock';

const h = vi.hoisted(() => ({
  refresh: vi.fn(),
  addMilestoneAction: vi.fn(async () => ({ ok: true, data: { id: 'm3' } })),
  toggleMilestoneAction: vi.fn(async () => ({ ok: true, data: {} })),
  reorderMilestonesAction: vi.fn(async () => ({ ok: true, data: {} })),
}));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: h.refresh }) }));
vi.mock('../server/actions', () => ({
  addMilestoneAction: h.addMilestoneAction,
  toggleMilestoneAction: h.toggleMilestoneAction,
  reorderMilestonesAction: h.reorderMilestonesAction,
}));

const rock: RockDetail = {
  id: 'r1',
  title: 'Launch',
  description: 'Ship the thing',
  ownerId: 'u1',
  ownerName: 'Alice',
  level: 'TEAM',
  teamId: 'mk1',
  fiscalYear: 2026,
  quarterIndex: 1,
  status: 'on-track',
  dueDate: null,
  milestones: [
    { id: 'm1', title: 'Spec', dueDate: null, done: false, order: 1 },
    { id: 'm2', title: 'Build', dueDate: null, done: true, order: 2 },
  ],
};

function renderView(canEdit = true) {
  return render(
    <ThemeProvider theme={theme}>
      <RockDetailView rock={rock} canEdit={canEdit} />
    </ThemeProvider>,
  );
}

describe('RockDetailView', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows milestone progress', () => {
    renderView();
    expect(screen.getByText(/Milestones 1\/2/)).toBeInTheDocument();
  });

  it('toggles a milestone', async () => {
    renderView();
    await userEvent.click(screen.getByRole('checkbox', { name: 'Milestone Spec' }));
    await waitFor(() =>
      expect(h.toggleMilestoneAction).toHaveBeenCalledWith({
        rockId: 'r1',
        milestoneId: 'm1',
        done: true,
      }),
    );
  });

  it('adds a milestone', async () => {
    renderView();
    await userEvent.type(screen.getByLabelText('New milestone'), 'Launch day');
    await userEvent.click(screen.getByRole('button', { name: 'Add' }));
    await waitFor(() =>
      expect(h.addMilestoneAction).toHaveBeenCalledWith({ rockId: 'r1', title: 'Launch day' }),
    );
  });

  it('is read-only when the viewer cannot edit', () => {
    renderView(false);
    expect(screen.queryByLabelText('New milestone')).not.toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Milestone Spec' })).toBeDisabled();
  });
});
