# Prisma migrations

Generate the initial migration after PostgreSQL is available:

```bash
pnpm --filter @community-marketplace/api exec prisma migrate dev --name init_rbac
```

Then seed RBAC data and the bootstrap super-admin:

```bash
pnpm seed:rbac
# or
./infra/scripts/migrate-and-seed.sh
```

Staging:

```bash
NODE_ENV=staging pnpm --filter @community-marketplace/api exec prisma migrate deploy
NODE_ENV=staging ./infra/scripts/seed-rbac.sh
```
