import { routes, type ModuleKey } from '@/lib/routes';

export type SearchType = 'rock' | 'measurable' | 'issue' | 'todo';

export interface SearchResult {
  type: SearchType;
  id: string;
  title: string;
  teamId: string;
  teamName: string;
}

export interface SearchGroup {
  type: SearchType;
  label: string;
  results: SearchResult[];
}

/** Shortest query we run — avoids matching everything on a single keystroke. */
export const MIN_QUERY = 2;

export function normalizeQuery(q: string): string {
  return q.trim();
}

export function isSearchable(q: string): boolean {
  return normalizeQuery(q).length >= MIN_QUERY;
}

const MODULE_FOR: Record<SearchType, ModuleKey> = {
  rock: 'rocks',
  measurable: 'scorecard',
  issue: 'issues',
  todo: 'todos',
};

/** Deep link for a result — the team module it lives in (INV-8). */
export function resultHref(r: SearchResult): string {
  return routes.module(r.teamId, MODULE_FOR[r.type]);
}

const GROUP_ORDER: { type: SearchType; label: string }[] = [
  { type: 'rock', label: 'Rocks' },
  { type: 'measurable', label: 'Measurables' },
  { type: 'issue', label: 'Issues' },
  { type: 'todo', label: 'Todos' },
];

/** Group flat results by type in a stable module order; empty groups are dropped. */
export function groupResults(results: readonly SearchResult[]): SearchGroup[] {
  return GROUP_ORDER.map(({ type, label }) => ({
    type,
    label,
    results: results.filter((r) => r.type === type),
  })).filter((g) => g.results.length > 0);
}
