# Listings API

> Base paths: `/api/listings`, `/api/seller/listings`, `/api/buyer/favorites`, `/api/admin/listings`

## Overview

Enterprise listings module backed by PostgreSQL (Prisma), Cloudflare R2 media uploads, Meilisearch indexing, and Redis-cached discovery feeds. All mutations are RBAC-protected; public browse/search/feeds are open.

## RBAC summary

| Role | Capabilities |
|------|----------------|
| **SELLER** | CRUD own listings, media upload, lifecycle (sold/archive), dashboard analytics |
| **BUYER** | Favorites, report listings |
| **ADMIN** | `manage_listings`, `ban_listing`, `manage_reports` — full listing moderation |
| **SUPER_ADMIN** | Full override on all admin listing actions |

---

## 5.1 — Data model

### Listing

| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID | |
| `sellerId` | UUID | FK → User |
| `title` | string | 3–200 chars |
| `description` | string | 10–5000 chars |
| `price` | decimal | ≥ 0 |
| `currency` | string | ISO 4217 (3 chars) |
| `categoryId` | UUID | FK → Category |
| `condition` | enum | `new`, `like_new`, `good`, `fair`, `poor` |
| `status` | enum | `draft`, `pending_review`, `active`, `reserved`, `paused`, `expired`, `sold`, `ended`, `removed`, `rejected`, `flagged`, `under_investigation`, `suspended_seller` |
| `location` | object | `{ label, latitude, longitude }` |
| `viewCount` | int | Analytics |
| `favoriteCount` | int | Denormalized counter |
| `createdAt` / `updatedAt` | ISO datetime | |

### ListingImage

| Field | Type |
|-------|------|
| `id` | UUID |
| `listingId` | UUID |
| `url` | string |
| `order` | int (0–9, max 10 images) |

### Category

| Field | Type |
|-------|------|
| `id` | UUID |
| `name` | string |
| `slug` | string (unique) |
| `icon` | string (optional) |
| `parentId` | UUID (optional hierarchy) |

### Related tables

- `listing_favorites` — buyer/seller saved listings
- `listing_reports` — moderation queue
- `listing_audit_logs` — status and lifecycle audit trail

---

## 5.2 — Seller listing CRUD

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| `GET` | `/seller/listings` | `view_listings` | My listings (optional `?status=`) |
| `GET` | `/seller/listings/sold` | `view_listings` | My sold items |
| `GET` | `/seller/listings/ended` | `view_listings` | My ended / archived items (status `ended`) |
| `POST` | `/seller/listings` | `create_listing` | Create listing |
| `PATCH` | `/seller/listings/:id` | `edit_listing` | Update own listing |
| `DELETE` | `/seller/listings/:id` | `delete_listing` | Delete own listing |
| `POST` | `/seller/listings/:id/sold` | `edit_listing` | Mark as sold |
| `POST` | `/seller/listings/:id/archive` | `archive_listing` | Archive listing |
| `POST` | `/seller/listings/:id/unarchive` | `archive_listing` | Restore to active |

**Admin override:** `ADMIN` / `SUPER_ADMIN` with `edit_listing` / `delete_listing` may modify any listing.

### Create listing

```http
POST /api/seller/listings
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Vintage Bicycle",
  "description": "Well-maintained vintage bicycle in great condition.",
  "price": 150,
  "currency": "USD",
  "categoryId": "<uuid>",
  "condition": "good",
  "location": {
    "label": "Downtown",
    "latitude": 40.7128,
    "longitude": -74.0060
  },
  "status": "active"
}
```

---

## 5.3 — Media handling

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| `GET` | `/listings/:id/images` | Public | List images |
| `POST` | `/seller/listings/:id/images/upload-url` | `edit_listing` | Presigned R2 upload URL |
| `POST` | `/seller/listings/:id/images/confirm` | `edit_listing` | Confirm uploads after PUT |
| `PATCH` | `/seller/listings/:id/images/order` | `edit_listing` | Reorder images |
| `DELETE` | `/seller/listings/:id/images/:imageId` | `edit_listing` | Remove image |

### Upload flow

1. Request upload URL (validates type, size ≤ 5MB, max 10 images):

```http
POST /api/seller/listings/:id/images/upload-url
{
  "contentType": "image/jpeg",
  "fileName": "bike.jpg",
  "fileSizeBytes": 204800
}
```

2. `PUT` file to returned `uploadUrl`.
3. Confirm with storage keys:

```http
POST /api/seller/listings/:id/images/confirm
{ "keys": ["listings/<sellerId>/<listingId>/<uuid>.jpg"], "orders": [0, 1] }
```

**Optimization:** Public URLs support CDN transform params (`format=webp&width=1200&quality=82`) via `optimizedUrl` in the upload response.

---

## 5.4 — Search & filters

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/listings/search` | Public | Keyword + filter search |

### Query parameters

| Param | Type | Description |
|-------|------|-------------|
| `q` | string | Keyword search |
| `categoryId` | UUID | Category filter |
| `minPrice` / `maxPrice` | number | Price range |
| `condition` | enum | Condition filter |
| `latitude` / `longitude` | number | Center point |
| `radiusKm` | number | Distance radius (default 25) |
| `sort` | enum | `newest`, `price_low_to_high`, `price_high_to_low`, `nearest` |
| `page` / `limit` | number | Pagination |

Uses **Meilisearch** when available; falls back to PostgreSQL. Banned listings and suspended/banned sellers are excluded.

---

## 5.5 — Discovery feeds

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/listings/feeds` | Public | Cached discovery feed |

### Query parameters

| Param | Values |
|-------|--------|
| `feed` | `new_near_you`, `free_near_you`, `trending`, `recently_sold_near_you` |
| `latitude` / `longitude` | Required |
| `radiusKm` | Default 25 |
| `page` / `limit` | Pagination |

Feeds are cached in **Redis** (60s TTL) with in-memory fallback when `REDIS_URL` is unset.

---

## 5.6 — Favorites

| Method | Path | Role | Permission |
|--------|------|------|------------|
| `GET` | `/buyer/favorites` | BUYER, SELLER | `favorite_listing` |
| `POST` | `/buyer/favorites/:listingId` | BUYER, SELLER | `favorite_listing` |
| `DELETE` | `/buyer/favorites/:listingId` | BUYER, SELLER | `favorite_listing` |

---

## 5.7 — Status lifecycle

| Transition | Who |
|------------|-----|
| `draft` → `pending_review` | Seller submit |
| `pending_review` → `active` | Admin approve (or auto-publish path) |
| `active` → `sold` | Seller (own) or Admin |
| `active` → `paused` / `ended` | Seller pause / end (archive ≡ `ended`) |
| `paused` → `active` | Seller resume |
| `active` → `removed` | Admin remove / ban path (`bannedAt`) |

All transitions write to listing audit logs. There is **no** Prisma status value `archived` or `banned`.

---

## 5.8 — Reports & moderation

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| `POST` | `/buyer/listings/:listingId/report` | `report_listing` | Report a listing |
| `GET` | `/admin/listings/reports` | `manage_listings` | Open reports queue |
| `POST` | `/admin/listings/reports/:reportId/action` | `manage_reports` | Take moderation action |

### Report body

```json
{ "reason": "misleading", "description": "Item not as described" }
```

### Moderation action

```json
{
  "action": "ban_listing",
  "moderationNotes": "Counterfeit goods",
  "warnMessage": "Repeated violations may result in account suspension"
}
```

Actions: `ban_listing`, `warn_seller`, `dismiss`, `none`.

---

## 5.9 — Seller dashboard

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/seller/listings/analytics/summary` | Aggregate views/favorites |
| `GET` | `/seller/listings/:id/analytics` | Per-listing analytics |

---

## 5.10 — Admin listing management

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| `GET` | `/admin/listings` | `manage_listings` | List/filter all listings |
| `GET` | `/admin/listings/:id` | `manage_listings` | Listing detail |
| `PATCH` | `/admin/listings/:id` | `manage_listings` | Admin edit override |
| `POST` | `/admin/listings/:id/ban` | `ban_listing` | Ban listing |
| `POST` | `/admin/listings/:id/unban` | `ban_listing` | Unban listing |

Filters: `status`, `categoryId`, `sellerId`, `search`, `page`, `limit`.

---

## Public catalog

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/listings` | Paginated active listings |
| `GET` | `/listings/categories` | Active categories |
| `GET` | `/listings/:id` | Detail (increments view count) |

---

## Error cases

| Status | When |
|--------|------|
| `400` | Invalid transition, validation failure, image limit exceeded |
| `401` | Missing/invalid JWT on protected routes |
| `403` | Insufficient permissions or not listing owner |
| `404` | Listing/category/image not found; hidden seller listings |
| `409` | Duplicate favorite |

---

## Environment

| Variable | Purpose |
|----------|---------|
| `R2_*` | Cloudflare R2 image uploads |
| `MEILISEARCH_HOST` / `MEILISEARCH_API_KEY` | Search indexing |
| `REDIS_URL` | Feed cache (optional) |

---

## Related

- Types: `packages/types/src/listing.ts`
- Validation: `packages/validation/src/listing.schema.ts`
- Prisma: `apps/api/prisma/schema.prisma`
- Search indexing: `listing.created` / `listing.updated` / `listing.deleted` events → Meilisearch
