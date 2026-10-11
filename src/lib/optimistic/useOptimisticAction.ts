'use client';

import { useCallback, useOptimistic, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { ActionResult } from '@/lib/auth/errors';

/** A pure transform from the current state to its optimistic next value. */
type Transform<T> = (current: T) => T;

export interface OptimisticController<T> {
  /** The state to render — the server-provided base with any in-flight optimistic edits applied. */
  state: T;
  /** True while an optimistic action is in flight. */
  isPending: boolean;
  /**
   * Apply `transform` optimistically, then run the server action. On success the
   * server truth is pulled back in (`router.refresh`) and the overlay reconciles; on
   * failure the transition settles with the base unchanged, so React discards the
   * overlay — the rollback is automatic — and `onError` surfaces the reason.
   */
  run: (
    transform: Transform<T>,
    serverCall: () => Promise<ActionResult<unknown>>,
    onError?: (message: string) => void,
  ) => void;
}

/**
 * The one optimistic-write seam (INV-5), built on React 19 `useOptimistic` +
 * `useTransition`. `base` is the server-provided state (an RSC prop); every
 * interactive write (todo done, rock status, issue solve/rank/move) goes through
 * `run`, so optimism, rollback, and server reconciliation are uniform and input is
 * never silently dropped (NFR-5). Reads stay in RSC; this owns perceived latency.
 */
export function useOptimisticAction<T>(base: T): OptimisticController<T> {
  const router = useRouter();
  const [state, addOptimistic] = useOptimistic<T, Transform<T>>(base, (current, transform) =>
    transform(current),
  );
  const [isPending, startTransition] = useTransition();

  const run = useCallback<OptimisticController<T>['run']>(
    (transform, serverCall, onError) => {
      startTransition(async () => {
        addOptimistic(transform);
        const result = await serverCall();
        if (!result.ok) {
          onError?.(result.message);
          return; // base unchanged → overlay discarded on settle (rollback)
        }
        router.refresh(); // reconcile against server truth
      });
    },
    [addOptimistic, router],
  );

  return { state, isPending, run };
}
