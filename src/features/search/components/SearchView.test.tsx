import type { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@mui/material/styles';
import theme from '@/theme/theme';
import SearchView from './SearchView';
import type { SearchResult } from '../domain/search';

const h = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: h.push }) }));
vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

function result(type: SearchResult['type'], id: string, title: string): SearchResult {
  return { type, id, title, teamId: 'mk1', teamName: 'Marketing' };
}

function renderView(query: string, results: SearchResult[]) {
  return render(
    <ThemeProvider theme={theme}>
      <SearchView query={query} results={results} />
    </ThemeProvider>,
  );
}

describe('SearchView', () => {
  beforeEach(() => h.push.mockReset());

  it('submits the on-page search box to /search', async () => {
    const user = userEvent.setup();
    renderView('', []);
    await user.type(screen.getByRole('searchbox', { name: /search/i }), 'launch{Enter}');
    expect(h.push).toHaveBeenCalledWith('/search?q=launch');
  });

  it('prompts when the query is too short', () => {
    renderView('a', []);
    expect(screen.getByText(/at least 2 characters/i)).toBeInTheDocument();
  });

  it('shows a no-matches state for a searchable query with no results', () => {
    renderView('zzz', []);
    expect(screen.getByText('No matches')).toBeInTheDocument();
  });

  it('groups results and deep-links each to its team module (INV-8)', () => {
    renderView('la', [result('rock', 'r1', 'Launch'), result('todo', 't1', 'Lay plan')]);
    const rocks = screen.getByRole('region', { name: 'Rocks' });
    expect(within(rocks).getByRole('link', { name: 'Launch' })).toHaveAttribute(
      'href',
      '/t/mk1/rocks',
    );
    const todos = screen.getByRole('region', { name: 'Todos' });
    expect(within(todos).getByRole('link', { name: 'Lay plan' })).toHaveAttribute(
      'href',
      '/t/mk1/todos',
    );
  });
});
