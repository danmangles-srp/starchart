import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@mui/material/styles';
import type { ReactNode } from 'react';
import theme from '@/theme/theme';
import AppShell from './AppShell';

let params: Record<string, string> = {};
const push = vi.fn();
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useParams: () => params,
  useRouter: () => ({ push }),
}));
vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: { href: string; children: ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

function renderShell(viewer?: Parameters<typeof AppShell>[0]['viewer']) {
  return render(
    <ThemeProvider theme={theme}>
      <AppShell teams={[]} viewer={viewer}>
        <div>Main content</div>
      </AppShell>
    </ThemeProvider>,
  );
}

describe('AppShell', () => {
  beforeEach(() => {
    params = {};
    push.mockReset();
  });

  it('renders the brand, primary nav, module nav, and children', () => {
    renderShell();
    expect(screen.getAllByText('Cadence').length).toBeGreaterThan(0);
    expect(screen.getAllByText('My Week').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Rocks').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Admin').length).toBeGreaterThan(0);
    expect(screen.getByText('Main content')).toBeInTheDocument();
  });

  it('disables module links until a team is active', () => {
    renderShell();
    const rocks = screen.getAllByRole('button', { name: /Rocks/i });
    expect(
      rocks.some(
        (b) => b.getAttribute('aria-disabled') === 'true' || b.className.includes('Mui-disabled'),
      ),
    ).toBe(true);
  });

  it('links module nav to the active team from the URL', () => {
    params = { teamId: 'marketing' };
    renderShell();
    const link = screen.getAllByRole('link', { name: 'Rocks' })[0];
    expect(link).toHaveAttribute('href', '/t/marketing/rocks');
  });

  it('surfaces the signed-in user in the app bar when a viewer is passed (AC-1.3.1)', () => {
    renderShell({ name: 'Ada Lovelace', email: 'ada@acme.com', image: null, jobTitle: null });
    expect(screen.getByRole('button', { name: /Account: Ada Lovelace/ })).toBeInTheDocument();
  });

  it('shows the shared time anchor (current quarter + ISO week)', () => {
    renderShell();
    // label like "Q3 2026 · W40" — assert the quarter/week shape is present
    expect(screen.getByText(/Q[1-4] \d{4} · W\d{1,2}/)).toBeInTheDocument();
  });

  it('exposes a skip link to the main landmark (WCAG 2.4.1)', () => {
    renderShell();
    const skip = screen.getByRole('link', { name: /skip to main content/i });
    expect(skip).toHaveAttribute('href', '#main-content');
    const main = screen.getByRole('main');
    expect(main).toHaveAttribute('id', 'main-content');
  });

  it('offers a mobile search entry linking to /search', () => {
    renderShell();
    expect(screen.getByRole('link', { name: 'Search' })).toHaveAttribute('href', '/search');
  });

  it('submits the search box to /search', async () => {
    renderShell();
    const input = screen.getByRole('searchbox', { name: /search/i });
    await userEvent.type(input, 'launch{Enter}');
    expect(push).toHaveBeenCalledWith('/search?q=launch');
  });

  it('opens the temporary drawer from the menu button', async () => {
    renderShell();
    const menu = screen.getByRole('button', { name: /open navigation/i });
    await userEvent.click(menu);
    expect(await screen.findByRole('presentation')).toBeInTheDocument();
  });
});
