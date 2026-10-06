'use server';

import { revalidatePath } from 'next/cache';
import { authorizedAction } from '@/lib/auth/authorizedAction';
import { canEditTeam } from '@/lib/auth/permissions';
import { getMeasurableTeamId, upsertWeeklyEntry } from '../data/scorecardRepo';
import { SetWeeklyEntrySchema } from '../domain/schemas';

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
    await upsertWeeklyEntry(
      viewer.orgId,
      input.measurableId,
      input.isoYear,
      input.isoWeek,
      input.value,
    );
    const teamId = await getMeasurableTeamId(viewer.orgId, input.measurableId);
    if (teamId) revalidatePath(`/t/${teamId}/scorecard`);
    return {
      measurableId: input.measurableId,
      isoYear: input.isoYear,
      isoWeek: input.isoWeek,
      value: input.value,
    };
  },
});
