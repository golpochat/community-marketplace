# Database Migrations

> **Status:** Placeholder — migrations will be generated from `schema.prisma`.

## Structure

```
migrations/
├── 0001_init/              # Initial schema (users, listings, categories)
├── 0002_payments/          # Payments + Stripe Connect
├── 0003_chat/              # Conversations + messages
├── 0004_moderation/        # Reports + bans
└── README.md
```

## Workflow (future)

```bash
# Generate migration from schema changes
npx prisma migrate dev --name <description> --schema docs/db/schema.prisma

# Apply in production
npx prisma migrate deploy --schema docs/db/schema.prisma
```

## Migration log

| # | Name | Description | Status |
|---|------|-------------|--------|
| — | — | No migrations applied yet | Pending |

## Rollback policy

- Production rollbacks require a new forward migration (no `migrate reset` in prod)
- Test all migrations against staging before production deploy
- Backup before applying: `./infra/scripts/backup.sh`
