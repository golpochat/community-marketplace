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
  const result = schema.safeParse(source);

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
