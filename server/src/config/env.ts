import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

/**
 * All environment variables are validated at boot time.
 * If a required variable is missing or malformed, the process
 * fails fast with a clear error instead of crashing later at
 * an unpredictable point in request handling.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(5000),
  CLIENT_URL: z.string().url(),

  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),

  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET must be at least 16 characters'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  AI_PROVIDER: z.string().default('anthropic'),
  AI_API_KEY: z.string().min(1, 'AI_API_KEY is required'),
  AI_MODEL: z.string().min(1),
  EMBEDDING_PROVIDER: z.string().default('openai'),
  EMBEDDING_API_KEY: z.string().min(1, 'EMBEDDING_API_KEY is required'),
  EMBEDDING_MODEL: z.string().min(1),

  VECTOR_DB_PROVIDER: z.string().default('mongodb-atlas'),
  VECTOR_DATABASE_URL: z.string().optional().default(''),
  VECTOR_DATABASE_API_KEY: z.string().optional().default(''),

  STORAGE_PROVIDER: z.string().default('s3'),
  STORAGE_URL: z.string().min(1),
  STORAGE_BUCKET: z.string().min(1),
  STORAGE_ACCESS_KEY_ID: z.string().min(1),
  STORAGE_SECRET_ACCESS_KEY: z.string().min(1),
  STORAGE_REGION: z.string().default('auto'),

  REDIS_URL: z.string().optional().default(''),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),

  LOG_LEVEL: z.string().default('info'),
});

type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    // eslint-disable-next-line no-console
    console.error('❌ Invalid environment variables:');
    // eslint-disable-next-line no-console
    console.error(parsed.error.flatten().fieldErrors);
    process.exit(1);
  }

  return parsed.data;
}

export const env = loadEnv();
export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';
