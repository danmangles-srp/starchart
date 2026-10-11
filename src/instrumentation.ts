/**
 * Next.js instrumentation hook — runs once per server instance at boot (Node.js
 * runtime only; never during `next build` for our all-dynamic routes, never in the
 * browser/edge). Validating the server environment here makes a missing or invalid
 * secret fail the boot with a readable message (NFR-1 / NFR-4.2 / INV-11) instead of
 * surfacing as a confusing error on the first request. `getServerEnv()` memoizes, so
 * every later read is free.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  const { getServerEnv } = await import('@/lib/env');
  const { logger } = await import('@/lib/logger');
  getServerEnv();
  logger('CORE').debug('server environment validated at boot');
}
