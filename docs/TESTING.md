# Testing Guide

This project uses **Vitest** tests (including integration suites against PostgreSQL when configured), plus the **RBAC / bootstrap seed** for manual QA.

## Quick start

```bash
# 1. Start infrastructure (from repo root)
docker compose -f infra/docker/docker-compose.dev.yml up -d postgres redis meilisearch

# 2. Migrate database
pnpm --filter @community-marketplace/api prisma:migrate:deploy

# 3. Seed RBAC + bootstrap users
pnpm seed:rbac

# 4. Run API tests
pnpm --filter @community-marketplace/api test
```

## Seed commands

| Command | Purpose |
|---------|---------|
| `pnpm seed:rbac` | Roles, permissions, bootstrap users (`bootstrap-users.seed.data.ts`) |
| `pnpm --filter @community-marketplace/api run seed:reset-users` | Reset bootstrap users (API package script) |

There is **no** root `pnpm seed:all`, `seed:dev-users`, or `seed:test-data`. Register extra marketplace accounts via the OTP flow for buyer/seller scenarios.

## Bootstrap accounts (after `pnpm seed:rbac`)

See [dev-credentials.md](./dev-credentials.md) for the full table. Summary:

| Role | Email | Password |
|------|-------|----------|
| SUPER_ADMIN | `superadmin@sellnearby.ie` | `ChangeMe!SuperAdmin1` |
| ADMIN | `admin@sellnearby.ie` | `ChangeMe!Admin1` |
| MEMBER | `member@sellnearby.ie` | `ChangeMe!Member1` |

Operator personas (`accounts-admin@…`, `moderation-admin@…`, `financial-admin@…`) are also seeded.

## Automated tests

| Suite | Path | Verifies |
|-------|------|----------|
| RBAC integration | `apps/api/test/integration/rbac.integration.test.ts` | Roles, permission catalog, personas |
| Unified account | `apps/api/test/integration/unified-account.test.ts` | Account model / redirects |
| Unit / module tests | `apps/api/test/**` | Domain services (e.g. AI marketing safety) |

Tests that need a database **skip** when `DATABASE_URL` is unset.

```bash
pnpm --filter @community-marketplace/api test
pnpm --filter @community-marketplace/api test:watch
pnpm --filter @community-marketplace/api test:integration
```

## Environment

Tests load `apps/api/.env` and default `NODE_ENV=test`. Seeding is allowed in `development`, `staging`, and `test` environments.

```env
DATABASE_URL=postgresql://cm:cm_dev_password@localhost:5434/community_marketplace
```

## Manual E2E (not fully automated)

- **Stripe payments:** test keys in `apps/api/.env` + `pnpm stripe:listen`
- **Search:** Meilisearch on `http://localhost:7700`
- **OTP:** codes logged to API console when `OTP_PILOT_MODE` is on; web banner uses `NEXT_PUBLIC_OTP_PILOT_MODE`

## Re-seeding

`pnpm seed:rbac` is idempotent (upsert by stable IDs). Safe to re-run.

Use `RBAC_SEED_RESET_PASSWORD=true` to reset bootstrap account passwords on next seed.
