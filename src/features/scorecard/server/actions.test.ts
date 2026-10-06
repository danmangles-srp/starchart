import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Viewer } from '@/lib/auth/permissions';

const h = vi.hoisted(() => ({
  requireUser: vi.fn(),
  getMeasurableTeamId: vi.fn(),
  upsertWeeklyEntry: vi.fn(),
  revalidatePath: vi.fn(),
}));
vi.mock('@/lib/auth/requireUser', () => ({ requireUser: h.requireUser }));
vi.mock('next/cache', () => ({ revalidatePath: h.revalidatePath }));
vi.mock('../data/scorecardRepo', () => ({
  getMeasurableTeamId: h.getMeasurableTeamId,
  upsertWeeklyEntry: h.upsertWeeklyEntry,
}));

import { setWeeklyEntryAction } from './actions';

const member: Viewer = {
  id: 'u1',
  orgId: 'org1',
  isAdmin: false,
  memberships: [{ teamId: 'mk1', teamRole: 'MEMBER' }],
};
const outsider: Viewer = { id: 'u2', orgId: 'org1', isAdmin: false, memberships: [] };

const base = { measurableId: 'm1', isoYear: 2026, isoWeek: 40 };

beforeEach(() => {
  h.requireUser.mockReset().mockResolvedValue(member);
  h.getMeasurableTeamId.mockReset().mockResolvedValue('mk1');
  h.upsertWeeklyEntry.mockReset().mockResolvedValue(undefined);
  h.revalidatePath.mockReset();
});

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
