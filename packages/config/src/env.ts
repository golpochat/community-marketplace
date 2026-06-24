import { z } from 'zod';

import { API_PREFIX, DEFAULT_API_URL, PORTS } from './constants';

const nodeEnvSchema = z.enum(['development', 'staging', 'production', 'test']).default('development');

export const baseEnvSchema = z.object({
  NODE_ENV: nodeEnvSchema,
});

export const apiEnvSchema = baseEnvSchema.extend({
  PORT: z.coerce.number().int().positive().default(PORTS.api),
  APP_NAME: z.string().default('community-marketplace-api'),
  CORS_ORIGIN: z
    .string()
    .default(`http://localhost:${PORTS.web},http://localhost:${PORTS.admin}`),
  DATABASE_URL: z
    .string()
    .default('postgresql://cm:cm_dev_password@localhost:5434/community_marketplace'),
  DATABASE_LOGGING: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
  JWT_SECRET: z.string().min(16).default('dev-jwt-secret-change-in-production'),
  WEB_APP_URL: z.string().url().default(`http://localhost:${PORTS.web}`),
  REDIS_URL: z.string().optional(),
  MEILISEARCH_HOST: z.string().url().default('http://localhost:7700'),
  MEILISEARCH_API_KEY: z.string().default('dev-master-key'),
  BULLMQ_MODE: z.enum(['producer', 'worker', 'both']).default('both'),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().url().optional(),
  OTEL_SERVICE_NAME: z.string().default('community-marketplace-api'),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  SENDGRID_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),
  FCM_PROJECT_ID: z.string().optional(),
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET: z.string().default('community-marketplace'),
  R2_PUBLIC_URL: z.string().url().default('https://assets.community.marketplace'),
  R2_ENDPOINT: z.string().url().optional(),
  WORKER_HEALTH_PORT: z.coerce.number().int().positive().default(4001),
});

export const webEnvSchema = z.object({
  NODE_ENV: nodeEnvSchema,
  NEXT_PUBLIC_API_URL: z.string().url().default(DEFAULT_API_URL),
  NEXT_PUBLIC_APP_URL: z.string().url().default(`http://localhost:${PORTS.web}`),
});

export const adminEnvSchema = z.object({
  NODE_ENV: nodeEnvSchema,
  NEXT_PUBLIC_API_URL: z.string().url().default(DEFAULT_API_URL),
  NEXT_PUBLIC_APP_URL: z.string().url().default(`http://localhost:${PORTS.admin}`),
  CSRF_SECRET: z.string().min(16).optional(),
});

export type BaseEnv = z.infer<typeof baseEnvSchema>;
export type ApiEnv = z.infer<typeof apiEnvSchema>;
export type WebEnv = z.infer<typeof webEnvSchema>;
export type AdminEnv = z.infer<typeof adminEnvSchema>;

export type EnvSource = Record<string, string | undefined>;

function formatZodError(error: z.ZodError): string {
  return error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ');
}

export function loadEnv<T extends z.ZodTypeAny>(
  schema: T,
  source: EnvSource = process.env,
): z.infer<T> {
  const normalized = Object.fromEntries(
    Object.entries(source).map(([key, value]) => [key, value === '' ? undefined : value]),
  ) as EnvSource;

  const result = schema.safeParse(normalized);

  if (!result.success) {
    throw new Error(`Invalid environment configuration: ${formatZodError(result.error)}`);
  }

  return result.data;
}

export function loadApiEnv(source?: EnvSource): ApiEnv {
  return loadEnv(apiEnvSchema, source);
}

export function loadWebEnv(source?: EnvSource): WebEnv {
  return loadEnv(webEnvSchema, source);
}

export function loadAdminEnv(source?: EnvSource): AdminEnv {
  return loadEnv(adminEnvSchema, source);
}

export function getCorsOrigins(corsOrigin: string): string[] {
  return corsOrigin
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export { API_PREFIX, DEFAULT_API_URL };
