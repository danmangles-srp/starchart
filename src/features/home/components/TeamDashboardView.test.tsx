import type { ReactNode } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import theme from '@/theme/theme';
import TeamDashboardView from './TeamDashboardView';
import type { TeamSummaries } from '../domain/home';

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

const data: TeamSummaries = {
  rocks: { total: 5, onTrack: 2, atRisk: 1, offTrack: 1, done: 1 },
  scorecard: { total: 4, onGoal: 3, offGoal: 1, empty: 0 },
  todos: { total: 6, open: 4, overdue: 2, done: 2 },
  issues: { total: 3, shortOpen: 2, longOpen: 1, solved: 0 },
};

function renderView() {
  return render(
    <ThemeProvider theme={theme}>
      <TeamDashboardView teamId="mk1" teamName="Marketing" data={data} />
    </ThemeProvider>,
  );
}

describe('TeamDashboardView', () => {
  it('shows the team name and four module cards', () => {
    renderView();
    expect(screen.getByRole('heading', { name: 'Marketing' })).toBeInTheDocument();
    for (const name of ['Rocks', 'Scorecard', 'Issues', 'Todos']) {
      expect(screen.getByRole('region', { name })).toBeInTheDocument();
    }
  });

  it('renders counts with text labels (not color alone)', () => {
    renderView();
    const rocks = screen.getByRole('region', { name: 'Rocks' });
    expect(within(rocks).getByText('On track: 2')).toBeInTheDocument();
    expect(within(rocks).getByText('Off track: 1')).toBeInTheDocument();
    const todos = screen.getByRole('region', { name: 'Todos' });
    expect(within(todos).getByText('Overdue: 2')).toBeInTheDocument();
  });

  it('links each card to its team module (INV-8)', () => {
    renderView();
    expect(within(screen.getByRole('region', { name: 'Rocks' })).getByRole('link')).toHaveAttribute(
      'href',
      '/t/mk1/rocks',
    );
    expect(
      within(screen.getByRole('region', { name: 'Scorecard' })).getByRole('link'),
    ).toHaveAttribute('href', '/t/mk1/scorecard');
    expect(
      within(screen.getByRole('region', { name: 'Issues' })).getByRole('link'),
    ).toHaveAttribute('href', '/t/mk1/issues');
    expect(within(screen.getByRole('region', { name: 'Todos' })).getByRole('link')).toHaveAttribute(
      'href',
      '/t/mk1/todos',
    );
  });
});
