/** A Todo as the UI consumes it. Dates are ISO strings (serialized for the client). */
export interface TodoRow {
  id: string;
  title: string;
  notes: string | null;
  ownerId: string;
  ownerName: string;
  teamId: string;
  /** ISO datetime. */
  dueDate: string;
  done: boolean;
  /** ISO datetime, or null while open. */
  completedAt: string | null;
  sourceIssueId: string | null;
  sourceRockId: string | null;
}

/** Overdue = still open and past its due date (INV-3, pure). Completed items are never overdue. */
export function isOverdue(dueDate: Date, done: boolean, now: Date): boolean {
  return !done && dueDate.getTime() < now.getTime();
}

/** Whole days a todo is past due (0 when not yet due). Pure. */
export function daysOverdue(dueDate: Date, now: Date): number {
  const ms = now.getTime() - dueDate.getTime();
  return ms <= 0 ? 0 : Math.floor(ms / 86_400_000);
}

/**
 * A human age cue for a carried-over (overdue) item, or null when not overdue.
 * "Due today" when past due by less than a day; otherwise "N day(s) overdue".
 */
export function overdueLabel(dueDate: Date, done: boolean, now: Date): string | null {
  if (!isOverdue(dueDate, done, now)) return null;
  const days = daysOverdue(dueDate, now);
  if (days === 0) return 'Due today';
  return days === 1 ? '1 day overdue' : `${days} days overdue`;
}

export interface TodoCounts {
  total: number;
  open: number;
  overdue: number;
  done: number;
}
