import type { ReactNode } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@mui/material/styles';
import theme from '@/theme/theme';

vi.mock('next-auth/react', () => ({ signOut: vi.fn() }));
vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: { href: string; children: ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

import ProfileMenu from './ProfileMenu';

function renderMenu(identity?: Partial<Parameters<typeof ProfileMenu>[0]['identity']>) {
  return render(
    <ThemeProvider theme={theme}>
      <ProfileMenu
        identity={{
          name: 'Ada Lovelace',
          email: 'ada@acme.com',
          image: null,
          jobTitle: 'Engineer',
          ...identity,
        }}
      />
    </ThemeProvider>,
  );
}

describe('ProfileMenu', () => {
  it('shows the signed-in name on the account control (AC-1.3.1)', () => {
    renderMenu();
    expect(screen.getByRole('button', { name: /Account: Ada Lovelace/ })).toBeInTheDocument();
    // Avatar fallback initials when no image.
    expect(screen.getByText('AL')).toBeInTheDocument();
  });

  it('opens a menu with a profile link and sign-out', async () => {
    renderMenu();
    await userEvent.click(screen.getByRole('button', { name: /Account/ }));
    const profile = await screen.findByRole('menuitem', { name: 'Profile' });
    expect(profile).toHaveAttribute('href', '/me');
    expect(screen.getByRole('menuitem', { name: 'Sign out' })).toBeInTheDocument();
  });

  it('falls back to the email when there is no name', () => {
    renderMenu({ name: null });
    expect(screen.getByRole('button', { name: /Account: ada@acme.com/ })).toBeInTheDocument();
  });
});
