/**
 * Centralized TanStack Query keys (INV-5) so reads and optimistic invalidations
 * always agree. Feature hooks build their keys here — never inline string arrays.
 */
export const queryKeys = {
  rocks: (teamId: string, quarter?: string) => ['rocks', teamId, quarter ?? 'current'] as const,
  scorecard: (teamId: string) => ['scorecard', teamId] as const,
  issues: (teamId: string) => ['issues', teamId] as const,
  todos: (teamId: string) => ['todos', teamId] as const,
  myWeek: (userId: string) => ['my-week', userId] as const,
} as const;
