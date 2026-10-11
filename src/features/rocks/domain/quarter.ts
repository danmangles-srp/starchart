import { calendarQuarters, calendarQuarterKey, type QuarterKey } from '@/lib/time';

export type { QuarterKey } from '@/lib/time';

export interface QuarterDef {
  fiscalYear: number;
  quarterIndex: number;
  label: string;
  startsOn: Date;
  endsOn: Date;
}

export interface QuarterOption {
  fiscalYear: number;
  quarterIndex: number;
  label: string;
}

/** The instant immediately after a quarter's last (inclusive) day. */
function endExclusive(endsOn: Date): Date {
  return new Date(endsOn.getTime() + 24 * 60 * 60 * 1000);
}

/** The quarter `now` falls in — an org definition if one matches, else the calendar quarter (INV-4). */
export function resolveCurrentQuarter(defs: QuarterDef[], now: Date): QuarterKey {
  const match = defs.find((d) => now >= d.startsOn && now < endExclusive(d.endsOn));
  if (match) return { fiscalYear: match.fiscalYear, quarterIndex: match.quarterIndex };
  return calendarQuarterKey(now);
}

/** Closed = `now` is past the quarter's end (AC-3.2.3). Uses the definition's end, else calendar. */
export function isQuarterClosed(defs: QuarterDef[], key: QuarterKey, now: Date): boolean {
  const def = defs.find(
    (d) => d.fiscalYear === key.fiscalYear && d.quarterIndex === key.quarterIndex,
  );
  const endsOn = def?.endsOn ?? calendarQuarters(key.fiscalYear)[key.quarterIndex - 1]?.endsOn;
  if (!endsOn) return false;
  return now >= endExclusive(endsOn);
}

/** Quarters to offer in the selector: the org's definitions, or this year's calendar quarters. */
export function listQuarters(defs: QuarterDef[], now: Date): QuarterOption[] {
  if (defs.length > 0) {
    return [...defs]
      .sort((a, b) => a.fiscalYear - b.fiscalYear || a.quarterIndex - b.quarterIndex)
      .map((d) => ({ fiscalYear: d.fiscalYear, quarterIndex: d.quarterIndex, label: d.label }));
  }
  const year = now.getUTCFullYear();
  return calendarQuarters(year).map((q) => ({
    fiscalYear: year,
    quarterIndex: q.index,
    label: q.label,
  }));
}

export function quarterKeyEquals(a: QuarterKey, b: QuarterKey): boolean {
  return a.fiscalYear === b.fiscalYear && a.quarterIndex === b.quarterIndex;
}

/**
 * The current quarter as a labelled option (key + display label), resolving from the
 * org's definitions with a calendar fallback (AC-3.2.4). One call for callers that
 * need the label too (e.g. the app-bar anchor), instead of re-scanning the list.
 */
export function resolveCurrentQuarterOption(defs: QuarterDef[], now: Date): QuarterOption {
  const key = resolveCurrentQuarter(defs, now);
  const label =
    listQuarters(defs, now).find(
      (o) => o.fiscalYear === key.fiscalYear && o.quarterIndex === key.quarterIndex,
    )?.label ?? `Q${key.quarterIndex} ${key.fiscalYear}`;
  return { fiscalYear: key.fiscalYear, quarterIndex: key.quarterIndex, label };
}

/** Parse an `fy`/`q` search-param to a finite number, falling back when absent/invalid. */
export function parseQuarterParam(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return value && Number.isFinite(n) ? n : fallback;
}
