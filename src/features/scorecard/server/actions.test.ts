import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Viewer } from '@/lib/auth/permissions';

const h = vi.hoisted(() => ({
  requireUser: vi.fn(),
  getMeasurableTeamId: vi.fn(),
  upsertWeeklyEntry: vi.fn(),
  createMeasurable: vi.fn(),
  updateMeasurable: vi.fn(),
  archiveMeasurable: vi.fn(),
  reorderMeasurables: vi.fn(),
  listTeamMembers: vi.fn(),
  logActivity: vi.fn(),
  revalidatePath: vi.fn(),
}));
vi.mock('@/lib/auth/requireUser', () => ({ requireUser: h.requireUser }));
vi.mock('next/cache', () => ({ revalidatePath: h.revalidatePath }));
vi.mock('@/features/org/data/teams', () => ({ listTeamMembers: h.listTeamMembers }));
vi.mock('@/features/activity/data/activityLog', () => ({ logActivity: h.logActivity }));
vi.mock('../data/scorecardRepo', () => ({
  getMeasurableTeamId: h.getMeasurableTeamId,
  upsertWeeklyEntry: h.upsertWeeklyEntry,
  createMeasurable: h.createMeasurable,
  updateMeasurable: h.updateMeasurable,
  archiveMeasurable: h.archiveMeasurable,
  reorderMeasurables: h.reorderMeasurables,
}));

import {
  setWeeklyEntryAction,
  createMeasurableAction,
  updateMeasurableAction,
  archiveMeasurableAction,
  reorderMeasurablesAction,
} from './actions';

const member: Viewer = {
  id: 'u1',
  orgId: 'org1',
  isAdmin: false,
  memberships: [{ teamId: 'mk1', teamRole: 'MEMBER' }],
};
const lead: Viewer = {
  id: 'u1',
  orgId: 'org1',
  isAdmin: false,
  memberships: [{ teamId: 'mk1', teamRole: 'LEAD' }],
};
const outsider: Viewer = { id: 'u2', orgId: 'org1', isAdmin: false, memberships: [] };

const base = { measurableId: 'm1', isoYear: 2026, isoWeek: 40 };

beforeEach(() => {
  h.requireUser.mockReset().mockResolvedValue(member);
  h.getMeasurableTeamId.mockReset().mockResolvedValue('mk1');
  h.upsertWeeklyEntry.mockReset().mockResolvedValue('mk1');
  h.createMeasurable.mockReset().mockResolvedValue({ id: 'new1' });
  h.updateMeasurable.mockReset().mockResolvedValue('mk1');
  h.archiveMeasurable.mockReset().mockResolvedValue('mk1');
  h.reorderMeasurables.mockReset().mockResolvedValue(undefined);
  h.listTeamMembers.mockReset().mockResolvedValue([{ userId: 'u1', name: 'Alice' }]);
  h.logActivity.mockReset().mockResolvedValue(undefined);
  h.revalidatePath.mockReset();
});

const goal = { name: 'Calls', ownerId: 'u1', goalValue: 50, comparator: 'GTE' as const };

describe('setWeeklyEntryAction', () => {
  it('saves a value for a team member', async () => {
    const res = await setWeeklyEntryAction({ ...base, value: 42 });
    expect(res.ok).toBe(true);
    expect(h.upsertWeeklyEntry).toHaveBeenCalledWith('org1', 'm1', 2026, 40, 42);
    expect(h.revalidatePath).toHaveBeenCalledWith('/t/mk1/scorecard');
  });

  it('preserves a real 0 and a null (empty), distinctly', async () => {
    await setWeeklyEntryAction({ ...base, value: 0 });
    expect(h.upsertWeeklyEntry).toHaveBeenLastCalledWith('org1', 'm1', 2026, 40, 0);
    await setWeeklyEntryAction({ ...base, value: null });
    expect(h.upsertWeeklyEntry).toHaveBeenLastCalledWith('org1', 'm1', 2026, 40, null);
  });

  it('blocks a non-member before writing', async () => {
    h.requireUser.mockResolvedValue(outsider);
    const res = await setWeeklyEntryAction({ ...base, value: 1 });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toBe('forbidden');
    expect(h.upsertWeeklyEntry).not.toHaveBeenCalled();
  });

  it('blocks when the measurable is not in the org', async () => {
    h.getMeasurableTeamId.mockResolvedValue(null);
    const res = await setWeeklyEntryAction({ ...base, value: 1 });
    expect(res.ok).toBe(false);
    expect(h.upsertWeeklyEntry).not.toHaveBeenCalled();
  });

  it('rejects invalid input via the schema', async () => {
    const res = await setWeeklyEntryAction({ ...base, value: 'nope' as unknown as number });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toBe('invalid-input');
    expect(h.upsertWeeklyEntry).not.toHaveBeenCalled();
  });
});

describe('manage measurables — authorization (Team Lead or Admin)', () => {
  it('lets a Team Lead create a measurable', async () => {
    h.requireUser.mockResolvedValue(lead);
    const res = await createMeasurableAction({ teamId: 'mk1', ...goal });
    expect(res.ok).toBe(true);
    expect(h.createMeasurable).toHaveBeenCalled();
  });

  it('blocks a plain member from creating', async () => {
    h.requireUser.mockResolvedValue(member); // MEMBER, not LEAD
    const res = await createMeasurableAction({ teamId: 'mk1', ...goal });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toBe('forbidden');
    expect(h.createMeasurable).not.toHaveBeenCalled();
  });

  it('rejects an owner who is not on the team', async () => {
    h.requireUser.mockResolvedValue(lead);
    h.listTeamMembers.mockResolvedValue([{ userId: 'someone-else', name: 'Bob' }]);
    const res = await createMeasurableAction({ teamId: 'mk1', ...goal });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toBe('invalid-input');
    expect(h.createMeasurable).not.toHaveBeenCalled();
  });

  it('requires an upper bound for a BETWEEN goal (schema)', async () => {
    h.requireUser.mockResolvedValue(lead);
    const res = await createMeasurableAction({
      teamId: 'mk1',
      name: 'Range',
      ownerId: 'u1',
      goalValue: 1,
      comparator: 'BETWEEN',
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toBe('invalid-input');
  });

  it('lets a Lead update a measurable', async () => {
    h.requireUser.mockResolvedValue(lead);
    const res = await updateMeasurableAction({ measurableId: 'm1', ...goal });
    expect(res.ok).toBe(true);
    expect(h.updateMeasurable).toHaveBeenCalled();
  });

  it('archives (never deletes) and writes the activity log', async () => {
    h.requireUser.mockResolvedValue(lead);
    const res = await archiveMeasurableAction({ measurableId: 'm1' });
    expect(res.ok).toBe(true);
    expect(h.archiveMeasurable).toHaveBeenCalledWith('org1', 'm1');
    expect(h.logActivity).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'measurable.archived', targetId: 'm1', teamId: 'mk1' }),
    );
  });

  it('blocks a member from archiving', async () => {
    h.requireUser.mockResolvedValue(member);
    const res = await archiveMeasurableAction({ measurableId: 'm1' });
    expect(res.ok).toBe(false);
    expect(h.archiveMeasurable).not.toHaveBeenCalled();
    expect(h.logActivity).not.toHaveBeenCalled();
  });

  it('lets a Lead reorder measurables', async () => {
    h.requireUser.mockResolvedValue(lead);
    const res = await reorderMeasurablesAction({ teamId: 'mk1', orderedIds: ['m2', 'm1'] });
    expect(res.ok).toBe(true);
    expect(h.reorderMeasurables).toHaveBeenCalledWith('org1', 'mk1', ['m2', 'm1']);
  });
});
