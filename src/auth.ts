import NextAuth, { type NextAuthConfig } from 'next-auth';
import Google from 'next-auth/providers/google';
import MicrosoftEntraID from 'next-auth/providers/microsoft-entra-id';
import { PrismaAdapter } from '@auth/prisma-adapter';
import type { Adapter, AdapterUser } from 'next-auth/adapters';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { getServerEnv } from '@/lib/env';
import { parseAllowedDomains, isSignInAllowed, emailDomain } from '@/lib/auth/access';
import { getOrCreateDefaultOrg } from '@/features/org/data/resolveOrg';

// Read secrets through the typed, validated accessor (INV-11) rather than raw
// process.env — the same source the boot hook (src/instrumentation.ts) fails fast on.
const env = getServerEnv();
const allowedDomains = parseAllowedDomains(env.ALLOWED_EMAIL_DOMAINS);
const allowedTenantId = env.AUTH_MICROSOFT_ENTRA_ID_TENANT_ID || null;

/**
 * Prisma adapter with a createUser override that stamps the resolved orgId
 * (FR-2.7) — a person is created into their Organization at first sign-in.
 */
function orgScopedAdapter(): Adapter {
  const base = PrismaAdapter(db);
  return {
    ...base,
    createUser: async (data: AdapterUser) => {
      const org = await getOrCreateDefaultOrg(db);
      const created = await db.user.create({
        data: {
          email: data.email,
          emailVerified: data.emailVerified,
          name: data.name,
          image: data.image,
          orgId: org.id,
        },
      });
      return created as AdapterUser;
    },
  };
}

export const authConfig: NextAuthConfig = {
  adapter: orgScopedAdapter(),
  session: { strategy: 'database' },
  // Route auth errors (e.g. a denied domain/tenant → AccessDenied) back to our own
  // sign-in screen so the user sees a plain-language message (AC-1.1.3), not the
  // default Auth.js error page.
  pages: { signIn: '/sign-in', error: '/sign-in' },
  providers: [
    // Read the client pair from the typed env explicitly (INV-11) rather than relying
    // on Auth.js's implicit AUTH_GOOGLE_ID/SECRET inference — makes the wiring obvious
    // and keeps a single source of truth for secrets. An unset pair leaves the provider
    // unconfigured (its button simply fails), never a boot crash.
    Google({
      clientId: env.AUTH_GOOGLE_ID,
      clientSecret: env.AUTH_GOOGLE_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    MicrosoftEntraID({
      clientId: env.AUTH_MICROSOFT_ENTRA_ID_ID,
      clientSecret: env.AUTH_MICROSOFT_ENTRA_ID_SECRET,
      allowDangerousEmailAccountLinking: true,
      issuer: allowedTenantId
        ? `https://login.microsoftonline.com/${allowedTenantId}/v2.0`
        : undefined,
    }),
  ],
  callbacks: {
    // Server-side domain/tenant allowlist — the only gate that matters (AC-1.1.3).
    signIn: ({ user, account, profile }) => {
      const email = user.email ?? (typeof profile?.email === 'string' ? profile.email : null);
      const rawTid = (profile as { tid?: unknown } | undefined)?.tid;
      const tenantId = typeof rawTid === 'string' ? rawTid : null;
      const provider = account?.provider ?? 'unknown';
      const domain = email ? emailDomain(email) : null;
      // Debug surface (T3.7): an AUTH-tagged line on every OAuth callback so a failed
      // sign-in is diagnosable from logs (never logs the email itself, only its domain).
      logger('AUTH').info({ provider, domain }, 'sign-in callback');
      const allowed = isSignInAllowed(
        { email, provider, tenantId },
        { allowedDomains, allowedTenantId },
      );
      if (!allowed) {
        logger('AUTH').warn({ provider, domain }, 'sign-in denied by policy');
      }
      return allowed;
    },
    // Depends on session.strategy === 'database' (set above): `user` is the DB row,
    // the source of orgId/isAdmin for read-scoping. Do not switch to 'jwt' without reworking this.
    session: ({ session, user }) => {
      if (session.user) {
        session.user.id = user.id;
        session.user.orgId = user.orgId;
        session.user.isAdmin = user.isAdmin;
      }
      return session;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
