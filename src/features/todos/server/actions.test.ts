import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Viewer } from '@/lib/auth/permissions';

const h = vi.hoisted(() => ({
  requireUser: vi.fn(),
  createTodo: vi.fn(),
  updateTodo: vi.fn(),
  deleteTodo: vi.fn(),
  getTodoTeamId: vi.fn(),
  listTeamMembers: vi.fn(),
  revalidatePath: vi.fn(),
}));
vi.mock('@/lib/auth/requireUser', () => ({ requireUser: h.requireUser }));
vi.mock('next/cache', () => ({ revalidatePath: h.revalidatePath }));
vi.mock('@/features/org/data/teams', () => ({ listTeamMembers: h.listTeamMembers }));
vi.mock('../data/todosRepo', () => ({
  createTodo: h.createTodo,
  updateTodo: h.updateTodo,
  deleteTodo: h.deleteTodo,
  getTodoTeamId: h.getTodoTeamId,
}));

import { createTodoAction, updateTodoAction, deleteTodoAction } from './actions';

const member: Viewer = {
  id: 'u1',
  orgId: 'org1',
  isAdmin: false,
  memberships: [{ teamId: 'mk1', teamRole: 'MEMBER' }],
};
const outsider: Viewer = { id: 'u2', orgId: 'org1', isAdmin: false, memberships: [] };

beforeEach(() => {
  h.requireUser.mockReset().mockResolvedValue(member);
  h.createTodo.mockReset().mockResolvedValue({ id: 'new1' });
  h.updateTodo.mockReset().mockResolvedValue('mk1');
  h.deleteTodo.mockReset().mockResolvedValue('mk1');
  h.getTodoTeamId.mockReset().mockResolvedValue('mk1');
  h.listTeamMembers.mockReset().mockResolvedValue([{ userId: 'u1', name: 'Alice' }]);
  h.revalidatePath.mockReset();
});

describe('createTodoAction', () => {
  it('creates with an explicit due date for a team member', async () => {
    const res = await createTodoAction({
      teamId: 'mk1',
      title: 'Ship it',
      ownerId: 'u1',
      dueDate: '2026-10-20',
    });
    expect(res.ok).toBe(true);
    const arg = h.createTodo.mock.calls[0]?.[1];
    expect(arg.dueDate.toISOString()).toBe('2026-10-20T00:00:00.000Z');
    expect(h.revalidatePath).toHaveBeenCalledWith('/t/mk1/todos');
  });

  it('defaults the due date to +7 days when omitted', async () => {
    const before = Date.now();
    await createTodoAction({ teamId: 'mk1', title: 'Soon', ownerId: 'u1' });
    const arg = h.createTodo.mock.calls[0]?.[1];
    const due = arg.dueDate.getTime();
    // ~7 days out (midnight UTC), tolerant of the day boundary
    expect(due).toBeGreaterThan(before + 6 * 86400000);
    expect(due).toBeLessThan(before + 9 * 86400000);
  });

  it('blocks a non-member', async () => {
    h.requireUser.mockResolvedValue(outsider);
    const res = await createTodoAction({ teamId: 'mk1', title: 'x', ownerId: 'u1' });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toBe('forbidden');
    expect(h.createTodo).not.toHaveBeenCalled();
  });

  it('rejects an owner not on the team', async () => {
    h.listTeamMembers.mockResolvedValue([{ userId: 'other', name: 'Bob' }]);
    const res = await createTodoAction({ teamId: 'mk1', title: 'x', ownerId: 'u1' });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toBe('invalid-input');
    expect(h.createTodo).not.toHaveBeenCalled();
  });

  it('rejects a blank title (schema)', async () => {
    const res = await createTodoAction({ teamId: 'mk1', title: '   ', ownerId: 'u1' });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toBe('invalid-input');
  });
});

describe('updateTodoAction / deleteTodoAction', () => {
  it('updates a todo for a member', async () => {
    const res = await updateTodoAction({
      todoId: 't1',
      title: 'Edited',
      ownerId: 'u1',
      dueDate: '2026-10-21',
    });
    expect(res.ok).toBe(true);
    expect(h.updateTodo).toHaveBeenCalled();
  });

  it('deletes a todo for a member', async () => {
    const res = await deleteTodoAction({ todoId: 't1' });
    expect(res.ok).toBe(true);
    expect(h.deleteTodo).toHaveBeenCalledWith('org1', 't1');
  });

  it('blocks delete for a non-member', async () => {
    h.requireUser.mockResolvedValue(outsider);
    const res = await deleteTodoAction({ todoId: 't1' });
    expect(res.ok).toBe(false);
    expect(h.deleteTodo).not.toHaveBeenCalled();
  });
});
