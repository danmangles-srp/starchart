import { describe, it, expect } from 'vitest';
import { systemClock, fixedClock, calendarQuarters, calendarQuarterKey } from './time';

describe('clock', () => {
  it('systemClock returns roughly the current time', () => {
    const before = Date.now();
    const now = systemClock.now().getTime();
    expect(now).toBeGreaterThanOrEqual(before - 1000);
    expect(now).toBeLessThanOrEqual(Date.now() + 1000);
  });

  it('fixedClock is deterministic and immutable', () => {
    const clock = fixedClock('2026-01-15T00:00:00.000Z');
    expect(clock.now().toISOString()).toBe('2026-01-15T00:00:00.000Z');
    const first = clock.now();
    first.setFullYear(1999);
    expect(clock.now().toISOString()).toBe('2026-01-15T00:00:00.000Z');
  });
});

describe('calendar quarters', () => {
  it('builds four quarters with correct bounds', () => {
    const quarters = calendarQuarters(2026);
    expect(quarters).toHaveLength(4);
    expect(quarters[0]?.startsOn.toISOString().slice(0, 10)).toBe('2026-01-01');
    expect(quarters[3]?.endsOn.toISOString().slice(0, 10)).toBe('2026-12-31');
  });

  it('maps a date to its calendar quarter', () => {
    expect(calendarQuarterKey(new Date('2026-05-10T00:00:00Z'))).toEqual({
      fiscalYear: 2026,
      quarterIndex: 2,
    });
    expect(calendarQuarterKey(new Date('2026-12-31T00:00:00Z'))).toEqual({
      fiscalYear: 2026,
      quarterIndex: 4,
    });
  });
});
