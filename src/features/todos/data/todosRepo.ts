import type { PrismaClient } from '@prisma/client';
import { db } from '@/lib/db';
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

/** A team's Todos — open first (by due date), then completed (most recent first). */
export async function listTeamTodos(
  orgId: string,
  teamId: string,
  prisma: PrismaClient = db,
): Promise<TodoRow[]> {
  const rows = await prisma.todo.findMany({
    where: { orgId, teamId },
    include: ownerInclude,
    orderBy: [{ done: 'asc' }, { dueDate: 'asc' }],
  });
  return rows.map((r) => toRow(r as unknown as TodoWithOwner));
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
