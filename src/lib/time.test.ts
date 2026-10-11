import { describe, it, expect } from 'vitest';
import {
  systemClock,
  fixedClock,
  calendarQuarters,
  calendarQuarterKey,
  isoWeekKey,
  isoWeekEquals,
  trailingIsoWeeks,
  timeAnchor,
  formatInTz,
} from './time';

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

describe('ISO weeks', () => {
  it('maps a date to its ISO (year, week)', () => {
    // 2026-01-01 is a Thursday → ISO week 1 of 2026.
    expect(isoWeekKey(new Date('2026-01-01T12:00:00'))).toEqual({ isoYear: 2026, isoWeek: 1 });
  });

  it('handles the year boundary where ISO year differs from calendar year', () => {
    // 2021-01-01 is a Friday → belongs to ISO week 53 of 2020.
    expect(isoWeekKey(new Date('2021-01-01T12:00:00'))).toEqual({ isoYear: 2020, isoWeek: 53 });
  });

  it('isoWeekEquals compares both parts', () => {
    expect(isoWeekEquals({ isoYear: 2026, isoWeek: 5 }, { isoYear: 2026, isoWeek: 5 })).toBe(true);
    expect(isoWeekEquals({ isoYear: 2026, isoWeek: 5 }, { isoYear: 2026, isoWeek: 6 })).toBe(false);
    expect(isoWeekEquals({ isoYear: 2025, isoWeek: 5 }, { isoYear: 2026, isoWeek: 5 })).toBe(false);
  });

  it('returns the trailing window newest-first, starting at the current week', () => {
    const asOf = new Date('2026-10-05T09:00:00'); // a Monday
    const weeks = trailingIsoWeeks(asOf, 13);
    expect(weeks).toHaveLength(13);
    expect(weeks[0]).toEqual(isoWeekKey(asOf)); // newest first
    // Strictly 13 distinct, descending weeks (no gaps or repeats across any year boundary).
    const seen = new Set(weeks.map((w) => `${w.isoYear}-${w.isoWeek}`));
    expect(seen.size).toBe(13);
  });

  it('pages the window back by offsetWeeks', () => {
    const asOf = new Date('2026-10-05T09:00:00');
    const full = trailingIsoWeeks(asOf, 26);
    const priorPage = trailingIsoWeeks(asOf, 13, 13);
    expect(priorPage[0]).toEqual(full[13]); // the page before the trailing 13
  });
});

describe('timeAnchor', () => {
  it('labels the calendar quarter and ISO week of a date', () => {
    const a = timeAnchor(new Date('2026-05-10T00:00:00Z'));
    expect(a.quarterLabel).toBe('Q2 2026');
    expect(a.isoWeekLabel).toBe(`W${a.isoWeek}`);
    expect(a.fiscalYear).toBe(2026);
    expect(a.quarterIndex).toBe(2);
  });

  it('uses an org-resolved quarter when supplied (AC-3.2.4), overriding the calendar one', () => {
    // A fiscal year where "Q1 2027" spans this May date — the anchor must honour it.
    const a = timeAnchor(new Date('2026-05-10T00:00:00Z'), {
      fiscalYear: 2027,
      quarterIndex: 1,
      label: 'FY27 Q1',
    });
    expect(a.quarterLabel).toBe('FY27 Q1');
    expect(a.fiscalYear).toBe(2027);
    expect(a.quarterIndex).toBe(1);
    // ISO week still derives from the instant, not the quarter.
    expect(a.isoWeekLabel).toBe(`W${a.isoWeek}`);
  });
});

describe('formatInTz', () => {
  it('renders a stored-UTC instant in the viewer timezone', () => {
    // 2026-01-01T02:30Z is still Dec 31 in New York (UTC-5).
    const utc = new Date('2026-01-01T02:30:00Z');
    expect(formatInTz(utc, 'America/New_York', 'yyyy-MM-dd HH:mm')).toBe('2025-12-31 21:30');
    expect(formatInTz(utc, 'UTC', 'yyyy-MM-dd HH:mm')).toBe('2026-01-01 02:30');
  });

  it('falls back to UTC for an empty or invalid zone instead of throwing', () => {
    const utc = new Date('2026-06-15T12:00:00Z');
    expect(formatInTz(utc, '', 'HH:mm')).toBe('12:00');
    expect(formatInTz(utc, 'Not/AZone', 'HH:mm')).toBe('12:00');
  });
});
