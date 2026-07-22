# Local Development

## Environment files

| App | Example |
|-----|---------|
| API | `apps/api/.env` (from `.env.example`) |
| Web | `apps/web/.env` or `.env.local` (from `.env.example`) |

`apps/admin` is **deprecated** — no separate admin env file.

## Services

| Service | Default URL |
|---------|-------------|
| API | http://localhost:4000/api |
| Web (marketplace + `/account` + `/admin` + `/super-admin`) | http://localhost:3000 |
| Postgres | localhost:5434 |
| Redis | localhost:6380 (Docker mapped; host install may use 6379) |
| Meilisearch | http://localhost:7700 |

## Feature flags (local)

| Flag | Notes |
|------|-------|
| `OTP_PILOT_MODE` | API — log OTP codes instead of live SMS |
| `NEXT_PUBLIC_OTP_PILOT_MODE` | Web — pilot banner (rebuild web when changing) |
| `ADS_SYSTEM_ENABLED` / `NEXT_PUBLIC_ADS_*` | Ads master + preview |
| `AI_MARKETING_ENABLED` | AI Marketing Hub |

## Hot reload

`pnpm dev` runs NestJS watch + Next.js web. API rebuilds `packages/validation` on start.

## Worker (optional)

```bash
pnpm --filter @community-marketplace/api start:worker
# Health: http://localhost:4001/health
```

Set `BULLMQ_MODE=both` in API `.env` to process jobs in API process instead.

## Related

- [Queues](./queues.md)
- [Migrations](./migrations.md)
- [Dev credentials](../dev-credentials.md)
