import { z } from 'zod';

/** Shared measurable-definition fields. BETWEEN requires an upper bound (goalMax ≥ goalValue). */
export const MeasurableFieldsSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required').max(120),
    ownerId: z.string().min(1, 'Choose an owner'),
    goalValue: z.number().finite(),
    goalMax: z.number().finite().nullable().optional(),
    comparator: z.enum(['GTE', 'LTE', 'EQ', 'GT', 'LT', 'BETWEEN']),
    format: z.enum(['NUMBER', 'PERCENT', 'CURRENCY', 'TIME']).optional(),
    unit: z.string().trim().max(16).nullable().optional(),
  })
  .refine((v) => v.comparator !== 'BETWEEN' || (v.goalMax != null && v.goalMax >= v.goalValue), {
    message: 'Set an upper bound at least the lower bound for a “between” goal.',
    path: ['goalMax'],
  });

export const CreateMeasurableSchema = z.intersection(
  MeasurableFieldsSchema,
  z.object({ teamId: z.string().min(1) }),
);
export type CreateMeasurableFormInput = z.infer<typeof CreateMeasurableSchema>;

export const UpdateMeasurableSchema = z.intersection(
  MeasurableFieldsSchema,
  z.object({ measurableId: z.string().min(1) }),
);

export const ArchiveMeasurableSchema = z.object({ measurableId: z.string().min(1) });

export const ReorderMeasurablesSchema = z.object({
  teamId: z.string().min(1),
  orderedIds: z.array(z.string().min(1)).min(1),
});

/** Inline weekly-entry write. value null = clear the cell (empty, distinct from 0). */
export const SetWeeklyEntrySchema = z.object({
  measurableId: z.string().min(1),
  isoYear: z.number().int().min(2000).max(2100),
  isoWeek: z.number().int().min(1).max(53),
  value: z.number().finite().nullable(),
});
export type SetWeeklyEntryInput = z.infer<typeof SetWeeklyEntrySchema>;
