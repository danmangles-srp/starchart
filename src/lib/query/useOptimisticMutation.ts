'use client';

import {
  useMutation,
  useQueryClient,
  type QueryKey,
  type UseMutationResult,
} from '@tanstack/react-query';

interface OptimisticMutationOptions<TVariables, TData, TCache> {
  /** The server write. */
  mutationFn: (variables: TVariables) => Promise<TData>;
  /** The cache entry to snapshot, update, and invalidate. */
  queryKey: QueryKey;
  /** Produce the optimistic next cache value from the current one + the variables. */
  applyOptimistic: (current: TCache | undefined, variables: TVariables) => TCache;
  /** Optional side effect on failure (after rollback) — e.g. surface a retry toast. */
  onError?: (error: unknown, variables: TVariables) => void;
}

interface OptimisticContext<TCache> {
  previous: TCache | undefined;
}

/**
 * The one optimistic-write recipe (INV-5): snapshot → apply immediately →
 * roll back on error → invalidate on settle. Interactive writes (scorecard cell,
 * todo checkbox, rock status) use this so user input is never silently dropped.
 */
export function useOptimisticMutation<TVariables, TData = unknown, TCache = unknown>(
  options: OptimisticMutationOptions<TVariables, TData, TCache>,
): UseMutationResult<TData, unknown, TVariables, OptimisticContext<TCache>> {
  const queryClient = useQueryClient();

  return useMutation<TData, unknown, TVariables, OptimisticContext<TCache>>({
    mutationFn: options.mutationFn,
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: options.queryKey });
      const previous = queryClient.getQueryData<TCache>(options.queryKey);
      queryClient.setQueryData<TCache>(options.queryKey, (current) =>
        options.applyOptimistic(current, variables),
      );
      return { previous };
    },
    onError: (error, variables, context) => {
      queryClient.setQueryData(options.queryKey, context?.previous);
      options.onError?.(error, variables);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: options.queryKey });
    },
  });
}
