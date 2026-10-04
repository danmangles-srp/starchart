import { describe, it, expect } from 'vitest';
import { systemClock, fixedClock } from './time';

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
