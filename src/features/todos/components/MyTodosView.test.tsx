import type { ReactNode } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@mui/material/styles';
import theme from '@/theme/theme';
import MyTodosView from './MyTodosView';
import type { TodoRow } from '../domain/todo';

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

const teams = [
  { id: 'mk1', name: 'Marketing' },
  { id: 'sa1', name: 'Sales' },
];

function td(
  over: Partial<TodoRow> & Pick<TodoRow, 'id' | 'teamId' | 'dueDate' | 'title'>,
): TodoRow {
  return {
    notes: null,
    ownerId: 'u1',
    ownerName: 'Alice',
    done: false,
    completedAt: null,
    sourceIssueId: null,
    sourceRockId: null,
    ...over,
  };
}

const todos: TodoRow[] = [
  td({ id: 'a', title: 'Call lead', teamId: 'sa1', dueDate: '2000-01-01T00:00:00.000Z' }), // overdue
  td({ id: 'b', title: 'Write post', teamId: 'mk1', dueDate: '2099-01-01T00:00:00.000Z' }),
];

function renderView(rows: TodoRow[]) {
  return render(
    <ThemeProvider theme={theme}>
      <MyTodosView todos={rows} teams={teams} />
    </ThemeProvider>,
  );
}

describe('MyTodosView', () => {
  it('shows the all-caught-up empty state', () => {
    renderView([]);
    expect(screen.getByText(/all caught up/i)).toBeInTheDocument();
  });

  it('groups by team, deep-links to each team, and flags overdue', () => {
    renderView(todos);
    const sales = screen.getByRole('region', { name: 'Sales' });
    const link = within(sales).getByRole('link', { name: /sales/i });
    expect(link).toHaveAttribute('href', '/t/sa1/todos');
    expect(within(sales).getByText('Call lead')).toBeInTheDocument();
    expect(within(sales).getAllByText(/overdue/i).length).toBeGreaterThan(0);
  });

  it('filters to a single team', async () => {
    const user = userEvent.setup();
    renderView(todos);
    await user.click(screen.getByLabelText('Team'));
    await user.click(await screen.findByRole('option', { name: 'Marketing' }));
    expect(screen.getByRole('region', { name: 'Marketing' })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Sales' })).not.toBeInTheDocument();
  });

  it('summarizes the open + overdue counts', () => {
    renderView(todos);
    expect(screen.getByText(/2 open across your teams · 1 overdue/i)).toBeInTheDocument();
  });
});
