# Running Queues (BullMQ)

## Modes

| `BULLMQ_MODE` | Behavior |
|---------------|----------|
| `both` | API enqueues and processes (local dev default) |
| `producer` | API enqueues only (Docker/K8s API) |
| `worker` | Dedicated worker process |

## Local worker

```bash
# Terminal 1
pnpm dev:api
# Set BULLMQ_MODE=producer in .env

# Terminal 2
pnpm --filter @community-marketplace/api start:worker
```

Requires `REDIS_URL=redis://localhost:6379`.

## Monitor

```bash
curl http://localhost:4000/api/health/queues
```

## Job types

- `search.reindex`
- `search.nightly_sync`
- `moderation.lift_suspension`
- `storage.cleanup_orphans`

## Related

- [Event-driven architecture](../architecture/event-driven.md)
- [Infrastructure](../infrastructure/README.md)
