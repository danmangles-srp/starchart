import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Viewer } from '@/lib/auth/permissions';

const h = vi.hoisted(() => ({
  requireUser: vi.fn(),
  createIssue: vi.fn(),
  listTeamMembers: vi.fn(),
  revalidatePath: vi.fn(),
}));
vi.mock('@/lib/auth/requireUser', () => ({ requireUser: h.requireUser }));
vi.mock('next/cache', () => ({ revalidatePath: h.revalidatePath }));
vi.mock('@/features/org/data/teams', () => ({ listTeamMembers: h.listTeamMembers }));
vi.mock('../data/issuesRepo', () => ({ createIssue: h.createIssue }));

import { createIssueAction } from './actions';

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
  h.listTeamMembers.mockReset().mockResolvedValue([{ userId: 'u1', name: 'Alice' }]);
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
