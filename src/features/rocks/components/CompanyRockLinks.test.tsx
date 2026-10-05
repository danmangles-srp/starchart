import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@mui/material/styles';
import theme from '@/theme/theme';
import CompanyRockLinks from './CompanyRockLinks';
import type { RockSummary } from '../domain/rock';
import type { RockStatus } from '@/theme/status';

const h = vi.hoisted(() => ({
  refresh: vi.fn(),
  linkRockAction: vi.fn(async () => ({ ok: true, data: {} })),
  unlinkRockAction: vi.fn(async () => ({ ok: true, data: {} })),
}));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: h.refresh }) }));
vi.mock('../server/actions', () => ({
  linkRockAction: h.linkRockAction,
  unlinkRockAction: h.unlinkRockAction,
}));

function rock(id: string, status: RockStatus): RockSummary {
  return {
    id,
    title: id,
    ownerId: 'u1',
    ownerName: 'Alice',
    level: 'TEAM',
    teamId: 'mk1',
    fiscalYear: 2026,
    quarterIndex: 1,
    status,
    milestonesDone: 0,
    milestonesTotal: 0,
    dueDate: null,
  };
}

function renderLinks(rolledUp: RockStatus = 'off-track') {
  return render(
    <ThemeProvider theme={theme}>
      <CompanyRockLinks
        companyRockId="co1"
        teamId="mk1"
        supporting={[rock('S1', 'on-track'), rock('S2', 'off-track')]}
        rolledUp={rolledUp}
        linkable={[rock('Candidate', 'on-track')]}
        canEdit
      />
    </ThemeProvider>,
  );
}

describe('CompanyRockLinks', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows the supporting rocks and the rolled-up status', () => {
    renderLinks('off-track');
    expect(screen.getByText('Supporting Team Rocks')).toBeInTheDocument();
    expect(screen.getByText('S1')).toBeInTheDocument();
    expect(screen.getByText('S2')).toBeInTheDocument();
    // rolled-up chip (off-track) + S2's own chip → at least one "Off track"
    expect(screen.getAllByText('Off track').length).toBeGreaterThanOrEqual(1);
  });

  it('links a candidate team rock', async () => {
    renderLinks();
    await userEvent.click(screen.getByRole('combobox', { name: 'Link a Team Rock' }));
    await userEvent.click(screen.getByRole('option', { name: 'Candidate' }));
    await userEvent.click(screen.getByRole('button', { name: 'Link' }));
    await waitFor(() =>
      expect(h.linkRockAction).toHaveBeenCalledWith({
        companyRockId: 'co1',
        teamRockId: 'Candidate',
        teamId: 'mk1',
      }),
    );
  });

  it('unlinks a supporting rock', async () => {
    renderLinks();
    const [firstUnlink] = screen.getAllByRole('button', { name: 'Unlink' });
    if (!firstUnlink) throw new Error('expected an Unlink button');
    await userEvent.click(firstUnlink);
    await waitFor(() =>
      expect(h.unlinkRockAction).toHaveBeenCalledWith({
        companyRockId: 'co1',
        teamRockId: 'S1',
        teamId: 'mk1',
      }),
    );
  });
});
