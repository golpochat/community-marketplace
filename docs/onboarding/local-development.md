# Local Development

## Environment files

| App | Example |
|-----|---------|
| API | `apps/api/.env` |
| Web | `apps/web/.env.local` |
| Admin | `apps/admin/.env.local` |

Copy from respective `.env.example` files.

## Services

| Service | Default URL |
|---------|-------------|
| API | http://localhost:4000 |
| Web | http://localhost:3000 |
| Admin | http://localhost:3001 |
| Postgres | localhost:5434 |
| Redis | localhost:6379 |
| Meilisearch | http://localhost:7700 |

## Hot reload

`pnpm dev` runs NestJS watch + Next.js dev servers. API rebuilds `packages/validation` on start.

## Worker (optional)

```bash
pnpm --filter @community-marketplace/api start:worker
# Health: http://localhost:4001/health
```

Set `BULLMQ_MODE=both` in API `.env` to process jobs in API process instead.

## Related

- [Queues](./queues.md)
- [Migrations](./migrations.md)
