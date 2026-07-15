import { z } from 'zod';

import { loadApiEnv } from '@community-marketplace/config';

const seedEnvSchema = z.object({
  RBAC_SEED_ENABLED: z
    .enum(['true', 'false'])
    .default('true')
    .transform((value) => value === 'true'),
  RBAC_SEED_FORCE: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
  RBAC_SEED_RESET_PASSWORD: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
  RBAC_SUPER_ADMIN_EMAIL: z.string().email().default('superadmin@sellnearby.ie'),
  RBAC_SUPER_ADMIN_PASSWORD: z.string().min(8).default('ChangeMe!SuperAdmin1'),
  RBAC_SUPER_ADMIN_DISPLAY_NAME: z.string().min(1).default('Super Admin'),
  PILOT_USE_EXISTING_USERS: z
    .enum(['true', 'false'])
    .default('true')
    .transform((value) => value === 'true'),
});

export type RbacSeedConfig = ReturnType<typeof loadRbacSeedConfig>;

export function loadRbacSeedConfig(source: Record<string, string | undefined> = process.env) {
  const apiEnv = loadApiEnv(source);
  const seedEnv = seedEnvSchema.parse(source);

  return {
    ...apiEnv,
    ...seedEnv,
  };
}
