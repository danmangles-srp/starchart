import { z } from 'zod';

const teamRole = z.enum(['LEAD', 'MEMBER']);

export const CreateTeamSchema = z.object({
  name: z.string().trim().min(1).max(80),
  departmentId: z.string().min(1).nullable().optional(),
});
export const RenameTeamSchema = z.object({
  teamId: z.string().min(1),
  name: z.string().trim().min(1).max(80),
});
export const ArchiveTeamSchema = z.object({ teamId: z.string().min(1) });
export const CreateDepartmentSchema = z.object({ name: z.string().trim().min(1).max(80) });

export const AddMembershipSchema = z.object({
  userId: z.string().min(1),
  teamId: z.string().min(1),
  teamRole: teamRole.default('MEMBER'),
});
export const RemoveMembershipSchema = z.object({
  userId: z.string().min(1),
  teamId: z.string().min(1),
});
export const SetTeamRoleSchema = z.object({
  userId: z.string().min(1),
  teamId: z.string().min(1),
  teamRole,
});
export const SetUserAdminSchema = z.object({ userId: z.string().min(1), isAdmin: z.boolean() });

export const UpsertQuarterSchema = z.object({
  fiscalYear: z.number().int().min(2000).max(2100),
  index: z.number().int().min(1).max(4),
  label: z.string().trim().min(1).max(40),
  startsOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endsOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export type CreateTeamInput = z.infer<typeof CreateTeamSchema>;
export type UpsertQuarterInput = z.infer<typeof UpsertQuarterSchema>;
