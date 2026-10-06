import type { PrismaClient } from '@prisma/client';
import { db } from '@/lib/db';
import { NotFoundError } from '@/lib/auth/errors';
import { isOverdue, type TodoCounts, type TodoRow } from '../domain/todo';

type TodoWithOwner = {
  id: string;
  title: string;
  notes: string | null;
  ownerId: string;
  owner: { name: string | null; email: string };
  teamId: string;
  dueDate: Date;
  done: boolean;
  completedAt: Date | null;
  sourceIssueId: string | null;
  sourceRockId: string | null;
};

const ownerInclude = { owner: { select: { name: true, email: true } } } as const;

function toRow(t: TodoWithOwner): TodoRow {
  return {
    id: t.id,
    title: t.title,
    notes: t.notes,
    ownerId: t.ownerId,
    ownerName: t.owner.name ?? t.owner.email,
    teamId: t.teamId,
    dueDate: t.dueDate.toISOString(),
    done: t.done,
    completedAt: t.completedAt ? t.completedAt.toISOString() : null,
    sourceIssueId: t.sourceIssueId,
    sourceRockId: t.sourceRockId,
  };
}

export interface CreateTodoInput {
  teamId: string;
  title: string;
  notes?: string | null;
  ownerId: string;
  dueDate: Date;
  sourceIssueId?: string | null;
  sourceRockId?: string | null;
}

export async function createTodo(orgId: string, input: CreateTodoInput, prisma: PrismaClient = db) {
  return prisma.todo.create({
    data: {
      orgId,
      teamId: input.teamId,
      title: input.title,
      notes: input.notes ?? null,
      ownerId: input.ownerId,
      dueDate: input.dueDate,
      sourceIssueId: input.sourceIssueId ?? null,
      sourceRockId: input.sourceRockId ?? null,
    },
  });
}

/** A team's Todos — open first (soonest due), then completed (most recently completed first). */
export async function listTeamTodos(
  orgId: string,
  teamId: string,
  prisma: PrismaClient = db,
): Promise<TodoRow[]> {
  const rows = await prisma.todo.findMany({ where: { orgId, teamId }, include: ownerInclude });
  const mapped = rows.map((r) => toRow(r as unknown as TodoWithOwner));
  const open = mapped.filter((t) => !t.done).sort((a, b) => a.dueDate.localeCompare(b.dueDate)); // ISO strings sort chronologically
  const done = mapped
    .filter((t) => t.done)
    .sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''));
  return [...open, ...done];
}

/** The team a todo belongs to, or null if it isn't in this org (authz for todo writes). */
export async function getTodoTeamId(
  orgId: string,
  todoId: string,
  prisma: PrismaClient = db,
): Promise<string | null> {
  const t = await prisma.todo.findFirst({ where: { id: todoId, orgId }, select: { teamId: true } });
  return t?.teamId ?? null;
}

export interface UpdateTodoInput {
  title: string;
  notes?: string | null;
  ownerId: string;
  dueDate: Date;
}

/** Edit a todo's fields (not its done state). orgId-scoped. Returns its teamId. */
export async function updateTodo(
  orgId: string,
  todoId: string,
  input: UpdateTodoInput,
  prisma: PrismaClient = db,
): Promise<string> {
  const existing = await prisma.todo.findFirst({
    where: { id: todoId, orgId },
    select: { teamId: true },
  });
  if (!existing) throw new NotFoundError('Todo not found.');
  await prisma.todo.update({
    where: { id: todoId },
    data: {
      title: input.title,
      notes: input.notes ?? null,
      ownerId: input.ownerId,
      dueDate: input.dueDate,
    },
  });
  return existing.teamId;
}

/** Set/clear a todo's done state, stamping completedAt. orgId-scoped. Returns its teamId. */
export async function setTodoDone(
  orgId: string,
  todoId: string,
  done: boolean,
  now: Date,
  prisma: PrismaClient = db,
): Promise<string> {
  const existing = await prisma.todo.findFirst({
    where: { id: todoId, orgId },
    select: { teamId: true },
  });
  if (!existing) throw new NotFoundError('Todo not found.');
  await prisma.todo.update({
    where: { id: todoId },
    data: { done, completedAt: done ? now : null },
  });
  return existing.teamId;
}

/** Hard-delete a todo (7-day items aren't archived). orgId-scoped. Returns its teamId. */
export async function deleteTodo(
  orgId: string,
  todoId: string,
  prisma: PrismaClient = db,
): Promise<string> {
  const existing = await prisma.todo.findFirst({
    where: { id: todoId, orgId },
    select: { teamId: true },
  });
  if (!existing) throw new NotFoundError('Todo not found.');
  await prisma.todo.delete({ where: { id: todoId } });
  return existing.teamId;
}

/** INV-9: a user's open Todos across all their teams, due-soonest first ("My Todos", M4.4). */
export async function myOpenTodosFor(
  orgId: string,
  ownerId: string,
  prisma: PrismaClient = db,
): Promise<TodoRow[]> {
  const rows = await prisma.todo.findMany({
    where: { orgId, ownerId, done: false },
    include: ownerInclude,
    orderBy: { dueDate: 'asc' },
  });
  return rows.map((r) => toRow(r as unknown as TodoWithOwner));
}

/** INV-9: open / overdue / done counts for a team (team dashboard, M6). */
export async function teamTodoSummary(
  orgId: string,
  teamId: string,
  now: Date,
  prisma: PrismaClient = db,
): Promise<TodoCounts> {
  const rows = await prisma.todo.findMany({
    where: { orgId, teamId },
    select: { done: true, dueDate: true },
  });
  const counts: TodoCounts = { total: rows.length, open: 0, overdue: 0, done: 0 };
  for (const r of rows) {
    if (r.done) counts.done += 1;
    else {
      counts.open += 1;
      if (isOverdue(r.dueDate, r.done, now)) counts.overdue += 1;
    }
  }
  return counts;
}
