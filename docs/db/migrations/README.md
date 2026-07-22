# Database Migrations

> **Canonical location:** `apps/api/prisma/migrations/` (do **not** use `docs/db/schema.prisma` as the migrate source — that mirror may be stale).

Prisma migrations are applied from the API package:

```bash
pnpm --filter @community-marketplace/api prisma:migrate:deploy
# or locally:
cd apps/api && pnpm prisma migrate dev --name <description>
```

## Structure

```
apps/api/prisma/migrations/
├── <timestamp>_<name>/
│   └── migration.sql
└── migration_lock.toml
```

Dozens of migrations are already applied in the repo (auth, listings, payments, monetization, display ads, AI marketing, stores, reserves, etc.). Prefer `prisma migrate status` over any placeholder log here.

## Workflow

```bash
# Generate migration from schema changes
cd apps/api
pnpm prisma migrate dev --name <description>

# Apply in production / VPS
pnpm prisma migrate deploy
```

## Rollback policy

- Production rollbacks require a new forward migration (no `migrate reset` in prod)
- Test all migrations against staging / a backup restore before production deploy
- Backup before applying: see [restore-backup.md](../runbooks/restore-backup.md) / infra backup scripts
