import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@mui/material/styles';
import type { ReactNode } from 'react';
import theme from '@/theme/theme';
import AppShell from './AppShell';

vi.mock('next/navigation', () => ({ usePathname: () => '/' }));
vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: { href: string; children: ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

function renderShell(props: { activeTeamId?: string | null } = {}) {
  return render(
    <ThemeProvider theme={theme}>
      <AppShell {...props}>
        <div>Main content</div>
      </AppShell>
    </ThemeProvider>,
  );
}

describe('AppShell', () => {
  it('renders the brand, primary nav, module nav, and children', () => {
    renderShell();
    expect(screen.getAllByText('Cadence').length).toBeGreaterThan(0);
    expect(screen.getAllByText('My Week').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Rocks').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Admin').length).toBeGreaterThan(0);
    expect(screen.getByText('Main content')).toBeInTheDocument();
  });

  it('disables module links until a team is active', () => {
    renderShell({ activeTeamId: null });
    const rocks = screen.getAllByRole('button', { name: /Rocks/i });
    expect(rocks.length).toBeGreaterThan(0);
    expect(
      rocks.some(
        (b) => b.getAttribute('aria-disabled') === 'true' || b.className.includes('Mui-disabled'),
      ),
    ).toBe(true);
  });

  it('links module nav to the active team', () => {
    renderShell({ activeTeamId: 'marketing' });
    const link = screen.getAllByRole('link', { name: /Rocks/i })[0];
    expect(link).toHaveAttribute('href', '/t/marketing/rocks');
  });

  it('opens the temporary drawer from the menu button', async () => {
    renderShell();
    const menu = screen.getByRole('button', { name: /open navigation/i });
    await userEvent.click(menu);
    expect(await screen.findByRole('presentation')).toBeInTheDocument();
  });
});
