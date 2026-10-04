import { describe, it, expect } from 'vitest';
import {
  toRockStatus,
  toDbRockStatus,
  milestoneProgress,
  rollupStatus,
  type DbRockStatus,
} from './rock';
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

describe('rollupStatus', () => {
  it('rolls a company rock up from its team rocks, worst-case first', () => {
    expect(rollupStatus([])).toBe('on-track');
    expect(rollupStatus(['on-track', 'off-track', 'at-risk'])).toBe('off-track');
    expect(rollupStatus(['on-track', 'at-risk'])).toBe('at-risk');
    expect(rollupStatus(['done', 'done'])).toBe('done');
    expect(rollupStatus(['on-track', 'done'])).toBe('on-track');
  });
});
