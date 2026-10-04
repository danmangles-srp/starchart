'use server';

import { revalidatePath } from 'next/cache';
import { authorizedAction } from '@/lib/auth/authorizedAction';
import { canManageOrg, type Viewer } from '@/lib/auth/permissions';
import { ForbiddenError } from '@/lib/auth/errors';
import { logActivity } from '@/features/activity/data/activityLog';
import { ACTIVITY_ACTIONS } from '@/features/activity/domain/activity';
import * as repo from '../data/adminRepo';
import * as S from '../domain/schemas';

function revalidateOrg() {
  revalidatePath('/admin');
  // The team switcher lives in the app layout — refresh it when teams/members change.
  revalidatePath('/', 'layout');
}

const onlyAdmin = (viewer: Viewer) => canManageOrg(viewer);

export const createTeamAction = authorizedAction({
  schema: S.CreateTeamSchema,
  authorize: onlyAdmin,
  handler: async ({ viewer, input }) => {
    const team = await repo.createTeam(viewer.orgId, input);
    revalidateOrg();
    return { id: team.id, name: team.name };
  },
  audit: ({ viewer, result }) =>
    logActivity({
      orgId: viewer.orgId,
      actorId: viewer.id,
      action: ACTIVITY_ACTIONS.TEAM_CREATED,
      targetType: 'team',
      targetId: result.id,
      teamId: result.id,
    }),
});

export const renameTeamAction = authorizedAction({
  schema: S.RenameTeamSchema,
  authorize: onlyAdmin,
  handler: async ({ viewer, input }) => {
    await repo.renameTeam(viewer.orgId, input.teamId, input.name);
    revalidateOrg();
    return { teamId: input.teamId };
  },
  audit: ({ viewer, input }) =>
    logActivity({
      orgId: viewer.orgId,
      actorId: viewer.id,
      action: ACTIVITY_ACTIONS.TEAM_RENAMED,
      targetType: 'team',
      targetId: input.teamId,
      teamId: input.teamId,
    }),
});

export const archiveTeamAction = authorizedAction({
  schema: S.ArchiveTeamSchema,
  authorize: onlyAdmin,
  handler: async ({ viewer, input }) => {
    await repo.archiveTeam(viewer.orgId, input.teamId);
    revalidateOrg();
    return { teamId: input.teamId };
  },
  audit: ({ viewer, input }) =>
    logActivity({
      orgId: viewer.orgId,
      actorId: viewer.id,
      action: ACTIVITY_ACTIONS.TEAM_ARCHIVED,
      targetType: 'team',
      targetId: input.teamId,
      teamId: input.teamId,
    }),
});

export const createDepartmentAction = authorizedAction({
  schema: S.CreateDepartmentSchema,
  authorize: onlyAdmin,
  handler: async ({ viewer, input }) => {
    const dept = await repo.createDepartment(viewer.orgId, input.name);
    revalidateOrg();
    return { id: dept.id, name: dept.name };
  },
  audit: ({ viewer, result }) =>
    logActivity({
      orgId: viewer.orgId,
      actorId: viewer.id,
      action: ACTIVITY_ACTIONS.DEPARTMENT_CREATED,
      targetType: 'department',
      targetId: result.id,
    }),
});

export const addMembershipAction = authorizedAction({
  schema: S.AddMembershipSchema,
  authorize: onlyAdmin,
  handler: async ({ viewer, input }) => {
    await repo.addMembership(viewer.orgId, input);
    revalidateOrg();
    return { userId: input.userId, teamId: input.teamId };
  },
  audit: ({ viewer, input }) =>
    logActivity({
      orgId: viewer.orgId,
      actorId: viewer.id,
      action: ACTIVITY_ACTIONS.MEMBER_ADDED,
      targetType: 'membership',
      targetId: input.userId,
      teamId: input.teamId,
    }),
});

export const removeMembershipAction = authorizedAction({
  schema: S.RemoveMembershipSchema,
  authorize: onlyAdmin,
  handler: async ({ viewer, input }) => {
    await repo.removeMembership(viewer.orgId, input.userId, input.teamId);
    revalidateOrg();
    return { userId: input.userId, teamId: input.teamId };
  },
  audit: ({ viewer, input }) =>
    logActivity({
      orgId: viewer.orgId,
      actorId: viewer.id,
      action: ACTIVITY_ACTIONS.MEMBER_REMOVED,
      targetType: 'membership',
      targetId: input.userId,
      teamId: input.teamId,
    }),
});

export const setTeamRoleAction = authorizedAction({
  schema: S.SetTeamRoleSchema,
  authorize: onlyAdmin,
  handler: async ({ viewer, input }) => {
    await repo.setTeamRole(viewer.orgId, input);
    revalidateOrg();
    return { userId: input.userId, teamId: input.teamId };
  },
  audit: ({ viewer, input }) =>
    logActivity({
      orgId: viewer.orgId,
      actorId: viewer.id,
      action: ACTIVITY_ACTIONS.ROLE_CHANGED,
      targetType: 'membership',
      targetId: input.userId,
      teamId: input.teamId,
    }),
});

export const setUserAdminAction = authorizedAction({
  schema: S.SetUserAdminSchema,
  authorize: onlyAdmin,
  handler: async ({ viewer, input }) => {
    // Prevent an admin from locking themselves out of org management.
    if (input.userId === viewer.id && !input.isAdmin) {
      throw new ForbiddenError('You cannot remove your own admin access.');
    }
    await repo.setUserAdmin(viewer.orgId, input.userId, input.isAdmin);
    revalidateOrg();
    return { userId: input.userId };
  },
  audit: ({ viewer, input }) =>
    logActivity({
      orgId: viewer.orgId,
      actorId: viewer.id,
      action: ACTIVITY_ACTIONS.ROLE_CHANGED,
      targetType: 'user',
      targetId: input.userId,
    }),
});

export const upsertQuarterAction = authorizedAction({
  schema: S.UpsertQuarterSchema,
  authorize: onlyAdmin,
  handler: async ({ viewer, input }) => {
    const quarter = await repo.upsertQuarterDefinition(viewer.orgId, input);
    revalidateOrg();
    return { id: quarter.id };
  },
  audit: ({ viewer, input }) =>
    logActivity({
      orgId: viewer.orgId,
      actorId: viewer.id,
      action: ACTIVITY_ACTIONS.QUARTER_UPSERTED,
      targetType: 'quarter',
      targetId: `${input.fiscalYear}-Q${input.index}`,
    }),
});
