import { getISOWeek, getISOWeekYear, startOfISOWeek, subWeeks } from 'date-fns';

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

/** An ISO week, Monday-start (FR-4.2). Stored on WeeklyEntry as (isoYear, isoWeek). */
export interface IsoWeekKey {
  isoYear: number;
  isoWeek: number;
}

/** The ISO (year, week) a date falls in. ISO years can differ from calendar years at boundaries. */
export function isoWeekKey(date: Date): IsoWeekKey {
  return { isoYear: getISOWeekYear(date), isoWeek: getISOWeek(date) };
}

/** True when two ISO-week keys name the same week. */
export function isoWeekEquals(a: IsoWeekKey, b: IsoWeekKey): boolean {
  return a.isoYear === b.isoYear && a.isoWeek === b.isoWeek;
}

/**
 * The trailing `count` ISO weeks ending at the week containing `asOf`, newest-first
 * (index 0 = most recent) to match the newest-left grid (FR-4.2). `offsetWeeks` shifts
 * the whole window further back for paging (offsetWeeks=13 → the prior page).
 */
export function trailingIsoWeeks(asOf: Date, count: number, offsetWeeks = 0): IsoWeekKey[] {
  const end = startOfISOWeek(subWeeks(asOf, offsetWeeks));
  const weeks: IsoWeekKey[] = [];
  for (let i = 0; i < count; i += 1) {
    weeks.push(isoWeekKey(subWeeks(end, i)));
  }
  return weeks;
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
