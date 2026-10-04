import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const signIn = vi.fn();
vi.mock('next-auth/react', () => ({ signIn: (...args: unknown[]) => signIn(...args) }));

import SignInButtons from './SignInButtons';

describe('SignInButtons', () => {
  beforeEach(() => signIn.mockReset());

  it('offers exactly Google and Microsoft', () => {
    render(<SignInButtons />);
    expect(screen.getByRole('button', { name: /sign in with google/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in with microsoft/i })).toBeInTheDocument();
  });

  it('starts the right provider flow on click', async () => {
    render(<SignInButtons />);
    await userEvent.click(screen.getByRole('button', { name: /google/i }));
    expect(signIn).toHaveBeenCalledWith('google', { callbackUrl: '/' });
    await userEvent.click(screen.getByRole('button', { name: /microsoft/i }));
    expect(signIn).toHaveBeenCalledWith('microsoft-entra-id', { callbackUrl: '/' });
  });
});
