import { describe, it, expect } from 'vitest';
import { ROCK_STATUS_META, ROCK_STATUSES } from './status';

describe('ROCK_STATUS_META', () => {
  it('covers exactly the four rock statuses', () => {
    expect(ROCK_STATUSES).toEqual(['on-track', 'at-risk', 'off-track', 'done']);
  });

  it('pairs every status with a semantic color, an icon, and a text label (never color alone)', () => {
    for (const status of ROCK_STATUSES) {
      const meta = ROCK_STATUS_META[status];
      expect(meta.label).toBeTruthy();
      expect(['success', 'warning', 'error', 'primary']).toContain(meta.color);
      expect(meta.icon).toBeDefined();
    }
  });

  it('gives each status a distinct icon and label', () => {
    const labels = ROCK_STATUSES.map((s) => ROCK_STATUS_META[s].label);
    const icons = ROCK_STATUSES.map((s) => ROCK_STATUS_META[s].icon);
    expect(new Set(labels).size).toBe(ROCK_STATUSES.length);
    expect(new Set(icons).size).toBe(ROCK_STATUSES.length);
  });
});
