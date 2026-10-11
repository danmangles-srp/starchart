import { z } from 'zod';

/**
 * Server-only environment. Parsed + validated with Zod so a missing/invalid var
 * fails fast rather than surfacing as a confusing runtime error later (NFR-1,
 * setup.md). Never import this into client code — these are secrets.
 */
export const serverEnvSchema = z.object({
  // Always required — the app cannot run correctly without these.
  DATABASE_URL: z.string().url(),
  AUTH_SECRET: z.string().min(1),
  ALLOWED_EMAIL_DOMAINS: z.string().min(1),
  // OAuth client credentials are set per-deploy (Vercel) and read by Auth.js directly
  // from process.env; a provider whose pair is unset is simply unavailable. Optional
  // here so local dev / CI / `next build` don't require a fully provisioned IdP — the
  // required vars above still fail the boot fast (T8.1 / INV-11).
  AUTH_GOOGLE_ID: z.string().optional(),
  AUTH_GOOGLE_SECRET: z.string().optional(),
  AUTH_MICROSOFT_ENTRA_ID_ID: z.string().optional(),
  AUTH_MICROSOFT_ENTRA_ID_SECRET: z.string().optional(),
  AUTH_MICROSOFT_ENTRA_ID_TENANT_ID: z.string().optional(),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

/** Pure parser — unit-testable without touching process.env. */
export function parseServerEnv(raw: Record<string, string | undefined>): ServerEnv {
  const parsed = serverEnvSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid server environment — ${issues}`);
  }
  return parsed.data;
}

let cached: ServerEnv | undefined;

/** Validated process.env (memoized). Call from server code only, lazily. */
export function getServerEnv(): ServerEnv {
  cached ??= parseServerEnv(process.env);
  return cached;
}
