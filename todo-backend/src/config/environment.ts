import "dotenv/config";
import { z } from "zod";

const environmentSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().url().optional(),
  DB_HOST: z.string().default("localhost"),
  DB_PORT: z.coerce.number().int().positive().default(5432),
  DB_NAME: z.string().default("todo_db"),
  DB_USER: z.string().default("todo_user"),
  DB_PASSWORD: z.string().default("todo_password"),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default("1h"),
  BCRYPT_ROUNDS: z.coerce.number().int().min(4).max(14).default(12),
  FRONTEND_URL: z.string().url().default("http://localhost:5173")
});

export const environment = environmentSchema.parse(process.env);
