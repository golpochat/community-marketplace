# Testing Guide

This project uses **Vitest integration tests** against a real PostgreSQL database, plus **deterministic seed scripts** for manual and automated QA.

## Quick start

```bash
# 1. Start infrastructure (from repo root)
docker compose -f infra/docker/docker-compose.dev.yml up -d postgres redis meilisearch

# 2. Migrate database
pnpm --filter @community-marketplace/api prisma:migrate:deploy

# 3. Seed everything (RBAC + users + test fixtures + monetization products)
pnpm seed:all

# 4. Run integration tests
pnpm --filter @community-marketplace/api test
```

## Seed commands

| Command | Purpose |
|---------|---------|
| `pnpm seed:rbac` | Roles, permissions, bootstrap super-admin |
| `pnpm seed:dev-users` | 7 dev users (all roles + personas) + 8 categories |
| `pnpm seed:test-data` | Stores, 17 listings (all statuses), payments, chat, disputes, moderation, fraud, invitations, verifications |
| `pnpm seed:all` | Runs all of the above + monetization products |

**Prerequisites:** `seed:test-data` requires `seed:rbac` and `seed:dev-users` first. `seed:all` handles the full chain.

## Test accounts (after `pnpm seed:dev-users`)

| Role | Email | Password |
|------|-------|----------|
| SUPER_ADMIN | `superadmin@community.market` | `ChangeMe!SuperAdmin1` |
| ADMIN | `admin@community.market` | `ChangeMe!Admin1` |
| ACCOUNTS_ADMIN | `accounts-admin@community.market` | `ChangeMe!Accounts1` |
| MODERATION_ADMIN | `moderation-admin@community.market` | `ChangeMe!Moderation1` |
| FINANCIAL_ADMIN | `financial-admin@community.market` | `ChangeMe!Financial1` |
| SELLER | `seller@community.market` | `ChangeMe!Seller1` |
| BUYER | `buyer@community.market` | `ChangeMe!Buyer1` |

### Additional test sellers (`pnpm seed:test-data`)

| Email | Password | Purpose |
|-------|----------|---------|
| `seller-unverified@community.market` | `ChangeMe!Seller2` | Unverified seller + verification queue |
| `seller-suspended@community.market` | `ChangeMe!Seller3` | Suspended seller + `suspended_seller` listing |

## Test fixtures overview

After `pnpm seed:test-data`:

- **4 storefronts** — primary/secondary for demo seller, unverified, suspended
- **17 listings** — one per major status (`draft` through `suspended_seller`), prefixed `[Test]`
- **1 succeeded payment** + open dispute on sold listing
- **1 chat thread** with 3 messages (including a flagged scam message)
- **2 moderation reports** + chat message flag
- **1 fraud signal** on flagged listing
- **1 pending admin invitation** (`invite-test@community.market`)
- **Pending verifications** — buyer ID check + seller verification request
- **Delivery & price review queues** — pending change logs
- **Buyer wallet + cashback grant** linked to test payment

Stable IDs live in `apps/api/src/database/test-data.seed.data.ts`.

## Automated tests

Integration tests live in `apps/api/test/integration/`:

| Suite | Verifies |
|-------|----------|
| `rbac.integration.test.ts` | Roles, permission catalog, persona scoping |
| `test-data.integration.test.ts` | Fixture counts, all listing statuses, relations |
| `listing-visibility.integration.test.ts` | Public browse visibility rules |

Tests **skip automatically** when `DATABASE_URL` is unset (e.g. CI without a database service).

```bash
# Run all API tests
pnpm --filter @community-marketplace/api test

# Watch mode
pnpm --filter @community-marketplace/api test:watch

# Integration only
pnpm --filter @community-marketplace/api test:integration
```

## Environment

Tests load `apps/api/.env` and default `NODE_ENV=test`. Seeding is allowed in `development`, `staging`, and `test` environments.

Required for integration tests:

```env
DATABASE_URL=postgresql://cm:cm_dev_password@localhost:5434/community_marketplace
```

## Manual E2E (not automated yet)

- **Stripe payments:** test keys in `apps/api/.env` + `pnpm stripe:listen`
- **Search:** Meilisearch on `http://localhost:7700`
- **OTP:** codes logged to API console in development

## Re-seeding

All seeds are **idempotent** (upsert by stable IDs). Safe to re-run:

```bash
pnpm seed:all
```

Use `RBAC_SEED_RESET_PASSWORD=true` to reset dev account passwords on next seed.
