'use server';

import { revalidatePath } from 'next/cache';
import { authorizedAction } from '@/lib/auth/authorizedAction';
import { updateJobTitle } from '../data/profileRepo';
import { UpdateJobTitleSchema } from '../domain/schema';

/**
 * Set the viewer's own job title (FR-1.3). A user may only edit their own profile,
 * so authorization is implicit (the action writes to `viewer.id`); no team/role gate.
 */
export const updateJobTitleAction = authorizedAction({
  schema: UpdateJobTitleSchema,
  authorize: () => true,
  handler: async ({ viewer, input }) => {
    await updateJobTitle(viewer.orgId, viewer.id, input.jobTitle ?? null);
    revalidatePath('/me');
    return { jobTitle: input.jobTitle ?? null };
  },
});
