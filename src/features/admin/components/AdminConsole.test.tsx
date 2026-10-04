import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@mui/material/styles';
import theme from '@/theme/theme';

const h = vi.hoisted(() => ({
  createTeamAction: vi.fn(async () => ({ ok: true, data: { id: 't9', name: 'Growth' } })),
  archiveTeamAction: vi.fn(async () => ({ ok: true, data: {} })),
  addMembershipAction: vi.fn(async () => ({ ok: true, data: {} })),
  removeMembershipAction: vi.fn(async () => ({ ok: true, data: {} })),
  setUserAdminAction: vi.fn(async () => ({ ok: true, data: {} })),
  upsertQuarterAction: vi.fn(async () => ({ ok: true, data: {} })),
  refresh: vi.fn(),
}));

vi.mock('@/features/admin/server/actions', () => ({
  createTeamAction: h.createTeamAction,
  archiveTeamAction: h.archiveTeamAction,
  addMembershipAction: h.addMembershipAction,
  removeMembershipAction: h.removeMembershipAction,
  setUserAdminAction: h.setUserAdminAction,
  upsertQuarterAction: h.upsertQuarterAction,
}));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: h.refresh }) }));

import AdminConsole, { type AdminData } from './AdminConsole';

const data: AdminData = {
  teams: [
    {
      id: 'lead',
      name: 'Leadership Team',
      isLeadership: true,
      departmentId: null,
      archivedAt: null,
    },
    {
      id: 'mk1',
      name: 'Marketing Team 1',
      isLeadership: false,
      departmentId: 'd1',
      archivedAt: null,
    },
  ],
  departments: [{ id: 'd1', name: 'Marketing' }],
  users: [
    {
      id: 'u1',
      email: 'lee@example.com',
      name: 'Lee',
      isAdmin: false,
      memberships: [{ teamId: 'mk1', teamRole: 'MEMBER' }],
    },
  ],
  quarters: [
    {
      id: 'q1',
      fiscalYear: 2026,
      index: 1,
      label: 'Q1 2026',
      startsOn: '2026-01-01',
      endsOn: '2026-03-31',
    },
  ],
};

function renderConsole() {
  return render(
    <ThemeProvider theme={theme}>
      <AdminConsole data={data} />
    </ThemeProvider>,
  );
}

describe('AdminConsole', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders the management sections', () => {
    renderConsole();
    expect(screen.getByRole('heading', { name: 'Admin' })).toBeInTheDocument();
    expect(screen.getByText('Teams')).toBeInTheDocument();
    expect(screen.getByText(/People/)).toBeInTheDocument();
    expect(screen.getByText('Quarter definitions')).toBeInTheDocument();
  });

  it('creates a team', async () => {
    renderConsole();
    await userEvent.type(screen.getByLabelText('New team name'), 'Growth');
    await userEvent.click(screen.getByRole('button', { name: /add team/i }));
    await waitFor(() =>
      expect(h.createTeamAction).toHaveBeenCalledWith({ name: 'Growth', departmentId: null }),
    );
  });

  it('confirms before archiving a team', async () => {
    renderConsole();
    await userEvent.click(screen.getByRole('button', { name: 'Archive' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Confirm' }));
    await waitFor(() => expect(h.archiveTeamAction).toHaveBeenCalledWith({ teamId: 'mk1' }));
  });

  it('toggles a user to admin', async () => {
    renderConsole();
    await userEvent.click(screen.getByRole('checkbox', { name: /admin/i }));
    await waitFor(() =>
      expect(h.setUserAdminAction).toHaveBeenCalledWith({ userId: 'u1', isAdmin: true }),
    );
  });
});
