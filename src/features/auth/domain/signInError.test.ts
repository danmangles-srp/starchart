import { describe, it, expect } from 'vitest';
import { signInErrorMessage } from './signInError';

describe('signInErrorMessage', () => {
  it('returns null when there is no error', () => {
    expect(signInErrorMessage(undefined)).toBeNull();
  });
  it('explains a domain/tenant denial in plain language (AC-1.1.3)', () => {
    const msg = signInErrorMessage('AccessDenied');
    expect(msg).toMatch(/allowed company domain|tenant/i);
  });
  it('falls back to a generic message for other codes without leaking internals', () => {
    expect(signInErrorMessage('Configuration')).toBe(
      'Something went wrong signing in. Please try again.',
    );
    expect(signInErrorMessage('OAuthCallback')).toMatch(/went wrong/i);
  });
});
