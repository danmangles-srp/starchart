'use server';

import { revalidatePath } from 'next/cache';
import { authorizedAction } from '@/lib/auth/authorizedAction';
import { routes } from '@/lib/routes';
import { updateJobTitle } from '../data/profileRepo';
import { UpdateJobTitleSchema, normalizeJobTitle } from '../domain/schema';

/**
 * Set the viewer's own job title (FR-1.3). A user may only edit their own profile,
 * so authorization is implicit (the action writes to `viewer.id`); no team/role gate.
 */
export const updateJobTitleAction = authorizedAction({
  schema: UpdateJobTitleSchema,
  authorize: () => true,
  handler: async ({ viewer, input }) => {
    const stored = normalizeJobTitle(input.jobTitle);
    await updateJobTitle(viewer.orgId, viewer.id, stored);
    revalidatePath(routes.profile());
    return { jobTitle: stored };
  },
});
