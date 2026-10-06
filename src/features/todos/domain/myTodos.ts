import { isOverdue, type TodoRow } from './todo';

export interface TeamTodoGroup {
  teamId: string;
  teamName: string;
  items: TodoRow[];
  overdueCount: number;
}

/**
 * Group a user's open Todos by team for "My Todos" (INV-9), preserving the
 * incoming due-sorted order within each group and ordering groups by their
 * soonest-due item. Pure (INV-3). `teamNameOf` resolves a team id to its label.
 */
export function groupMyTodos(
  todos: readonly TodoRow[],
  teamNameOf: (teamId: string) => string,
  now: Date,
): TeamTodoGroup[] {
  const byTeam = new Map<string, TodoRow[]>();
  for (const t of todos) {
    const list = byTeam.get(t.teamId);
    if (list) list.push(t);
    else byTeam.set(t.teamId, [t]);
  }

  const groups: TeamTodoGroup[] = [];
  for (const [teamId, items] of byTeam) {
    groups.push({
      teamId,
      teamName: teamNameOf(teamId),
      items,
      overdueCount: items.filter((t) => isOverdue(new Date(t.dueDate), t.done, now)).length,
    });
  }

  // Order groups by their soonest-due item (items are already due-sorted).
  groups.sort((a, b) => (a.items[0]?.dueDate ?? '').localeCompare(b.items[0]?.dueDate ?? ''));
  return groups;
}

/** Count of open items that are overdue across all teams (INV-9 rollup for the header). */
export function overdueTotal(todos: readonly TodoRow[], now: Date): number {
  return todos.filter((t) => isOverdue(new Date(t.dueDate), t.done, now)).length;
}
