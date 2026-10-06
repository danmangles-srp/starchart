'use server';

import { revalidatePath } from 'next/cache';
import { authorizedAction } from '@/lib/auth/authorizedAction';
import { canEditTeam } from '@/lib/auth/permissions';
import { AppError } from '@/lib/auth/errors';
import { listTeamMembers } from '@/features/org/data/teams';
import { createIssue } from '../data/issuesRepo';
import { CreateIssueSchema } from '../domain/schemas';

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
