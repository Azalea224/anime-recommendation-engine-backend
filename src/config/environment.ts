import { z } from 'zod';
import { EnvConfig } from '../types/index.js';

const envSchema = z.object({
  PORT: z.string().transform(Number).pipe(z.number().int().positive()),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MONGODB_URI: z.string().url().or(z.string().startsWith('mongodb://')),
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  ENCRYPTION_KEY: z.string().length(32),
  GOOGLE_GEMINI_API_KEY: z.string().min(1),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  GITHUB_CLIENT_ID: z.string().min(1),
  GITHUB_CLIENT_SECRET: z.string().min(1),
  FRONTEND_URL: z.string().url(),
  ANILIST_API_URL: z.string().url(),
});

let env: EnvConfig | null = null;

export function validateEnv(): EnvConfig {
  if (env) {
    return env;
  }

  try {
    env = envSchema.parse(process.env) as EnvConfig;
    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('\n');
      throw new Error(`Environment validation failed:\n${missingVars}`);
    }
    throw error;
  }
}

export function getEnv(): EnvConfig {
  if (!env) {
    return validateEnv();
  }
  return env;
}

