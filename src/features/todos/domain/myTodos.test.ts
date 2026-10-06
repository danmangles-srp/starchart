import { describe, it, expect } from 'vitest';
import { groupMyTodos, overdueTotal } from './myTodos';
import type { TodoRow } from './todo';

const now = new Date('2026-10-06T12:00:00Z');

function td(over: Partial<TodoRow> & Pick<TodoRow, 'id' | 'teamId' | 'dueDate'>): TodoRow {
  return {
    title: over.id,
    notes: null,
    ownerId: 'u1',
    ownerName: 'Alice',
    done: false,
    completedAt: null,
    sourceIssueId: null,
    sourceRockId: null,
    ...over,
  };
}

const names: Record<string, string> = { mk1: 'Marketing', sa1: 'Sales' };
const nameOf = (id: string) => names[id] ?? id;

describe('groupMyTodos', () => {
  const todos: TodoRow[] = [
    td({ id: 'a', teamId: 'sa1', dueDate: '2026-10-02T00:00:00.000Z' }), // overdue
    td({ id: 'b', teamId: 'mk1', dueDate: '2026-10-05T00:00:00.000Z' }), // overdue
    td({ id: 'c', teamId: 'mk1', dueDate: '2026-10-20T00:00:00.000Z' }),
  ];

  it('groups by team and resolves names', () => {
    const groups = groupMyTodos(todos, nameOf, now);
    expect(groups.map((g) => g.teamName)).toEqual(['Sales', 'Marketing']); // Sales has the soonest item
    const mk = groups.find((g) => g.teamId === 'mk1')!;
    expect(mk.items.map((t) => t.id)).toEqual(['b', 'c']); // preserves due order
  });

  it('counts overdue per group', () => {
    const groups = groupMyTodos(todos, nameOf, now);
    expect(groups.find((g) => g.teamId === 'sa1')?.overdueCount).toBe(1);
    expect(groups.find((g) => g.teamId === 'mk1')?.overdueCount).toBe(1);
  });

  it('overdueTotal counts across teams', () => {
    expect(overdueTotal(todos, now)).toBe(2);
  });
});
