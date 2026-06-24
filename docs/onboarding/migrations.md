# Database Migrations

## Development

```bash
cd apps/api
pnpm prisma:migrate          # migrate dev (interactive name)
pnpm prisma:seed             # seed data
pnpm run seed:rbac           # RBAC roles & permissions
```

## Deploy / CI

```bash
pnpm prisma:migrate:deploy   # apply pending migrations
# or
./infra/scripts/migrate.sh dev
```

## Scripts

| Script | Purpose |
|--------|---------|
| `infra/scripts/migrate.sh` | Environment-aware migrate deploy |
| `infra/scripts/migrate-and-seed.sh` | Dev bootstrap |

## Schema reference

- Prisma schema: `apps/api/prisma/schema.prisma`
- Docs mirror: `docs/db/schema.prisma`
- ERD: [docs/db/erd.md](../db/erd.md)

## Related

- [db/README.md](../db/README.md)
