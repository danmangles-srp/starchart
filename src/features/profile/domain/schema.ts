import { z } from 'zod';

/** Optional job title — may be blank (clears it). Kept short for the app bar. */
export const UpdateJobTitleSchema = z.object({
  jobTitle: z.string().trim().max(120, 'Keep the job title under 120 characters').optional(),
});
export type UpdateJobTitleInput = z.infer<typeof UpdateJobTitleSchema>;

/** Trim a job title; a blank value becomes null (clears it). The stored shape. */
export function normalizeJobTitle(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : null;
}
