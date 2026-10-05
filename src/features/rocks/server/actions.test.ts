import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Viewer } from '@/lib/auth/permissions';

const h = vi.hoisted(() => ({
  viewer: { current: null as Viewer | null },
  createRock: vi.fn(async () => ({ id: 'r1' })),
  getRockDetail: vi.fn(),
  setRockStatus: vi.fn(async () => undefined),
  listQuarterDefinitions: vi.fn(async () => [] as unknown[]),
  logActivity: vi.fn(async () => undefined),
}));

vi.mock('@/lib/auth/requireUser', () => ({ requireUser: () => Promise.resolve(h.viewer.current) }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('../data/rocksRepo', () => ({
  createRock: h.createRock,
  getRockDetail: h.getRockDetail,
  setRockStatus: h.setRockStatus,
}));
vi.mock('../data/quartersRepo', () => ({ listQuarterDefinitions: h.listQuarterDefinitions }));
vi.mock('@/features/activity/data/activityLog', () => ({ logActivity: h.logActivity }));

import { createRockAction, updateRockStatusAction } from './actions';

const member: Viewer = {
  id: 'm',
  orgId: 'o',
  isAdmin: false,
  memberships: [{ teamId: 't1', teamRole: 'MEMBER' }],
};
const admin: Viewer = { id: 'a', orgId: 'o', isAdmin: true, memberships: [] };

function rock(
  over: Partial<{
    level: string;
    teamId: string | null;
    ownerId: string;
    fiscalYear: number;
    quarterIndex: number;
  }>,
) {
  return {
    id: 'r1',
    level: 'TEAM',
    teamId: 't1',
    ownerId: 'x',
    fiscalYear: 2099,
    quarterIndex: 1,
    ...over,
  };
}

const create = {
  title: 'Launch',
  ownerId: 'm',
  level: 'TEAM' as const,
  teamId: 't1',
  fiscalYear: 2099,
  quarterIndex: 1,
};

describe('createRockAction', () => {
  beforeEach(() => vi.clearAllMocks());

  it('refuses a company rock from a non-admin', async () => {
    h.viewer.current = member;
    const res = await createRockAction({ ...create, level: 'COMPANY', teamId: null });
    expect(res).toMatchObject({ ok: false, error: 'forbidden' });
    expect(h.createRock).not.toHaveBeenCalled();
  });

  it('allows a team member to create a team rock and logs it', async () => {
    h.viewer.current = member;
    const res = await createRockAction(create);
    expect(res).toMatchObject({ ok: true });
    expect(h.createRock).toHaveBeenCalledOnce();
    expect(h.logActivity).toHaveBeenCalledOnce();
  });
});

describe('updateRockStatusAction', () => {
  beforeEach(() => vi.clearAllMocks());

  it('refuses a status change on a team the user is not on', async () => {
    h.viewer.current = member;
    h.getRockDetail.mockResolvedValue(rock({ teamId: 't2' }));
    const res = await updateRockStatusAction({ rockId: 'r1', status: 'at-risk' });
    expect(res).toMatchObject({ ok: false, error: 'forbidden' });
    expect(h.setRockStatus).not.toHaveBeenCalled();
  });

  it('freezes a closed quarter for a non-admin', async () => {
    h.viewer.current = member;
    h.getRockDetail.mockResolvedValue(rock({ fiscalYear: 2020 })); // calendar Q1 2020 is closed
    const res = await updateRockStatusAction({ rockId: 'r1', status: 'done' });
    expect(res).toMatchObject({ ok: false, error: 'forbidden' });
    expect(h.setRockStatus).not.toHaveBeenCalled();
  });

  it('lets an admin override a closed quarter', async () => {
    h.viewer.current = admin;
    h.getRockDetail.mockResolvedValue(rock({ fiscalYear: 2020 }));
    const res = await updateRockStatusAction({ rockId: 'r1', status: 'done' });
    expect(res).toMatchObject({ ok: true });
    expect(h.setRockStatus).toHaveBeenCalledWith('o', 'r1', 'done');
  });

  it('allows a member to update an open-quarter team rock + logs it', async () => {
    h.viewer.current = member;
    h.getRockDetail.mockResolvedValue(rock({ fiscalYear: 2099 }));
    const res = await updateRockStatusAction({ rockId: 'r1', status: 'at-risk' });
    expect(res).toMatchObject({ ok: true });
    expect(h.setRockStatus).toHaveBeenCalledOnce();
    expect(h.logActivity).toHaveBeenCalledOnce();
  });
});
