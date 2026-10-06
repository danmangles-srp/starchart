import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Viewer } from '@/lib/auth/permissions';

const h = vi.hoisted(() => ({
  requireUser: vi.fn(),
  createIssue: vi.fn(),
  reorderIssues: vi.fn(),
  moveIssue: vi.fn(),
  solveIssue: vi.fn(),
  reopenIssue: vi.fn(),
  getIssueTeamId: vi.fn(),
  listTeamMembers: vi.fn(),
  logActivity: vi.fn(),
  revalidatePath: vi.fn(),
}));
vi.mock('@/lib/auth/requireUser', () => ({ requireUser: h.requireUser }));
vi.mock('next/cache', () => ({ revalidatePath: h.revalidatePath }));
vi.mock('@/features/org/data/teams', () => ({ listTeamMembers: h.listTeamMembers }));
vi.mock('@/features/activity/data/activityLog', () => ({ logActivity: h.logActivity }));
vi.mock('../data/issuesRepo', () => ({
  createIssue: h.createIssue,
  reorderIssues: h.reorderIssues,
  moveIssue: h.moveIssue,
  solveIssue: h.solveIssue,
  reopenIssue: h.reopenIssue,
  getIssueTeamId: h.getIssueTeamId,
}));

import {
  createIssueAction,
  reorderIssuesAction,
  moveIssueAction,
  solveIssueAction,
  reopenIssueAction,
} from './actions';

const member: Viewer = {
  id: 'u1',
  orgId: 'org1',
  isAdmin: false,
  memberships: [{ teamId: 'mk1', teamRole: 'MEMBER' }],
};
const outsider: Viewer = { id: 'u2', orgId: 'org1', isAdmin: false, memberships: [] };

beforeEach(() => {
  h.requireUser.mockReset().mockResolvedValue(member);
  h.createIssue.mockReset().mockResolvedValue({ id: 'i1' });
  h.reorderIssues.mockReset().mockResolvedValue(undefined);
  h.moveIssue.mockReset().mockResolvedValue('mk1');
  h.solveIssue.mockReset().mockResolvedValue('mk1');
  h.reopenIssue.mockReset().mockResolvedValue('mk1');
  h.getIssueTeamId.mockReset().mockResolvedValue('mk1');
  h.listTeamMembers.mockReset().mockResolvedValue([{ userId: 'u1', name: 'Alice' }]);
  h.logActivity.mockReset().mockResolvedValue(undefined);
  h.revalidatePath.mockReset();
});

describe('createIssueAction', () => {
  it('raises an issue with the current user as raiser', async () => {
    const res = await createIssueAction({
      teamId: 'mk1',
      title: 'Website slow',
      listType: 'SHORT',
    });
    expect(res.ok).toBe(true);
    const arg = h.createIssue.mock.calls[0]?.[1];
    expect(arg.raiserId).toBe('u1'); // never taken from the client
    expect(arg.ownerId).toBeNull();
    expect(h.revalidatePath).toHaveBeenCalledWith('/t/mk1/issues');
  });

  it('blocks a non-member', async () => {
    h.requireUser.mockResolvedValue(outsider);
    const res = await createIssueAction({ teamId: 'mk1', title: 'x', listType: 'SHORT' });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toBe('forbidden');
    expect(h.createIssue).not.toHaveBeenCalled();
  });

  it('rejects an owner not on the team', async () => {
    h.listTeamMembers.mockResolvedValue([{ userId: 'other', name: 'Bob' }]);
    const res = await createIssueAction({
      teamId: 'mk1',
      title: 'x',
      listType: 'LONG',
      ownerId: 'u1',
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toBe('invalid-input');
    expect(h.createIssue).not.toHaveBeenCalled();
  });

  it('rejects a blank title', async () => {
    const res = await createIssueAction({ teamId: 'mk1', title: '  ', listType: 'SHORT' });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toBe('invalid-input');
  });
});

describe('reorderIssuesAction / moveIssueAction', () => {
  it('reorders a list for a member', async () => {
    const res = await reorderIssuesAction({
      teamId: 'mk1',
      listType: 'SHORT',
      orderedIds: ['i2', 'i1'],
    });
    expect(res.ok).toBe(true);
    expect(h.reorderIssues).toHaveBeenCalledWith('org1', 'mk1', 'SHORT', ['i2', 'i1']);
  });

  it('blocks reorder for a non-member', async () => {
    h.requireUser.mockResolvedValue(outsider);
    const res = await reorderIssuesAction({ teamId: 'mk1', listType: 'SHORT', orderedIds: ['i1'] });
    expect(res.ok).toBe(false);
    expect(h.reorderIssues).not.toHaveBeenCalled();
  });

  it('moves an issue to the other list for a member', async () => {
    const res = await moveIssueAction({ issueId: 'i1', toListType: 'LONG' });
    expect(res.ok).toBe(true);
    expect(h.moveIssue).toHaveBeenCalledWith('org1', 'i1', 'LONG');
    expect(h.revalidatePath).toHaveBeenCalledWith('/t/mk1/issues');
  });

  it('blocks move for a non-member', async () => {
    h.requireUser.mockResolvedValue(outsider);
    const res = await moveIssueAction({ issueId: 'i1', toListType: 'LONG' });
    expect(res.ok).toBe(false);
    expect(h.moveIssue).not.toHaveBeenCalled();
  });
});

describe('solveIssueAction / reopenIssueAction', () => {
  it('solves with the current user as solver and logs the activity', async () => {
    const res = await solveIssueAction({ issueId: 'i1', resolutionNote: 'Fixed' });
    expect(res.ok).toBe(true);
    expect(h.solveIssue).toHaveBeenCalledWith('org1', 'i1', 'u1', 'Fixed', expect.any(Date));
    expect(h.logActivity).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'issue.solved', targetId: 'i1', teamId: 'mk1' }),
    );
  });

  it('solves with a null note when omitted', async () => {
    await solveIssueAction({ issueId: 'i1' });
    expect(h.solveIssue).toHaveBeenCalledWith('org1', 'i1', 'u1', null, expect.any(Date));
  });

  it('blocks solve for a non-member and logs nothing', async () => {
    h.requireUser.mockResolvedValue(outsider);
    const res = await solveIssueAction({ issueId: 'i1' });
    expect(res.ok).toBe(false);
    expect(h.solveIssue).not.toHaveBeenCalled();
    expect(h.logActivity).not.toHaveBeenCalled();
  });

  it('reopens for a member', async () => {
    const res = await reopenIssueAction({ issueId: 'i1' });
    expect(res.ok).toBe(true);
    expect(h.reopenIssue).toHaveBeenCalledWith('org1', 'i1');
  });
});
