import { describe, it, expect } from 'vitest';
import { queryKeys } from './queryKeys';

describe('queryKeys', () => {
  it('builds stable, team-scoped keys', () => {
    expect(queryKeys.rocks('t1')).toEqual(['rocks', 't1', 'current']);
    expect(queryKeys.rocks('t1', '2026Q1')).toEqual(['rocks', 't1', '2026Q1']);
    expect(queryKeys.scorecard('t1')).toEqual(['scorecard', 't1']);
    expect(queryKeys.issues('t1')).toEqual(['issues', 't1']);
    expect(queryKeys.todos('t1')).toEqual(['todos', 't1']);
    expect(queryKeys.myWeek('u1')).toEqual(['my-week', 'u1']);
  });
});
