import { describe, it, expect } from 'vitest';
import { emailDomain, parseAllowedDomains, isEmailDomainAllowed, isSignInAllowed } from './access';

describe('emailDomain', () => {
  it('extracts and lowercases the domain', () => {
    expect(emailDomain('Dan@SRPSoftware.com')).toBe('srpsoftware.com');
  });
  it('rejects malformed emails', () => {
    expect(emailDomain('no-at')).toBeNull();
    expect(emailDomain('trailing@')).toBeNull();
    expect(emailDomain('@leading.com')).toBeNull();
  });
});

describe('parseAllowedDomains', () => {
  it('splits, trims, lowercases, and drops blanks', () => {
    expect(parseAllowedDomains(' A.com, b.COM ,, ')).toEqual(['a.com', 'b.com']);
    expect(parseAllowedDomains(undefined)).toEqual([]);
  });
});

describe('isEmailDomainAllowed', () => {
  const domains = ['srpsoftware.com'];
  it('allows a listed domain and denies others / blanks', () => {
    expect(isEmailDomainAllowed('dan@srpsoftware.com', domains)).toBe(true);
    expect(isEmailDomainAllowed('dan@evil.com', domains)).toBe(false);
    expect(isEmailDomainAllowed(null, domains)).toBe(false);
  });
});

describe('isSignInAllowed', () => {
  const policy = { allowedDomains: ['srpsoftware.com'], allowedTenantId: 'tenant-1' };

  it('allows a Google sign-in on an allowed domain', () => {
    expect(isSignInAllowed({ email: 'dan@srpsoftware.com', provider: 'google' }, policy)).toBe(
      true,
    );
  });
  it('denies any provider on a non-allowed domain', () => {
    expect(isSignInAllowed({ email: 'x@other.com', provider: 'google' }, policy)).toBe(false);
    expect(
      isSignInAllowed(
        { email: 'x@other.com', provider: 'microsoft-entra-id', tenantId: 'tenant-1' },
        policy,
      ),
    ).toBe(false);
  });
  it('allows Microsoft only from the configured tenant', () => {
    expect(
      isSignInAllowed(
        { email: 'dan@srpsoftware.com', provider: 'microsoft-entra-id', tenantId: 'tenant-1' },
        policy,
      ),
    ).toBe(true);
    expect(
      isSignInAllowed(
        { email: 'dan@srpsoftware.com', provider: 'microsoft-entra-id', tenantId: 'other' },
        policy,
      ),
    ).toBe(false);
  });
  it('skips the tenant check when no tenant is configured', () => {
    expect(
      isSignInAllowed(
        { email: 'dan@srpsoftware.com', provider: 'microsoft-entra-id', tenantId: null },
        { allowedDomains: ['srpsoftware.com'] },
      ),
    ).toBe(true);
  });
});
