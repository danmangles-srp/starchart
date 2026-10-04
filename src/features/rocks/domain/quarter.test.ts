import { describe, it, expect } from 'vitest';
import {
  resolveCurrentQuarter,
  isQuarterClosed,
  listQuarters,
  quarterKeyEquals,
  type QuarterDef,
} from './quarter';

const q1: QuarterDef = {
  fiscalYear: 2026,
  quarterIndex: 1,
  label: 'Q1 2026',
  startsOn: new Date(Date.UTC(2026, 0, 1)),
  endsOn: new Date(Date.UTC(2026, 2, 31)),
};
const q2: QuarterDef = {
  fiscalYear: 2026,
  quarterIndex: 2,
  label: 'Q2 2026',
  startsOn: new Date(Date.UTC(2026, 3, 1)),
  endsOn: new Date(Date.UTC(2026, 5, 30)),
};

describe('resolveCurrentQuarter', () => {
  it('matches a definition containing now', () => {
    expect(resolveCurrentQuarter([q1, q2], new Date('2026-02-15T12:00:00Z'))).toEqual({
      fiscalYear: 2026,
      quarterIndex: 1,
    });
  });
  it('falls back to the calendar quarter when no definition matches', () => {
    expect(resolveCurrentQuarter([], new Date('2026-05-10T00:00:00Z'))).toEqual({
      fiscalYear: 2026,
      quarterIndex: 2,
    });
  });
});

describe('isQuarterClosed', () => {
  it('is closed past the end and open before it', () => {
    expect(
      isQuarterClosed(
        [q1],
        { fiscalYear: 2026, quarterIndex: 1 },
        new Date('2026-04-02T00:00:00Z'),
      ),
    ).toBe(true);
    expect(
      isQuarterClosed(
        [q1],
        { fiscalYear: 2026, quarterIndex: 1 },
        new Date('2026-03-15T00:00:00Z'),
      ),
    ).toBe(false);
  });
  it('uses the calendar end when there is no definition', () => {
    expect(
      isQuarterClosed([], { fiscalYear: 2026, quarterIndex: 1 }, new Date('2026-05-01T00:00:00Z')),
    ).toBe(true);
  });
});

describe('listQuarters', () => {
  it('returns definitions in order', () => {
    expect(listQuarters([q2, q1], new Date('2026-02-01T00:00:00Z')).map((o) => o.label)).toEqual([
      'Q1 2026',
      'Q2 2026',
    ]);
  });
  it('falls back to the four calendar quarters of the current year', () => {
    const options = listQuarters([], new Date('2026-07-01T00:00:00Z'));
    expect(options).toHaveLength(4);
    expect(options.map((o) => o.quarterIndex)).toEqual([1, 2, 3, 4]);
  });
});

describe('quarterKeyEquals', () => {
  it('compares both fields', () => {
    expect(
      quarterKeyEquals(
        { fiscalYear: 2026, quarterIndex: 1 },
        { fiscalYear: 2026, quarterIndex: 1 },
      ),
    ).toBe(true);
    expect(
      quarterKeyEquals(
        { fiscalYear: 2026, quarterIndex: 1 },
        { fiscalYear: 2026, quarterIndex: 2 },
      ),
    ).toBe(false);
  });
});
