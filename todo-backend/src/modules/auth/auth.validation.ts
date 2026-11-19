import { z } from "zod";

export const registerSchema = z.object({
  username: z.string().trim().min(3).max(100),
  password: z.string().min(12)
});

export const loginSchema = z.object({
  username: z.string().trim().min(1).max(100),
  password: z.string().min(1)
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
