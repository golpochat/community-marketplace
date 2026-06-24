# Listings API

> **Status:** Placeholder — base path `/api/listings`

## Overview

CRUD operations for marketplace listings, categories, and images.

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/` | Public | Paginated listing browse |
| `GET` | `/categories` | Public | List categories |
| `POST` | `/categories` | Required | Create category |
| `GET` | `/:id` | Public | Listing detail |
| `POST` | `/` | Required | Create listing |
| `PATCH` | `/:id` | Required | Update listing |
| `DELETE` | `/:id` | Required | Delete listing |
| `GET` | `/:id/images` | Public | List images |
| `POST` | `/:id/images` | Required | Add image |
| `DELETE` | `/:id/images/:imageId` | Required | Remove image |

## Query parameters

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page (max 100) |

## Create listing

```http
POST /api/listings
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Vintage Bicycle",
  "description": "Well-maintained vintage bicycle in great condition.",
  "price": 150,
  "currency": "USD",
  "categoryId": "cat-sports",
  "condition": "good",
  "location": "Downtown",
  "imageUrls": ["https://cdn.example.com/bike.jpg"]
}
```

## Listing statuses

| Status | Description |
|--------|-------------|
| `draft` | Not visible publicly |
| `active` | Visible in browse/search |
| `sold` | Transaction completed |
| `archived` | Removed from active browse |

## Related

- Search indexing: see [architecture sequence diagrams](../architecture/sequence-diagrams.md)
- Types: `packages/types/src/listing.ts`
- Validation: `packages/validation/src/listing.schema.ts`

## TODO

- [ ] Image upload to object storage (S3 / GCS)
- [ ] Geo-location filtering
- [ ] Saved listings / favorites endpoints
