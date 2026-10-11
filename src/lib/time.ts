import { getISOWeek, getISOWeekYear, startOfISOWeek, subWeeks } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

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

/**
 * Render a stored-UTC instant in a specific IANA timezone (INV-4: "store UTC,
 * display in the viewer's timezone"). `timeZone` e.g. 'America/New_York'; an invalid
 * or empty zone falls back to UTC so a bad viewer value never throws in render.
 */
export function formatInTz(instant: Date | string, timeZone: string, fmt: string): string {
  const zone = timeZone && timeZone.trim().length > 0 ? timeZone : 'UTC';
  try {
    return formatInTimeZone(new Date(instant), zone, fmt);
  } catch {
    return formatInTimeZone(new Date(instant), 'UTC', fmt);
  }
}

/** The shared "today" context shown in the app bar (FR-7.3): quarter + ISO week. */
export interface TimeAnchor {
  fiscalYear: number;
  quarterIndex: number;
  quarterLabel: string;
  isoYear: number;
  isoWeek: number;
  isoWeekLabel: string;
}

/** A resolved quarter the caller supplies (e.g. from the org's QuarterDefinitions). */
export interface ResolvedQuarter {
  fiscalYear: number;
  quarterIndex: number;
  label: string;
}

/**
 * The app-bar anchor. `quarter` is the org-resolved current quarter (AC-3.2.4) — when
 * omitted, the calendar quarter is used as the fallback (INV-4), matching the Rocks
 * selector's own fallback. The ISO week is always derived from `now`.
 */
export function timeAnchor(now: Date, quarter?: ResolvedQuarter): TimeAnchor {
  const q = quarter ?? {
    ...calendarQuarterKey(now),
    label: `Q${calendarQuarterKey(now).quarterIndex} ${calendarQuarterKey(now).fiscalYear}`,
  };
  const w = isoWeekKey(now);
  return {
    fiscalYear: q.fiscalYear,
    quarterIndex: q.quarterIndex,
    quarterLabel: q.label,
    isoYear: w.isoYear,
    isoWeek: w.isoWeek,
    isoWeekLabel: `W${w.isoWeek}`,
  };
}
