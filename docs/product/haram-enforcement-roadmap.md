# Haram / prohibited content enforcement roadmap

> **Status:** Phases A–D + F ✅ (2026-07-23) · Phase E (vision) deferred  
> **Policy source:** [master-blueprint-v1.md](./master-blueprint-v1.md) §6–§8  
> **Goal:** Hard/soft keyword filters, category flags, and image checks for a haram-free, Ireland-safe catalog

## Shipped

| Capability | Status |
|------------|--------|
| Scam / fraud keyword checks | ✅ |
| Listing auto-moderation → `pending_review` | ✅ |
| User reports + admin queue | ✅ |
| Haram hard/soft keyword tiers + admin JSON | ✅ A–B |
| Category `requiresReview` / `isHidden` | ✅ C |
| Image filename heuristics | ✅ D |
| Public `/policies/prohibited-items` + listing-create link | ✅ F |
| Structured API codes + `policyUrl` | ✅ F |
| Vision image classification | 📋 E (deferred) |
| Admin reject/soft-queue analytics dashboard | 📋 Optional later |

## Production rollout checklist

1. [ ] Deploy `main` and run migrations (`keyword_filters`, `category_review_flags`)
2. [ ] Restart API so Prisma client picks up new fields
3. [ ] Smoke-test image upload with a filename containing `weapon` / `beer` (expect 400 + `IMAGE_FLAG_*`)
4. [ ] In staging, enable text filters:  
      `PATCH /api/admin/monetization/settings` → `{ "keywordFilters": { "enabled": true } }`
5. [ ] Smoke-test listing title/description with hard term (expect 400 + `PROHIBITED_*` + `policyUrl`) and soft term (expect queue / `SOFT_BLOCK_REVIEW`)
6. [ ] In `/admin/categories`, mark restricted cats `requiresReview` (perfumes, wellness, supplements, collectibles) and hide any legacy prohibited trees
7. [ ] Reindex categories search after hiding cats (admin Search → reindex categories)
8. [ ] Keep `keywordFilters.enabled = false` in prod until staging sign-off

## Phase E — Vision provider (deferred)

1. Async scan on upload
2. Confidence thresholds + kill switch
3. Cost controls + appeals

Do this only when vision spend is justified.

## API error codes (seller-facing)

| Code | When |
|------|------|
| `PROHIBITED_ALCOHOL` / `_PORK` / `_ADULT` / `_GAMBLING` / `_INTOXICANT` / `_WEAPON` / `_ILLEGAL` | Hard keyword block (`keywordFilters.enabled`) |
| `SOFT_BLOCK_REVIEW` | Soft keyword / category review reason string |
| `IMAGE_FLAG_*` | Filename/URL image heuristic block (always on) |

Body shape: `{ code, message, policyUrl?, details? }` via global exception filter.
