'use server';

import { addDays, format } from 'date-fns';
import { revalidatePath } from 'next/cache';
import { authorizedAction } from '@/lib/auth/authorizedAction';
import { canEditTeam } from '@/lib/auth/permissions';
import { AppError, NotFoundError } from '@/lib/auth/errors';
import { listTeamMembers } from '@/features/org/data/teams';
import { createTodo, deleteTodo, getTodoTeamId, setTodoDone, updateTodo } from '../data/todosRepo';
import {
  CreateTodoSchema,
  DeleteTodoSchema,
  SetTodoDoneSchema,
  UpdateTodoSchema,
} from '../domain/schemas';

/** Parse a YYYY-MM-DD date as midnight UTC. */
function parseDate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

/** Reject an owner who isn't on the todo's team (keeps ownership scoped). */
async function assertOwnerOnTeam(orgId: string, teamId: string, ownerId: string): Promise<void> {
  const members = await listTeamMembers(orgId, teamId);
  if (!members.some((m) => m.userId === ownerId)) {
    throw new AppError('invalid-input', 'The owner must be a member of this team.');
  }
}

/** Add a todo (any team member or Admin). dueDate defaults to +7 days (FR-6.1). */
export const createTodoAction = authorizedAction({
  schema: CreateTodoSchema,
  authorize: (viewer, input) => canEditTeam(viewer, input.teamId),
  handler: async ({ viewer, input }) => {
    await assertOwnerOnTeam(viewer.orgId, input.teamId, input.ownerId);
    const dueDate = input.dueDate
      ? parseDate(input.dueDate)
      : parseDate(format(addDays(new Date(), 7), 'yyyy-MM-dd'));
    const created = await createTodo(viewer.orgId, {
      teamId: input.teamId,
      title: input.title,
      notes: input.notes ?? null,
      ownerId: input.ownerId,
      dueDate,
    });
    revalidatePath(`/t/${input.teamId}/todos`);
    return { id: created.id };
  },
});

/** Edit a todo (any team member or Admin). */
export const updateTodoAction = authorizedAction({
  schema: UpdateTodoSchema,
  authorize: async (viewer, input) => {
    const teamId = await getTodoTeamId(viewer.orgId, input.todoId);
    return teamId !== null && canEditTeam(viewer, teamId);
  },
  handler: async ({ viewer, input }) => {
    const teamId = await getTodoTeamId(viewer.orgId, input.todoId);
    if (teamId === null) throw new NotFoundError('Todo not found.');
    await assertOwnerOnTeam(viewer.orgId, teamId, input.ownerId);
    await updateTodo(viewer.orgId, input.todoId, {
      title: input.title,
      notes: input.notes ?? null,
      ownerId: input.ownerId,
      dueDate: parseDate(input.dueDate),
    });
    revalidatePath(`/t/${teamId}/todos`);
    return { id: input.todoId };
  },
});

/** Mark a todo done/undone (any team member or Admin), stamping completedAt. */
export const setTodoDoneAction = authorizedAction({
  schema: SetTodoDoneSchema,
  authorize: async (viewer, input) => {
    const teamId = await getTodoTeamId(viewer.orgId, input.todoId);
    return teamId !== null && canEditTeam(viewer, teamId);
  },
  handler: async ({ viewer, input }) => {
    const teamId = await setTodoDone(viewer.orgId, input.todoId, input.done, new Date());
    revalidatePath(`/t/${teamId}/todos`);
    return { id: input.todoId, done: input.done };
  },
});

/** Delete a todo (any team member or Admin). 7-day items are hard-deleted, not archived. */
export const deleteTodoAction = authorizedAction({
  schema: DeleteTodoSchema,
  authorize: async (viewer, input) => {
    const teamId = await getTodoTeamId(viewer.orgId, input.todoId);
    return teamId !== null && canEditTeam(viewer, teamId);
  },
  handler: async ({ viewer, input }) => {
    const teamId = await deleteTodo(viewer.orgId, input.todoId);
    revalidatePath(`/t/${teamId}/todos`);
    return { ok: true as const };
  },
});
