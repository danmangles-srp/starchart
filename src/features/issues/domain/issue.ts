export type IssueListType = 'SHORT' | 'LONG';

/** An issue as the UI consumes it. Dates are ISO strings. */
export interface IssueRow {
  id: string;
  title: string;
  description: string | null;
  teamId: string;
  raiserId: string;
  raiserName: string;
  ownerId: string | null;
  ownerName: string | null;
  listType: IssueListType;
  rank: number;
  solved: boolean;
  solvedAt: string | null;
  solvedById: string | null;
  resolutionNote: string | null;
  createdTodoId: string | null;
  createdRockId: string | null;
}

export interface IssueCounts {
  total: number;
  shortOpen: number;
  longOpen: number;
  solved: number;
}
