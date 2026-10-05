import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ForbiddenError } from '@/lib/auth/errors';
import { trailingIsoWeeks } from '@/lib/time';
import type { Viewer } from '@/lib/auth/permissions';
import type { MeasurableRow } from '../domain/measurable';

const h = vi.hoisted(() => ({
  listMeasurables: vi.fn(),
  getWeeklyEntries: vi.fn(),
}));
vi.mock('../data/scorecardRepo', () => ({
  listMeasurables: h.listMeasurables,
  getWeeklyEntries: h.getWeeklyEntries,
}));

import { loadTeamScorecard } from './queries';

const NOW = new Date('2026-10-05T12:00:00');
const member: Viewer = {
  id: 'u1',
  orgId: 'org1',
  isAdmin: false,
  memberships: [{ teamId: 'mk1', teamRole: 'MEMBER' }],
};
const outsider: Viewer = { id: 'u2', orgId: 'org1', isAdmin: false, memberships: [] };
const admin: Viewer = { id: 'u3', orgId: 'org1', isAdmin: true, memberships: [] };

const measurable: MeasurableRow = {
  id: 'm1',
  name: 'Calls',
  ownerId: 'u1',
  ownerName: 'Alice',
  goalValue: 50,
  goalMax: null,
  comparator: 'GTE',
  format: 'NUMBER',
  unit: 'calls',
  order: 1,
};

beforeEach(() => {
  h.listMeasurables.mockReset();
  h.getWeeklyEntries.mockReset();
  h.listMeasurables.mockResolvedValue([measurable]);
  h.getWeeklyEntries.mockResolvedValue([]);
});

describe('loadTeamScorecard — access control', () => {
  it('refuses a non-member, non-admin before touching the data layer', async () => {
    await expect(loadTeamScorecard(outsider, 'mk1', 0, NOW)).rejects.toBeInstanceOf(ForbiddenError);
    expect(h.listMeasurables).not.toHaveBeenCalled();
  });

  it('lets a team member read, with edit enabled', async () => {
    const vm = await loadTeamScorecard(member, 'mk1', 0, NOW);
    expect(vm.canEdit).toBe(true);
  });

  it('lets an Admin read any team even without membership', async () => {
    const vm = await loadTeamScorecard(admin, 'mk1', 0, NOW);
    expect(vm.canEdit).toBe(true);
    expect(vm.rows).toHaveLength(1);
  });
});

describe('loadTeamScorecard — view model', () => {
  it('builds a 13-week, newest-first window with the current week flagged', async () => {
    const vm = await loadTeamScorecard(member, 'mk1', 0, NOW);
    expect(vm.weeks).toHaveLength(13);
    expect(vm.weeks[0]?.current).toBe(true);
    expect(vm.weeks.slice(1).every((w) => !w.current)).toBe(true);
    expect(vm.hasNewer).toBe(false);
  });

  it('maps an entry to its cell and leaves other weeks empty', async () => {
    const [w0] = trailingIsoWeeks(NOW, 13);
    h.getWeeklyEntries.mockResolvedValue([
      { measurableId: 'm1', isoYear: w0!.isoYear, isoWeek: w0!.isoWeek, value: 60 },
    ]);
    const vm = await loadTeamScorecard(member, 'mk1', 0, NOW);
    const row = vm.rows[0]!;
    const key = `${w0!.isoYear}-${w0!.isoWeek}`;
    expect(row.cellsByWeek[key]).toEqual({ value: 60, status: 'on', display: '60 calls' });
    // a different week in the window has no entry → empty, not 0
    const other = vm.weeks[5]!;
    expect(row.cellsByWeek[other.key]?.status).toBe('empty');
    expect(row.goalLabel).toBe('≥ 50 calls');
  });

  it('pages back with offsetWeeks and reports a newer window', async () => {
    const vm = await loadTeamScorecard(member, 'mk1', 13, NOW);
    expect(vm.offsetWeeks).toBe(13);
    expect(vm.hasNewer).toBe(true);
    expect(vm.weeks[0]?.current).toBe(false);
  });
});
