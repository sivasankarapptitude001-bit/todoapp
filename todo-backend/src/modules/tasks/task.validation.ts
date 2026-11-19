import { z } from "zod";

export const taskNameSchema = z.object({
  name: z.string().trim().min(1).max(255)
});

export const taskCompletionSchema = z.object({
  completed: z.boolean()
});

export const taskIdSchema = z.object({
  id: z.string().uuid()
});

export type TaskNameInput = z.infer<typeof taskNameSchema>;
export type TaskCompletionInput = z.infer<typeof taskCompletionSchema>;
