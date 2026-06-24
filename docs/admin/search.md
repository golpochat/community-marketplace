# Search Management (Admin)

> **Screen:** `/dashboard/search` · **Permission:** `manage_search_index`

## Operations

| Action | Description |
|--------|-------------|
| Index health | Meilisearch connectivity |
| Reindex | Full or per-type via BullMQ job |
| Synonyms / stop-words | Search tuning |
| Analytics | Query volume, zero-result rate |

## Reindex procedure

1. Open **Search** → check health
2. Trigger **Reindex** for `listings` (or all)
3. Monitor `GET /api/health/queues` for job backlog

## API

[search.md](../api/search.md) · [admin.md](../api/admin.md#search-apadminsearch)
