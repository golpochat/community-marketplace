# Search API

> Base paths: `/api/listings/search`, `/api/search`, `/api/buyer/search`, `/api/seller/search`, `/api/admin/search`

## Overview

Enterprise search powered by **Meilisearch** with PostgreSQL fallback, Redis-cached autocomplete, optional **semantic hybrid ranking** (OpenAI embeddings), BullMQ background reindex jobs, and admin analytics.

### Indexes

| Index | Entities | Public |
|-------|----------|--------|
| `listings` | Active listings with geo, seller info, images | Yes |
| `users` | Sellers (public name, avatar, verification) | Yes |
| `categories` | Active categories with parent slug | Yes |
| `chat_threads` | Thread metadata (admin only) | Admin |

### Listing document schema

`id`, `sellerId`, `sellerName`, `sellerVerified`, `title`, `description`, `price`, `currency`, `categoryId`, `categorySlug`, `categoryName`, `condition`, `status`, `locationLabel`, `_geo`, `imageUrl`, `favoriteCount`, `viewCount`, `createdAt`, `sellerStatus`, `embedding?`

---

## Full-text listing search

```http
GET /api/listings/search?q=camera&categoryId=uuid&minPrice=10&maxPrice=500&condition=good&latitude=40.7&longitude=-74.0&radiusKm=25&sort=nearest&page=1&limit=20&cursor=1710000000000&semantic=true
```

### Sort options

| Value | Description |
|-------|-------------|
| `newest` | Newest first (default) |
| `price_low_to_high` | Ascending price |
| `price_high_to_low` | Descending price |
| `nearest` | Geo distance (requires lat/lng) |

### Pagination

- **Offset:** `page` + `limit`
- **Cursor:** `cursor` (listing `createdAt` epoch ms from prior response `meta.nextCursor`)

Banned listings and suspended sellers are excluded from public search.

Role-scoped mirrors:
- `GET /api/buyer/search/listings`
- `GET /api/seller/search/listings`

---

## Autocomplete

```http
GET /api/search/autocomplete?q=cam&types=listing,category,seller&limit=8
```

Prefix search with Meilisearch typo tolerance. Results cached in Redis (120s TTL).

---

## Global search

```http
GET /api/search/global?q=bike&limit=10
```

Returns weighted results:
- Listings (weight ×3)
- Categories (weight ×2)
- Sellers (weight ×1)

Admins may pass `includeRestricted=true` (with auth) to include banned/inactive records.

---

## Semantic search

Set `semantic=true` on listing search. When `OPENAI_API_KEY` is configured:
1. Embeddings generated for listing title + description at index time
2. Hybrid ranking combines keyword score (60%) + cosine similarity (40%)

Falls back to keyword-only search when embeddings unavailable.

---

## Indexing pipelines

### Real-time (event bus)

| Event | Action |
|-------|--------|
| `listing.created` / `listing.updated` | Upsert or remove listing |
| `listing.deleted` | Delete document |
| `user.profile_updated` | Reindex user |
| `user.verification_approved` / `rejected` | Reindex user |
| `category.updated` | Reindex category |

### Background (BullMQ)

| Job | Description |
|-----|-------------|
| `search.reindex` | Full reindex for one index type |
| `search.nightly_sync` | Scheduled sync of listings, users, categories |

```http
POST /api/admin/search/reindex
{ "type": "listings" }

GET /api/admin/search/reindex/listings/status
```

---

## Search analytics

Tracked automatically on searches and via:

```http
POST /api/search/click
{ "query": "camera", "entity": "listings", "clickedId": "uuid" }
```

```http
GET /api/admin/search/analytics
```

Returns popular keywords, zero-result queries, trending categories, CTR.

---

## Admin search management

| Method | Path | Permission |
|--------|------|------------|
| `GET` | `/admin/search/indexes` | `manage_search_index` |
| `GET` | `/admin/search/health` | `manage_search_index` |
| `POST` | `/admin/search/reindex` | `reindex_search` |
| `GET` | `/admin/search/analytics` | `manage_search_index` |
| `POST` | `/admin/search/synonyms` | `manage_search_index` |
| `POST` | `/admin/search/stop-words` | `manage_search_index` |
| `PATCH` | `/admin/search/relevance` | `manage_search_index` |

`SUPER_ADMIN` has full access.

---

## RBAC summary

| Audience | Access |
|----------|--------|
| Public | Listing search, autocomplete, global (public data) — primary UI `/listings` |
| `BUYER` / `SELLER` / `MEMBER` | API mirrors `/buyer/search/*`, `/seller/search/*`; UI browse is `/listings` |
| `ADMIN` | Admin tools + restricted global search (`/admin/search`) |
| `SUPER_ADMIN` | Full access |

---

## Environment

| Variable | Description |
|----------|-------------|
| `MEILISEARCH_HOST` | Meilisearch URL |
| `MEILISEARCH_API_KEY` | API key |
| `REDIS_URL` | Autocomplete cache + BullMQ |
| `OPENAI_API_KEY` | Optional semantic embeddings |

---

## Frontend routes

| Role | Route |
|------|-------|
| Public browse | `/listings` |
| API mirrors | `/api/buyer/search/*`, `/api/seller/search/*` |

---

## Error cases

| Scenario | Behavior |
|----------|----------|
| Meilisearch down | PostgreSQL fallback for listing search |
| Zero Meili hits (healthy) | Empty result set (no false DB fallback) |
| Invalid filters | `400` validation error |
| Reindex failure | Job status `failed` with error message |
