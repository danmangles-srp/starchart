import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Viewer } from '@/lib/auth/permissions';

const viewer = { current: null as Viewer | null };

vi.mock('@/lib/auth/requireUser', () => ({
  requireUser: () => Promise.resolve(viewer.current),
}));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/features/activity/data/activityLog', () => ({
  logActivity: vi.fn(async () => undefined),
}));
vi.mock('../data/adminRepo', () => ({
  createTeam: vi.fn(async () => ({ id: 't1', name: 'Growth' })),
  renameTeam: vi.fn(),
  archiveTeam: vi.fn(),
  createDepartment: vi.fn(async () => ({ id: 'd1', name: 'Dept' })),
  addMembership: vi.fn(),
  removeMembership: vi.fn(),
  setTeamRole: vi.fn(),
  setUserAdmin: vi.fn(),
  upsertQuarterDefinition: vi.fn(async () => ({ id: 'q1' })),
  getAdminOverview: vi.fn(),
}));

import { createTeamAction, archiveTeamAction } from './actions';
import * as repo from '../data/adminRepo';
import { logActivity } from '@/features/activity/data/activityLog';

const admin: Viewer = { id: 'a', orgId: 'o1', isAdmin: true, memberships: [] };
const member: Viewer = { id: 'm', orgId: 'o1', isAdmin: false, memberships: [] };

describe('admin actions (server authorization)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('blocks a non-admin and never touches the repo', async () => {
    viewer.current = member;
    const result = await createTeamAction({ name: 'Growth' });
    expect(result).toMatchObject({ ok: false, error: 'forbidden' });
    expect(repo.createTeam).not.toHaveBeenCalled();
  });

  it('allows an admin, scopes to their org, and logs the activity', async () => {
    viewer.current = admin;
    const result = await createTeamAction({ name: 'Growth' });
    expect(result).toEqual({ ok: true, data: { id: 't1', name: 'Growth' } });
    expect(repo.createTeam).toHaveBeenCalledWith('o1', { name: 'Growth' });
    expect(logActivity).toHaveBeenCalledOnce();
  });

  it('rejects invalid input before authorizing', async () => {
    viewer.current = admin;
    const result = await archiveTeamAction({ teamId: '' });
    expect(result).toMatchObject({ ok: false, error: 'invalid-input' });
    expect(repo.archiveTeam).not.toHaveBeenCalled();
  });
});
