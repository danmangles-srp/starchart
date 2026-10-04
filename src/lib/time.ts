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
