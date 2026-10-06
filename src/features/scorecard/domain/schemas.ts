import { z } from 'zod';

/** Inline weekly-entry write. value null = clear the cell (empty, distinct from 0). */
export const SetWeeklyEntrySchema = z.object({
  measurableId: z.string().min(1),
  isoYear: z.number().int().min(2000).max(2100),
  isoWeek: z.number().int().min(1).max(53),
  value: z.number().finite().nullable(),
});
export type SetWeeklyEntryInput = z.infer<typeof SetWeeklyEntrySchema>;
