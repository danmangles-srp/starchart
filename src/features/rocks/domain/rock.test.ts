import { describe, it, expect } from 'vitest';
import { toRockStatus, toDbRockStatus, milestoneProgress, type DbRockStatus } from './rock';
import type { RockStatus } from '@/theme/status';

describe('rock status mapping', () => {
  it('round-trips every status between DB enum and domain', () => {
    const pairs: [DbRockStatus, RockStatus][] = [
      ['ON_TRACK', 'on-track'],
      ['AT_RISK', 'at-risk'],
      ['OFF_TRACK', 'off-track'],
      ['DONE', 'done'],
    ];
    for (const [db, domain] of pairs) {
      expect(toRockStatus(db)).toBe(domain);
      expect(toDbRockStatus(domain)).toBe(db);
    }
  });
});

describe('milestoneProgress', () => {
  it('formats done/total', () => {
    expect(milestoneProgress(2, 5)).toBe('2/5');
    expect(milestoneProgress(0, 0)).toBe('0/0');
  });
});
