import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { createTodo, listTeamTodos, myOpenTodosFor, teamTodoSummary } from './todosRepo';

const testUrl = process.env.DATABASE_URL_TEST;
const prisma = testUrl ? new PrismaClient({ datasources: { db: { url: testUrl } } }) : null;
const stamp = Date.now();

describe.skipIf(!testUrl)('todosRepo (Tier 2.5)', () => {
  let orgId = '';
  let teamId = '';
  let otherTeamId = '';
  let userId = '';
  let otherUserId = '';

  beforeAll(async () => {
    if (!prisma) return;
    const org = await prisma.organization.create({
      data: { name: 'Td Test', slug: `td-${stamp}` },
    });
    orgId = org.id;
    userId = (await prisma.user.create({ data: { email: `td-${stamp}@example.com`, orgId } })).id;
    otherUserId = (await prisma.user.create({ data: { email: `td2-${stamp}@example.com`, orgId } }))
      .id;
    teamId = (await prisma.team.create({ data: { orgId, name: 'Td Team' } })).id;
    otherTeamId = (await prisma.team.create({ data: { orgId, name: 'Td Team 2' } })).id;
  });

  afterAll(async () => {
    if (!prisma) return;
    await prisma.todo.deleteMany({ where: { orgId } });
    await prisma.team.deleteMany({ where: { orgId } });
    await prisma.user.deleteMany({ where: { orgId } });
    await prisma.organization.deleteMany({ where: { id: orgId } });
    await prisma.$disconnect();
  });

  it('creates a todo and lists it, open before done and by due date', async () => {
    if (!prisma) return;
    const later = await createTodo(
      orgId,
      { teamId, title: 'Later', ownerId: userId, dueDate: new Date('2026-11-10T00:00:00Z') },
      prisma,
    );
    const sooner = await createTodo(
      orgId,
      { teamId, title: 'Sooner', ownerId: userId, dueDate: new Date('2026-11-01T00:00:00Z') },
      prisma,
    );
    const doneTodo = await createTodo(
      orgId,
      { teamId, title: 'Finished', ownerId: userId, dueDate: new Date('2026-10-01T00:00:00Z') },
      prisma,
    );
    await prisma.todo.update({
      where: { id: doneTodo.id },
      data: { done: true, completedAt: new Date() },
    });

    const list = await listTeamTodos(orgId, teamId, prisma);
    expect(list.map((t) => t.id)).toEqual([sooner.id, later.id, doneTodo.id]);
    expect(list.find((t) => t.id === doneTodo.id)?.done).toBe(true);
  });

  it('aggregates a user’s open todos across teams, excluding others + done', async () => {
    if (!prisma) return;
    await createTodo(
      orgId,
      {
        teamId: otherTeamId,
        title: 'Cross-team',
        ownerId: userId,
        dueDate: new Date('2026-10-20T00:00:00Z'),
      },
      prisma,
    );
    // another user's todo must not appear
    await createTodo(
      orgId,
      {
        teamId,
        title: 'Not mine',
        ownerId: otherUserId,
        dueDate: new Date('2026-10-02T00:00:00Z'),
      },
      prisma,
    );

    const mine = await myOpenTodosFor(orgId, userId, prisma);
    expect(mine.every((t) => t.ownerId === userId && !t.done)).toBe(true);
    expect(mine.some((t) => t.teamId === otherTeamId)).toBe(true); // spans teams
    // due-soonest first
    const dues = mine.map((t) => t.dueDate);
    expect([...dues].sort()).toEqual(dues);
  });

  it('summarizes open / overdue / done for a team', async () => {
    if (!prisma) return;
    const now = new Date('2026-11-05T00:00:00Z'); // between the two open due dates above
    const summary = await teamTodoSummary(orgId, teamId, now, prisma);
    // team has: Sooner (due 11-01, open → overdue), Later (due 11-10, open), Finished (done), Not mine (due 10-02, open → overdue)
    expect(summary.total).toBe(4);
    expect(summary.done).toBe(1);
    expect(summary.open).toBe(3);
    expect(summary.overdue).toBe(2);
  });
});
