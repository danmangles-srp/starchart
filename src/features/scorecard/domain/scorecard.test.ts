import { describe, it, expect } from 'vitest';
import {
  evaluateGoal,
  summarizeRow,
  latestEnteredValue,
  weekMapKey,
  isCurrentWeek,
} from './scorecard';

describe('evaluateGoal', () => {
  it('treats empty as neutral, distinct from 0', () => {
    expect(evaluateGoal(null, 'GTE', 10)).toBe('empty');
    expect(evaluateGoal(0, 'GTE', 10)).toBe('off'); // a real 0 is evaluated
    expect(evaluateGoal(0, 'LTE', 10)).toBe('on');
  });

  it('evaluates each comparator at and around the boundary', () => {
    expect(evaluateGoal(10, 'GTE', 10)).toBe('on');
    expect(evaluateGoal(9, 'GTE', 10)).toBe('off');

    expect(evaluateGoal(10, 'LTE', 10)).toBe('on');
    expect(evaluateGoal(11, 'LTE', 10)).toBe('off');

    expect(evaluateGoal(10, 'EQ', 10)).toBe('on');
    expect(evaluateGoal(10.1, 'EQ', 10)).toBe('off');

    expect(evaluateGoal(11, 'GT', 10)).toBe('on');
    expect(evaluateGoal(10, 'GT', 10)).toBe('off');

    expect(evaluateGoal(9, 'LT', 10)).toBe('on');
    expect(evaluateGoal(10, 'LT', 10)).toBe('off');
  });

  it('handles BETWEEN inclusively and tolerates reversed bounds', () => {
    expect(evaluateGoal(5, 'BETWEEN', 1, 10)).toBe('on');
    expect(evaluateGoal(1, 'BETWEEN', 1, 10)).toBe('on'); // lower inclusive
    expect(evaluateGoal(10, 'BETWEEN', 1, 10)).toBe('on'); // upper inclusive
    expect(evaluateGoal(11, 'BETWEEN', 1, 10)).toBe('off');
    expect(evaluateGoal(5, 'BETWEEN', 10, 1)).toBe('on'); // reversed bounds
    expect(evaluateGoal(5, 'BETWEEN', 5, null)).toBe('on'); // missing max → exact match
    expect(evaluateGoal(6, 'BETWEEN', 5, null)).toBe('off');
  });
});

describe('summarizeRow', () => {
  it('excludes empty weeks from average and hit-rate denominator', () => {
    const s = summarizeRow([10, null, 8, 12], 'GTE', 10);
    expect(s.entered).toBe(3);
    expect(s.sum).toBe(30);
    expect(s.average).toBe(10);
    expect(s.onGoal).toBe(2); // 10 and 12
    expect(s.hitRate).toBe('2/3 on goal');
  });

  it('returns a null average when nothing is entered', () => {
    const s = summarizeRow([null, null], 'GTE', 10);
    expect(s.entered).toBe(0);
    expect(s.average).toBeNull();
    expect(s.hitRate).toBe('0/0 on goal');
  });

  it('counts a real 0 as an entered, evaluated week', () => {
    const s = summarizeRow([0, 0], 'LTE', 5);
    expect(s.entered).toBe(2);
    expect(s.average).toBe(0);
    expect(s.onGoal).toBe(2);
  });
});

describe('latestEnteredValue', () => {
  const weeks = [
    { isoYear: 2026, isoWeek: 40 },
    { isoYear: 2026, isoWeek: 39 },
    { isoYear: 2026, isoWeek: 38 },
  ];

  it('returns the newest entered value, skipping empty weeks', () => {
    const m = new Map<string, number | null>([
      [weekMapKey(weeks[0]!), null],
      [weekMapKey(weeks[1]!), 7],
      [weekMapKey(weeks[2]!), 3],
    ]);
    expect(latestEnteredValue(m, weeks)).toBe(7);
  });

  it('distinguishes a real 0 from empty', () => {
    const m = new Map<string, number | null>([[weekMapKey(weeks[0]!), 0]]);
    expect(latestEnteredValue(m, weeks)).toBe(0);
  });

  it('returns null when no week has an entry', () => {
    expect(latestEnteredValue(new Map(), weeks)).toBeNull();
  });
});

describe('isCurrentWeek', () => {
  const weeks = [
    { isoYear: 2026, isoWeek: 40 },
    { isoYear: 2026, isoWeek: 39 },
  ];
  it('is true only for the newest week in the window', () => {
    expect(isCurrentWeek(weeks[0]!, weeks)).toBe(true);
    expect(isCurrentWeek(weeks[1]!, weeks)).toBe(false);
  });
});
