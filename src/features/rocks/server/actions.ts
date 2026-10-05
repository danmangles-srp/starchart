'use server';

import { revalidatePath } from 'next/cache';
import { authorizedAction } from '@/lib/auth/authorizedAction';
import { ForbiddenError, NotFoundError } from '@/lib/auth/errors';
import { logActivity } from '@/features/activity/data/activityLog';
import { ACTIVITY_ACTIONS } from '@/features/activity/domain/activity';
import { createRock, getRockDetail, setRockStatus } from '../data/rocksRepo';
import { listQuarterDefinitions } from '../data/quartersRepo';
import { canManageRock } from '../domain/permissions';
import { isQuarterClosed } from '../domain/quarter';
import { CreateRockSchema, UpdateRockStatusSchema } from '../domain/schemas';

export const createRockAction = authorizedAction({
  schema: CreateRockSchema,
  authorize: (viewer, input) =>
    canManageRock(viewer, {
      level: input.level,
      teamId: input.teamId ?? null,
      ownerId: input.ownerId,
    }),
  handler: async ({ viewer, input }) => {
    const rock = await createRock(viewer.orgId, {
      title: input.title,
      description: input.description ?? null,
      ownerId: input.ownerId,
      level: input.level,
      teamId: input.teamId ?? null,
      fiscalYear: input.fiscalYear,
      quarterIndex: input.quarterIndex,
      dueDate: input.dueDate ? new Date(`${input.dueDate}T00:00:00.000Z`) : null,
    });
    if (input.teamId) revalidatePath(`/t/${input.teamId}/rocks`);
    return { id: rock.id };
  },
  audit: ({ viewer, input, result }) =>
    logActivity({
      orgId: viewer.orgId,
      actorId: viewer.id,
      action: ACTIVITY_ACTIONS.ROCK_CREATED,
      targetType: 'rock',
      targetId: result.id,
      teamId: input.teamId ?? null,
    }),
});

export const updateRockStatusAction = authorizedAction({
  schema: UpdateRockStatusSchema,
  // Real authorization happens in the handler, which needs the loaded rock (team + quarter).
  authorize: () => true,
  handler: async ({ viewer, input }) => {
    const rock = await getRockDetail(viewer.orgId, input.rockId);
    if (!rock) throw new NotFoundError('Rock not found.');

    if (!canManageRock(viewer, { level: rock.level, teamId: rock.teamId, ownerId: rock.ownerId })) {
      throw new ForbiddenError();
    }

    // Closed-quarter freeze (AC-3.2.3): only an Admin may edit a Rock in a closed quarter.
    const defs = await listQuarterDefinitions(viewer.orgId);
    const closed = isQuarterClosed(
      defs,
      { fiscalYear: rock.fiscalYear, quarterIndex: rock.quarterIndex },
      new Date(),
    );
    if (closed && !viewer.isAdmin) {
      throw new ForbiddenError('This quarter is closed — only an admin can change its Rocks.');
    }

    await setRockStatus(viewer.orgId, input.rockId, input.status);
    if (rock.teamId) revalidatePath(`/t/${rock.teamId}/rocks`);
    return { rockId: input.rockId, status: input.status };
  },
  audit: ({ viewer, input }) =>
    logActivity({
      orgId: viewer.orgId,
      actorId: viewer.id,
      action: ACTIVITY_ACTIONS.ROCK_STATUS_CHANGED,
      targetType: 'rock',
      targetId: input.rockId,
    }),
});
