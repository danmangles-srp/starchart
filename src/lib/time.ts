/**
 * Clock seam (INV-4). All "now" flows through an injected AppClock so that
 * quarter / ISO-week math and anything time-dependent is deterministic in tests.
 * Production uses systemClock; tests use fixedClock. ISO-week and quarter helpers
 * build on this in later tickets (T2.2 / T3.2).
 */
export interface AppClock {
  now(): Date;
}

export const systemClock: AppClock = {
  now: () => new Date(),
};

/** A clock frozen at a given instant, for deterministic tests. */
export function fixedClock(instant: string | Date): AppClock {
  const frozen = new Date(instant);
  return { now: () => new Date(frozen) };
}

export interface QuarterKey {
  fiscalYear: number;
  quarterIndex: number;
}

export interface CalendarQuarter {
  index: number;
  label: string;
  startsOn: Date;
  endsOn: Date;
}

/** The four calendar quarters (Q1 = Jan–Mar) for a year — the default quarter shape. */
export function calendarQuarters(year: number): CalendarQuarter[] {
  return [1, 2, 3, 4].map((index) => {
    const startMonth = (index - 1) * 3;
    return {
      index,
      label: `Q${index} ${year}`,
      startsOn: new Date(Date.UTC(year, startMonth, 1)),
      endsOn: new Date(Date.UTC(year, startMonth + 3, 0)),
    };
  });
}

/** Which calendar quarter a date falls in. */
export function calendarQuarterKey(date: Date): QuarterKey {
  return {
    fiscalYear: date.getUTCFullYear(),
    quarterIndex: Math.floor(date.getUTCMonth() / 3) + 1,
  };
}
