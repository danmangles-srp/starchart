import { QueryClient, isServer } from '@tanstack/react-query';

function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { staleTime: 60_000, refetchOnWindowFocus: false },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

/**
 * SSR-safe query client: a fresh client per request on the server, a shared
 * singleton in the browser so cache + optimistic state survive navigation (INV-5).
 */
export function getQueryClient(): QueryClient {
  if (isServer) return makeQueryClient();
  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}
