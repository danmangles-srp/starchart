import { z } from 'zod';

const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use a valid date');

const todoFields = {
  title: z.string().trim().min(1, 'Title is required').max(200),
  notes: z.string().trim().max(2000).nullable().optional(),
  ownerId: z.string().min(1, 'Choose an owner'),
};

/** Create a todo. dueDate optional — the server defaults it to +7 days (FR-6.1). */
export const CreateTodoSchema = z.object({
  teamId: z.string().min(1),
  ...todoFields,
  dueDate: dateStr.optional(),
});
export type CreateTodoInputDTO = z.infer<typeof CreateTodoSchema>;

/** Edit a todo. dueDate is explicit here (the form always shows the current date). */
export const UpdateTodoSchema = z.object({
  todoId: z.string().min(1),
  ...todoFields,
  dueDate: dateStr,
});

export const SetTodoDoneSchema = z.object({
  todoId: z.string().min(1),
  done: z.boolean(),
});

export const DeleteTodoSchema = z.object({ todoId: z.string().min(1) });
