import type { ReactNode } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import theme from '@/theme/theme';
import MyWeekView from './MyWeekView';
import type { MyWeekData } from '../domain/home';
import type { RockSummary } from '@/features/rocks/domain/rock';
import type { TodoRow } from '@/features/todos/domain/todo';
import type { IssueRow } from '@/features/issues/domain/issue';
import type { MeasurableStatusRow } from '@/features/scorecard/data/scorecardRepo';

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

const rock: RockSummary = {
  id: 'r1',
  title: 'Launch v2',
  ownerId: 'u1',
  ownerName: 'A',
  level: 'TEAM',
  teamId: 'mk1',
  fiscalYear: 2026,
  quarterIndex: 4,
  status: 'off-track',
  milestonesDone: 0,
  milestonesTotal: 0,
  dueDate: null,
};
const todo: TodoRow = {
  id: 't1',
  title: 'Email supplier',
  notes: null,
  ownerId: 'u1',
  ownerName: 'A',
  teamId: 'mk1',
  dueDate: '2026-10-20T00:00:00.000Z',
  done: false,
  completedAt: null,
  sourceIssueId: null,
  sourceRockId: null,
};
const measurable: MeasurableStatusRow = {
  id: 'm1',
  name: 'Leads',
  teamId: 'mk1',
  ownerId: 'u1',
  ownerName: 'A',
  goalValue: 50,
  goalMax: null,
  comparator: 'GTE',
  format: 'NUMBER',
  unit: null,
  order: 1,
  latestValue: 10,
  status: 'off',
};
const issue: IssueRow = {
  id: 'i1',
  title: 'Site down',
  description: null,
  teamId: 'mk1',
  raiserId: 'u2',
  raiserName: 'B',
  ownerId: 'u1',
  ownerName: 'A',
  listType: 'SHORT',
  rank: 1,
  solved: false,
  solvedAt: null,
  solvedById: null,
  resolutionNote: null,
  createdTodoId: null,
  createdRockId: null,
};

function renderView(data: MyWeekData) {
  return render(
    <ThemeProvider theme={theme}>
      <MyWeekView data={data} />
    </ThemeProvider>,
  );
}

describe('MyWeekView', () => {
  it('shows the all-set empty state when nothing is assigned', () => {
    renderView({ rocks: [], todos: [], measurables: [], issues: [] });
    expect(screen.getByText(/all set/i)).toBeInTheDocument();
  });

  it('renders the four panels with items and an attention count', () => {
    renderView({ rocks: [rock], todos: [todo], measurables: [measurable], issues: [issue] });
    // off-track rock + overdue-or-not todo (future) + off-goal measurable → attention = 2 (rock + measurable)
    expect(screen.getByText(/2 items need attention/i)).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'My Rocks' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'My Todos' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Off-goal measurables' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'My Issues' })).toBeInTheDocument();
  });

  it('deep-links items to their team modules (INV-8)', () => {
    renderView({ rocks: [rock], todos: [todo], measurables: [measurable], issues: [issue] });
    expect(
      within(screen.getByRole('region', { name: 'My Rocks' })).getByRole('link', {
        name: 'Launch v2',
      }),
    ).toHaveAttribute('href', '/t/mk1/rocks');
    expect(
      within(screen.getByRole('region', { name: 'My Todos' })).getByRole('link', {
        name: 'Email supplier',
      }),
    ).toHaveAttribute('href', '/t/mk1/todos');
    expect(
      within(screen.getByRole('region', { name: 'My Issues' })).getByRole('link', {
        name: 'Site down',
      }),
    ).toHaveAttribute('href', '/t/mk1/issues');
    // Todos panel header links to the aggregate page
    expect(
      within(screen.getByRole('region', { name: 'My Todos' })).getByRole('link', {
        name: 'My Todos',
      }),
    ).toHaveAttribute('href', '/me/todos');
    expect(
      within(screen.getByRole('region', { name: 'Off-goal measurables' })).getByRole('link', {
        name: 'Leads',
      }),
    ).toHaveAttribute('href', '/t/mk1/scorecard');
  });

  it('shows per-panel empty text for an empty panel while others have items', () => {
    renderView({ rocks: [rock], todos: [], measurables: [], issues: [] });
    const todos = screen.getByRole('region', { name: 'My Todos' });
    expect(within(todos).getByText('No open todos.')).toBeInTheDocument();
  });
});
