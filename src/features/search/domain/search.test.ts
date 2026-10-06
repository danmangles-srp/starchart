import { describe, it, expect } from 'vitest';
import {
  normalizeQuery,
  isSearchable,
  resultHref,
  groupResults,
  type SearchResult,
} from './search';

function r(type: SearchResult['type'], id: string): SearchResult {
  return { type, id, title: id, teamId: 'mk1', teamName: 'Marketing' };
}

describe('query gating', () => {
  it('trims and requires a minimum length', () => {
    expect(normalizeQuery('  hi ')).toBe('hi');
    expect(isSearchable('a')).toBe(false);
    expect(isSearchable(' ab ')).toBe(true);
    expect(isSearchable('')).toBe(false);
  });
});

describe('resultHref', () => {
  it('deep-links each type to its team module (INV-8)', () => {
    expect(resultHref(r('rock', '1'))).toBe('/t/mk1/rocks');
    expect(resultHref(r('measurable', '1'))).toBe('/t/mk1/scorecard');
    expect(resultHref(r('issue', '1'))).toBe('/t/mk1/issues');
    expect(resultHref(r('todo', '1'))).toBe('/t/mk1/todos');
  });
});

describe('groupResults', () => {
  it('groups by type in module order and drops empty groups', () => {
    const groups = groupResults([r('todo', 't1'), r('rock', 'r1'), r('todo', 't2')]);
    expect(groups.map((g) => g.type)).toEqual(['rock', 'todo']); // measurable/issue empty → dropped
    expect(groups.find((g) => g.type === 'todo')?.results).toHaveLength(2);
  });

  it('returns nothing for no results', () => {
    expect(groupResults([])).toEqual([]);
  });
});
