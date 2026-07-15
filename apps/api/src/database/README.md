# RBAC — Database Layer

Canonical Prisma schema: [`apps/api/prisma/schema.prisma`](../../apps/api/prisma/schema.prisma)

## Tables

| Table | Purpose |
|-------|---------|
| `roles` | Role definitions (`SUPER_ADMIN`, `ADMIN`, `SELLER`, `BUYER`) |
| `permissions` | Granular permission codes |
| `role_permissions` | Many-to-many default grants per role |
| `users.primary_role_id` | FK → user's primary role |
| `user_permissions` | Per-user GRANT/DENY overrides |

## RBAC seeding

Seeds roles, permissions, role-permission mappings, and a bootstrap `SUPER_ADMIN` user.

| Variable | Default | Description |
|----------|---------|-------------|
| `RBAC_SEED_ENABLED` | `true` | Master switch |
| `RBAC_SEED_FORCE` | `false` | Allow seed in production (recovery only) |
| `RBAC_SEED_RESET_PASSWORD` | `false` | Re-hash super-admin password on re-run |
| `RBAC_SUPER_ADMIN_EMAIL` | `superadmin@sellnearby.ie` | Bootstrap admin email |
| `RBAC_SUPER_ADMIN_PASSWORD` | `ChangeMe!SuperAdmin1` | Bootstrap password (change after first login) |
| `RBAC_SUPER_ADMIN_DISPLAY_NAME` | `Super Admin` | Display name |

**Allowed environments:** `development`, `staging`, `test` — blocked in `production` unless `RBAC_SEED_FORCE=true`.

### Commands

```bash
# 1. Start PostgreSQL (Docker)
docker compose -f infra/docker/docker-compose.yml up -d postgres

# 2. Generate client
pnpm --filter @community-marketplace/api exec prisma generate

# Development: migrate + seed (auto-creates apps/api/.env from .env.example)
pnpm --filter @community-marketplace/api run migrate:seed

# Seed only (idempotent upserts)
pnpm seed:rbac

# Staging (bash)
NODE_ENV=staging ./infra/scripts/migrate-and-seed.sh

# Staging (PowerShell)
.\infra\scripts\migrate-and-seed.ps1 -NodeEnv staging
```

### What gets seeded

1. **Roles** — `SUPER_ADMIN`, `ADMIN`, `SELLER`, `BUYER` (stable UUIDs)
2. **Permissions** — full catalog from `packages/types` `PERMISSIONS`
3. **Role permissions** — `DEFAULT_ROLE_PERMISSIONS` matrix
4. **Bootstrap user** — one `SUPER_ADMIN` account (upsert by email)

Implementation: [`src/database/seeds/rbac.seed.ts`](seeds/rbac.seed.ts)

## Shared contracts

- Types: `packages/types/src/rbac.ts`
- Seed data: `packages/types` + `src/database/rbac-seed.data.ts`
- Validation: `packages/validation/src/rbac.schema.ts`
