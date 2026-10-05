import { z } from 'zod';

export const CreateRockSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2000).optional(),
  ownerId: z.string().min(1),
  level: z.enum(['COMPANY', 'TEAM', 'INDIVIDUAL']),
  teamId: z.string().min(1).nullable().optional(),
  fiscalYear: z.number().int().min(2000).max(2100),
  quarterIndex: z.number().int().min(1).max(4),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

export const UpdateRockStatusSchema = z.object({
  rockId: z.string().min(1),
  status: z.enum(['on-track', 'at-risk', 'off-track', 'done']),
});

export const AddMilestoneSchema = z.object({
  rockId: z.string().min(1),
  title: z.string().trim().min(1).max(200),
});
export const ToggleMilestoneSchema = z.object({
  rockId: z.string().min(1),
  milestoneId: z.string().min(1),
  done: z.boolean(),
});
export const ReorderMilestonesSchema = z.object({
  rockId: z.string().min(1),
  orderedIds: z.array(z.string().min(1)).min(1),
});

export const LinkRockSchema = z.object({
  companyRockId: z.string().min(1),
  teamRockId: z.string().min(1),
  teamId: z.string().min(1), // the team context the detail page is viewed under (for revalidation)
});

export type CreateRockInput = z.infer<typeof CreateRockSchema>;
