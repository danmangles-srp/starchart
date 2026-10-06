import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@mui/material/styles';
import theme from '@/theme/theme';
import IssuesView from './IssuesView';
import type { IssueListType, IssueRow } from '../domain/issue';

type Result = { ok: boolean; error?: string; message?: string; data?: unknown };
const h = vi.hoisted(() => ({
  refresh: vi.fn(),
  createIssueAction: vi.fn(async (): Promise<Result> => ({ ok: true, data: { id: 'x' } })),
  reorderIssuesAction: vi.fn(async (): Promise<Result> => ({ ok: true, data: {} })),
  moveIssueAction: vi.fn(async (): Promise<Result> => ({ ok: true, data: {} })),
  solveIssueAction: vi.fn(async (): Promise<Result> => ({ ok: true, data: { teamId: 'mk1' } })),
  reopenIssueAction: vi.fn(async (): Promise<Result> => ({ ok: true, data: {} })),
}));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: h.refresh, push: vi.fn() }) }));
vi.mock('../server/actions', () => ({
  createIssueAction: h.createIssueAction,
  reorderIssuesAction: h.reorderIssuesAction,
  moveIssueAction: h.moveIssueAction,
  solveIssueAction: h.solveIssueAction,
  reopenIssueAction: h.reopenIssueAction,
}));

const members = [{ userId: 'u1', name: 'Alice' }];

let seq = 0;
function issue(title: string, listType: IssueListType, over: Partial<IssueRow> = {}): IssueRow {
  seq += 1;
  return {
    id: `i${seq}`,
    title,
    description: null,
    teamId: 'mk1',
    raiserId: 'u1',
    raiserName: 'Alice',
    ownerId: null,
    ownerName: null,
    listType,
    rank: seq,
    solved: false,
    solvedAt: null,
    solvedById: null,
    resolutionNote: null,
    createdTodoId: null,
    createdRockId: null,
    ...over,
  };
}

function renderView(issues: IssueRow[], canEdit = true) {
  return render(
    <ThemeProvider theme={theme}>
      <IssuesView teamId="mk1" issues={issues} members={members} canEdit={canEdit} />
    </ThemeProvider>,
  );
}

describe('IssuesView', () => {
  beforeEach(() => {
    seq = 0;
    h.refresh.mockReset();
    h.createIssueAction.mockReset().mockResolvedValue({ ok: true, data: { id: 'x' } });
    h.reorderIssuesAction.mockReset().mockResolvedValue({ ok: true, data: {} });
    h.moveIssueAction.mockReset().mockResolvedValue({ ok: true, data: {} });
    h.solveIssueAction.mockReset().mockResolvedValue({ ok: true, data: { teamId: 'mk1' } });
    h.reopenIssueAction.mockReset().mockResolvedValue({ ok: true, data: {} });
  });

  it('shows the empty state when there are no open issues', () => {
    renderView([]);
    expect(screen.getByText('No issues yet')).toBeInTheDocument();
  });

  it('splits short-term and long-term lists', () => {
    renderView([issue('Slow site', 'SHORT'), issue('Rebrand', 'LONG')]);
    const shortList = screen.getByRole('region', { name: /short-term/i });
    const longList = screen.getByRole('region', { name: /long-term/i });
    expect(within(shortList).getByText('Slow site')).toBeInTheDocument();
    expect(within(longList).getByText('Rebrand')).toBeInTheDocument();
  });

  it('emphasizes the top 3 short-term issues with rank badges', () => {
    renderView([
      issue('One', 'SHORT'),
      issue('Two', 'SHORT'),
      issue('Three', 'SHORT'),
      issue('Four', 'SHORT'),
    ]);
    const shortList = screen.getByRole('region', { name: /short-term/i });
    expect(within(shortList).getByText('#1')).toBeInTheDocument();
    expect(within(shortList).getByText('#3')).toBeInTheDocument();
    expect(within(shortList).queryByText('#4')).not.toBeInTheDocument(); // only top 3
  });

  it('raises an issue through the dialog', async () => {
    const user = userEvent.setup();
    renderView([]);
    await user.click(screen.getByRole('button', { name: /raise an issue/i }));
    await user.type(screen.getByLabelText('Title'), 'Printer broken');
    await user.click(screen.getByRole('button', { name: /^add$/i }));
    await waitFor(() =>
      expect(h.createIssueAction).toHaveBeenCalledWith(
        expect.objectContaining({ teamId: 'mk1', title: 'Printer broken', listType: 'SHORT' }),
      ),
    );
    expect(h.refresh).toHaveBeenCalled();
  });

  it('validates a required title', async () => {
    const user = userEvent.setup();
    renderView([]);
    await user.click(screen.getByRole('button', { name: /raise an issue/i }));
    await user.click(screen.getByRole('button', { name: /^add$/i }));
    expect(await screen.findByText('Title is required')).toBeInTheDocument();
    expect(h.createIssueAction).not.toHaveBeenCalled();
  });

  it('hides add controls when the viewer cannot edit', () => {
    renderView([issue('Slow site', 'SHORT')], false);
    expect(screen.queryByRole('button', { name: /^add$/i })).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/^reorder /i)).not.toBeInTheDocument();
  });

  it('moves an issue to the other list', async () => {
    const user = userEvent.setup();
    renderView([issue('Slow site', 'SHORT')]);
    await user.click(screen.getByLabelText(/move to long-term: slow site/i));
    await waitFor(() =>
      expect(h.moveIssueAction).toHaveBeenCalledWith({ issueId: 'i1', toListType: 'LONG' }),
    );
    expect(h.refresh).toHaveBeenCalled();
  });

  it('solves an issue with a resolution note (optimistic, moves to Solved)', async () => {
    const user = userEvent.setup();
    renderView([issue('Slow site', 'SHORT')]);
    await user.click(screen.getByLabelText(/solve slow site/i));
    await user.type(screen.getByLabelText(/resolution note/i), 'Upgraded host');
    await user.click(screen.getByRole('button', { name: /mark solved/i }));
    await waitFor(() =>
      expect(h.solveIssueAction).toHaveBeenCalledWith({
        issueId: 'i1',
        resolutionNote: 'Upgraded host',
      }),
    );
    // optimistically appears under Solved
    const solvedSection = await screen.findByRole('region', { name: 'Solved' });
    expect(within(solvedSection).getByText('Slow site')).toBeInTheDocument();
  });

  it('reopens a solved issue from the Solved section', async () => {
    const user = userEvent.setup();
    renderView([
      issue('Old bug', 'SHORT', {
        solved: true,
        solvedAt: '2026-10-01T00:00:00.000Z',
        resolutionNote: 'Done',
      }),
    ]);
    const solvedSection = screen.getByRole('region', { name: 'Solved' });
    await user.click(within(solvedSection).getByRole('button', { name: /reopen/i }));
    await waitFor(() => expect(h.reopenIssueAction).toHaveBeenCalledWith({ issueId: 'i1' }));
  });
});
