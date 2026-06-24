import type { RbacSeedConfig } from './seed-config';

const SEED_ALLOWED_ENVIRONMENTS = new Set(['development', 'staging', 'test']);

export function assertRbacSeedAllowed(config: RbacSeedConfig): void {
  if (!config.RBAC_SEED_ENABLED) {
    throw new Error(
      'RBAC seed is disabled. Set RBAC_SEED_ENABLED=true to run seeding.',
    );
  }

  if (config.RBAC_SEED_FORCE) {
    console.warn(
      '[rbac-seed] RBAC_SEED_FORCE=true — proceeding despite environment restrictions.',
    );
    return;
  }

  if (config.NODE_ENV === 'production') {
    throw new Error(
      'RBAC seed is blocked in production. Use RBAC_SEED_FORCE=true only for controlled recovery.',
    );
  }

  if (!SEED_ALLOWED_ENVIRONMENTS.has(config.NODE_ENV)) {
    throw new Error(
      `RBAC seed is not allowed for NODE_ENV="${config.NODE_ENV}". ` +
        `Allowed: ${[...SEED_ALLOWED_ENVIRONMENTS].join(', ')}.`,
    );
  }
}
