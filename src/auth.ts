import NextAuth, { type NextAuthConfig } from 'next-auth';
import Google from 'next-auth/providers/google';
import MicrosoftEntraID from 'next-auth/providers/microsoft-entra-id';
import { PrismaAdapter } from '@auth/prisma-adapter';
import type { Adapter, AdapterUser } from 'next-auth/adapters';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { parseAllowedDomains, isSignInAllowed } from '@/lib/auth/access';
import { getOrCreateDefaultOrg } from '@/features/org/data/resolveOrg';

const allowedDomains = parseAllowedDomains(process.env.ALLOWED_EMAIL_DOMAINS);
const allowedTenantId = process.env.AUTH_MICROSOFT_ENTRA_ID_TENANT_ID || null;

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
  pages: { signIn: '/sign-in' },
  providers: [
    Google({ allowDangerousEmailAccountLinking: true }),
    MicrosoftEntraID({
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
      const allowed = isSignInAllowed(
        { email, provider: account?.provider ?? 'unknown', tenantId },
        { allowedDomains, allowedTenantId },
      );
      if (!allowed) {
        logger('AUTH').warn({ provider: account?.provider }, 'sign-in denied by policy');
      }
      return allowed;
    },
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
