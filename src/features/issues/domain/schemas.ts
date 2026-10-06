import { z } from 'zod';

/** Create an issue. The raiser is the current user (set server-side, never trusted from the client). */
export const CreateIssueSchema = z.object({
  teamId: z.string().min(1),
  title: z.string().trim().min(1, 'Title is required').max(200),
  description: z.string().trim().max(2000).nullable().optional(),
  ownerId: z.string().min(1).nullable().optional(),
  listType: z.enum(['SHORT', 'LONG']),
});
export type CreateIssueInputDTO = z.infer<typeof CreateIssueSchema>;

export const ReorderIssuesSchema = z.object({
  teamId: z.string().min(1),
  listType: z.enum(['SHORT', 'LONG']),
  orderedIds: z.array(z.string().min(1)).min(1),
});

export const MoveIssueSchema = z.object({
  issueId: z.string().min(1),
  toListType: z.enum(['SHORT', 'LONG']),
});
