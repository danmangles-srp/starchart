/**
 * Pure sign-in access rules (FR-1.1 / AC-1.1.3-4). No framework, no DB — the
 * server-side gate the Auth.js signIn callback delegates to, and fully unit-tested.
 */

export function emailDomain(email: string): string | null {
  const at = email.lastIndexOf('@');
  if (at < 1 || at === email.length - 1) return null;
  return email.slice(at + 1).toLowerCase();
}

/** Parse the comma-separated ALLOWED_EMAIL_DOMAINS env value into a clean list. */
export function parseAllowedDomains(raw: string | undefined | null): string[] {
  return (raw ?? '')
    .split(',')
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);
}

export function isEmailDomainAllowed(
  email: string | null | undefined,
  allowedDomains: string[],
): boolean {
  if (!email) return false;
  const domain = emailDomain(email);
  return domain !== null && allowedDomains.includes(domain);
}

export interface SignInAttempt {
  email: string | null | undefined;
  provider: string;
  /** Microsoft Entra tenant id (the `tid` claim); null for Google. */
  tenantId?: string | null;
}

export interface SignInPolicy {
  allowedDomains: string[];
  /** When set, Microsoft sign-ins must come from this Entra tenant. */
  allowedTenantId?: string | null;
}

/**
 * Allowed only when the email's domain is on the allowlist and, for Microsoft,
 * the tenant matches when one is configured. Account linking is safe on top of
 * this because both IdPs verify email against company-controlled sources (AC-1.1.4).
 */
export function isSignInAllowed(attempt: SignInAttempt, policy: SignInPolicy): boolean {
  if (!isEmailDomainAllowed(attempt.email, policy.allowedDomains)) return false;
  if (attempt.provider === 'microsoft-entra-id') {
    // Microsoft is tenant-restricted (FR-2.7 / NFR-4.1): fail closed — require a
    // configured tenant AND a matching tid, never fall back to multi-tenant "common".
    if (!policy.allowedTenantId) return false;
    return attempt.tenantId === policy.allowedTenantId;
  }
  return true;
}
