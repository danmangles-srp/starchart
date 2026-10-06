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

export interface TodoCounts {
  total: number;
  open: number;
  overdue: number;
  done: number;
}
