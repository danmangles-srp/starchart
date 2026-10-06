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

function renderShell() {
  return render(
    <ThemeProvider theme={theme}>
      <AppShell teams={[]}>
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
    const link = screen.getAllByRole('link', { name: /Rocks/i })[0];
    expect(link).toHaveAttribute('href', '/t/marketing/rocks');
  });

  it('shows the shared time anchor (current quarter + ISO week)', () => {
    renderShell();
    // label like "Q3 2026 · W40" — assert the quarter/week shape is present
    expect(screen.getByText(/Q[1-4] \d{4} · W\d{1,2}/)).toBeInTheDocument();
  });

  it('opens the temporary drawer from the menu button', async () => {
    renderShell();
    const menu = screen.getByRole('button', { name: /open navigation/i });
    await userEvent.click(menu);
    expect(await screen.findByRole('presentation')).toBeInTheDocument();
  });
});
