'use server';

import { revalidatePath } from 'next/cache';
import { authorizedAction } from '@/lib/auth/authorizedAction';
import { canEditTeam } from '@/lib/auth/permissions';
import { AppError } from '@/lib/auth/errors';
import { listTeamMembers } from '@/features/org/data/teams';
import { logActivity } from '@/features/activity/data/activityLog';
import { ACTIVITY_ACTIONS } from '@/features/activity/domain/activity';
import {
  createIssue,
  getIssueTeamId,
  moveIssue,
  reopenIssue,
  reorderIssues,
  solveIssue,
} from '../data/issuesRepo';
import {
  CreateIssueSchema,
  MoveIssueSchema,
  ReopenIssueSchema,
  ReorderIssuesSchema,
  SolveIssueSchema,
} from '../domain/schemas';

async function assertOwnerOnTeam(orgId: string, teamId: string, ownerId: string): Promise<void> {
  const members = await listTeamMembers(orgId, teamId);
  if (!members.some((m) => m.userId === ownerId)) {
    throw new AppError('invalid-input', 'The owner must be a member of this team.');
  }
}

/** Raise an issue (any team member or Admin). The raiser is always the current user. */
export const createIssueAction = authorizedAction({
  schema: CreateIssueSchema,
  authorize: (viewer, input) => canEditTeam(viewer, input.teamId),
  handler: async ({ viewer, input }) => {
    if (input.ownerId) await assertOwnerOnTeam(viewer.orgId, input.teamId, input.ownerId);
    const created = await createIssue(viewer.orgId, {
      teamId: input.teamId,
      title: input.title,
      description: input.description ?? null,
      raiserId: viewer.id,
      ownerId: input.ownerId ?? null,
      listType: input.listType,
    });
    revalidatePath(`/t/${input.teamId}/issues`);
    return { id: created.id };
  },
});

/** Persist a dnd reorder within a team's list (member or Admin). */
export const reorderIssuesAction = authorizedAction({
  schema: ReorderIssuesSchema,
  authorize: (viewer, input) => canEditTeam(viewer, input.teamId),
  handler: async ({ viewer, input }) => {
    await reorderIssues(viewer.orgId, input.teamId, input.listType, input.orderedIds);
    revalidatePath(`/t/${input.teamId}/issues`);
    return { ok: true as const };
  },
});

/** Move an issue between the short-term and long-term lists (member or Admin). */
export const moveIssueAction = authorizedAction({
  schema: MoveIssueSchema,
  authorize: async (viewer, input) => {
    const teamId = await getIssueTeamId(viewer.orgId, input.issueId);
    return teamId !== null && canEditTeam(viewer, teamId);
  },
  handler: async ({ viewer, input }) => {
    const teamId = await moveIssue(viewer.orgId, input.issueId, input.toListType);
    revalidatePath(`/t/${teamId}/issues`);
    return { ok: true as const };
  },
});

/** Mark an issue solved (member or Admin); records solver + time and logs the activity. */
export const solveIssueAction = authorizedAction({
  schema: SolveIssueSchema,
  authorize: async (viewer, input) => {
    const teamId = await getIssueTeamId(viewer.orgId, input.issueId);
    return teamId !== null && canEditTeam(viewer, teamId);
  },
  handler: async ({ viewer, input }) => {
    const teamId = await solveIssue(
      viewer.orgId,
      input.issueId,
      viewer.id,
      input.resolutionNote ?? null,
      new Date(),
    );
    revalidatePath(`/t/${teamId}/issues`);
    return { teamId };
  },
  audit: async ({ viewer, input, result }) => {
    await logActivity({
      orgId: viewer.orgId,
      actorId: viewer.id,
      action: ACTIVITY_ACTIONS.ISSUE_SOLVED,
      targetType: 'issue',
      targetId: input.issueId,
      teamId: result.teamId,
    });
  },
});

/** Reopen a solved issue (member or Admin). */
export const reopenIssueAction = authorizedAction({
  schema: ReopenIssueSchema,
  authorize: async (viewer, input) => {
    const teamId = await getIssueTeamId(viewer.orgId, input.issueId);
    return teamId !== null && canEditTeam(viewer, teamId);
  },
  handler: async ({ viewer, input }) => {
    const teamId = await reopenIssue(viewer.orgId, input.issueId);
    revalidatePath(`/t/${teamId}/issues`);
    return { ok: true as const };
  },
});
