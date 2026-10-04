import type { ZodType } from 'zod';
import { logger } from '@/lib/logger';
import { AppError, type ActionResult } from './errors';
import type { Viewer } from './permissions';

// Lazy so importing this module doesn't pull in next-auth (and next/server) — keeps
// the wrapper unit-testable without a Next runtime. requireUser loads at call time.
async function defaultGetViewer(): Promise<Viewer> {
  const { requireUser } = await import('./requireUser');
  return requireUser();
}

interface AuthorizedActionConfig<TInput, TResult> {
  /** Validate the untrusted client input. */
  schema: ZodType<TInput>;
  /** Server-side authorization (role + team). Return false to reject with 403/forbidden. */
  authorize: (viewer: Viewer, input: TInput) => boolean | Promise<boolean>;
  /** The write. Runs only after validation + authorization pass. */
  handler: (ctx: { viewer: Viewer; input: TInput }) => Promise<TResult>;
  /** Optional audit hook (activity log) run on success — INV-10. */
  audit?: (ctx: { viewer: Viewer; input: TInput; result: TResult }) => Promise<void>;
}

interface Deps {
  getViewer: () => Promise<Viewer>;
}

function collectIssues(
  issues: { path: PropertyKey[]; message: string }[],
): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of issues) {
    const key = issue.path.map(String).join('.') || '_';
    (out[key] ??= []).push(issue.message);
  }
  return out;
}

/**
 * The one write path (INV-1): Zod-validate → requireUser → authorize → handler →
 * audit → typed result. No mutation bypasses this; raw errors never reach the UI.
 * `deps` is injectable so the wrapper is unit-testable without a session.
 */
export function authorizedAction<TInput, TResult>(
  config: AuthorizedActionConfig<TInput, TResult>,
  deps: Deps = { getViewer: defaultGetViewer },
): (raw: unknown) => Promise<ActionResult<TResult>> {
  return async (raw: unknown): Promise<ActionResult<TResult>> => {
    const parsed = config.schema.safeParse(raw);
    if (!parsed.success) {
      return {
        ok: false,
        error: 'invalid-input',
        message: 'Please check the highlighted fields.',
        issues: collectIssues(parsed.error.issues),
      };
    }

    try {
      const viewer = await deps.getViewer();
      const allowed = await config.authorize(viewer, parsed.data);
      if (!allowed) {
        return { ok: false, error: 'forbidden', message: 'You do not have access to do that.' };
      }
      const result = await config.handler({ viewer, input: parsed.data });
      if (config.audit) await config.audit({ viewer, input: parsed.data, result });
      return { ok: true, data: result };
    } catch (error) {
      if (error instanceof AppError) {
        return { ok: false, error: error.code, message: error.message };
      }
      logger('CORE').error({ err: error }, 'authorizedAction handler failed');
      return { ok: false, error: 'unknown', message: 'Something went wrong. Please try again.' };
    }
  };
}
