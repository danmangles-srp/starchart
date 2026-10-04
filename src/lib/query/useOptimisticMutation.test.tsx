import { describe, it, expect } from 'vitest';
import type { ReactNode } from 'react';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useOptimisticMutation } from './useOptimisticMutation';

type Todo = { id: string; done: boolean };

function wrapperFor(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

const KEY = ['todos', 't1'];

describe('useOptimisticMutation', () => {
  it('applies the optimistic update immediately', async () => {
    const client = new QueryClient();
    client.setQueryData<Todo[]>(KEY, [{ id: 'a', done: false }]);

    const { result } = renderHook(
      () =>
        useOptimisticMutation<void, string, Todo[]>({
          mutationFn: async () => 'ok',
          queryKey: KEY,
          applyOptimistic: (current) => (current ?? []).map((t) => ({ ...t, done: true })),
        }),
      { wrapper: wrapperFor(client) },
    );

    await act(async () => {
      await result.current.mutateAsync();
    });

    expect(client.getQueryData<Todo[]>(KEY)).toEqual([{ id: 'a', done: true }]);
  });

  it('rolls back to the snapshot when the mutation fails', async () => {
    const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    const initial: Todo[] = [{ id: 'a', done: false }];
    client.setQueryData<Todo[]>(KEY, initial);

    const { result } = renderHook(
      () =>
        useOptimisticMutation<void, string, Todo[]>({
          mutationFn: async () => {
            throw new Error('offline');
          },
          queryKey: KEY,
          applyOptimistic: (current) => (current ?? []).map((t) => ({ ...t, done: true })),
        }),
      { wrapper: wrapperFor(client) },
    );

    await act(async () => {
      await result.current.mutateAsync().catch(() => undefined);
    });

    expect(client.getQueryData<Todo[]>(KEY)).toEqual(initial);
  });
});
