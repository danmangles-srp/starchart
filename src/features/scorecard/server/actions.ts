'use server';

import { revalidatePath } from 'next/cache';
import { authorizedAction } from '@/lib/auth/authorizedAction';
import { canEditTeam, canManageTeam } from '@/lib/auth/permissions';
import { AppError, NotFoundError } from '@/lib/auth/errors';
import { listTeamMembers } from '@/features/org/data/teams';
import { logActivity } from '@/features/activity/data/activityLog';
import { ACTIVITY_ACTIONS } from '@/features/activity/domain/activity';
import {
  archiveMeasurable,
  createMeasurable,
  getMeasurableTeamId,
  reorderMeasurables,
  updateMeasurable,
  upsertWeeklyEntry,
} from '../data/scorecardRepo';
import {
  ArchiveMeasurableSchema,
  CreateMeasurableSchema,
  ReorderMeasurablesSchema,
  SetWeeklyEntrySchema,
  UpdateMeasurableSchema,
} from '../domain/schemas';

/** Reject an owner who isn't on the measurable's team (keeps ownership scoped). */
async function assertOwnerOnTeam(orgId: string, teamId: string, ownerId: string): Promise<void> {
  const members = await listTeamMembers(orgId, teamId);
  if (!members.some((m) => m.userId === ownerId)) {
    throw new AppError('invalid-input', 'The owner must be a member of this team.');
  }
}

/**
 * Set or clear one weekly cell (FR-4.2). Authorized server-side (INV-1): the
 * measurable's team is resolved from the DB and the viewer must be able to edit
 * it (member or Admin) — the client-supplied id is never trusted for team scope.
 * value null clears the cell (empty ≠ 0).
 */
export const setWeeklyEntryAction = authorizedAction({
  schema: SetWeeklyEntrySchema,
  authorize: async (viewer, input) => {
    const teamId = await getMeasurableTeamId(viewer.orgId, input.measurableId);
    return teamId !== null && canEditTeam(viewer, teamId);
  },
  handler: async ({ viewer, input }) => {
    const teamId = await upsertWeeklyEntry(
      viewer.orgId,
      input.measurableId,
      input.isoYear,
      input.isoWeek,
      input.value,
    );
    revalidatePath(`/t/${teamId}/scorecard`);
    return {
      measurableId: input.measurableId,
      isoYear: input.isoYear,
      isoWeek: input.isoWeek,
      value: input.value,
    };
  },
});

/** Add a measurable to a team's Scorecard (Team Lead or Admin). */
export const createMeasurableAction = authorizedAction({
  schema: CreateMeasurableSchema,
  authorize: (viewer, input) => canManageTeam(viewer, input.teamId),
  handler: async ({ viewer, input }) => {
    await assertOwnerOnTeam(viewer.orgId, input.teamId, input.ownerId);
    const created = await createMeasurable(viewer.orgId, {
      teamId: input.teamId,
      name: input.name,
      ownerId: input.ownerId,
      goalValue: input.goalValue,
      goalMax: input.goalMax ?? null,
      comparator: input.comparator,
      format: input.format,
      unit: input.unit ?? null,
    });
    revalidatePath(`/t/${input.teamId}/scorecard`);
    return { id: created.id };
  },
});

/** Edit a measurable's definition (Team Lead or Admin). */
export const updateMeasurableAction = authorizedAction({
  schema: UpdateMeasurableSchema,
  authorize: async (viewer, input) => {
    const teamId = await getMeasurableTeamId(viewer.orgId, input.measurableId);
    return teamId !== null && canManageTeam(viewer, teamId);
  },
  handler: async ({ viewer, input }) => {
    const teamId = await getMeasurableTeamId(viewer.orgId, input.measurableId);
    if (teamId === null) throw new NotFoundError('Measurable not found.');
    await assertOwnerOnTeam(viewer.orgId, teamId, input.ownerId);
    await updateMeasurable(viewer.orgId, input.measurableId, {
      name: input.name,
      ownerId: input.ownerId,
      goalValue: input.goalValue,
      goalMax: input.goalMax ?? null,
      comparator: input.comparator,
      format: input.format,
      unit: input.unit ?? null,
    });
    revalidatePath(`/t/${teamId}/scorecard`);
    return { id: input.measurableId };
  },
});

/** Archive a measurable — never hard-delete (INV-10); the archive is logged. */
export const archiveMeasurableAction = authorizedAction({
  schema: ArchiveMeasurableSchema,
  authorize: async (viewer, input) => {
    const teamId = await getMeasurableTeamId(viewer.orgId, input.measurableId);
    return teamId !== null && canManageTeam(viewer, teamId);
  },
  handler: async ({ viewer, input }) => {
    const teamId = await archiveMeasurable(viewer.orgId, input.measurableId);
    revalidatePath(`/t/${teamId}/scorecard`);
    return { teamId };
  },
  audit: async ({ viewer, input, result }) => {
    await logActivity({
      orgId: viewer.orgId,
      actorId: viewer.id,
      action: ACTIVITY_ACTIONS.MEASURABLE_ARCHIVED,
      targetType: 'measurable',
      targetId: input.measurableId,
      teamId: result.teamId,
    });
  },
});

/** Persist a dnd reorder of a team's measurables (Team Lead or Admin). */
export const reorderMeasurablesAction = authorizedAction({
  schema: ReorderMeasurablesSchema,
  authorize: (viewer, input) => canManageTeam(viewer, input.teamId),
  handler: async ({ viewer, input }) => {
    await reorderMeasurables(viewer.orgId, input.teamId, input.orderedIds);
    revalidatePath(`/t/${input.teamId}/scorecard`);
    return { ok: true as const };
  },
});
