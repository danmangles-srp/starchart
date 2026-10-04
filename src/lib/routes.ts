/**
 * Canonical route contract (INV-8). Team context lives in the URL so deep links
 * reopen the same view. Build every app URL through these helpers — never
 * hand-concatenate paths in components.
 */
export const MODULE_KEYS = ['rocks', 'scorecard', 'issues', 'todos'] as const;
export type ModuleKey = (typeof MODULE_KEYS)[number];

export const routes = {
  home: () => '/',
  admin: () => '/admin',
  team: (teamId: string) => `/t/${teamId}`,
  module: (teamId: string, module: ModuleKey) => `/t/${teamId}/${module}`,
} as const;

export const MODULE_NAV: ReadonlyArray<{ key: ModuleKey; label: string }> = [
  { key: 'rocks', label: 'Rocks' },
  { key: 'scorecard', label: 'Scorecard' },
  { key: 'issues', label: 'Issues' },
  { key: 'todos', label: 'Todos' },
];
