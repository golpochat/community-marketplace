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

### Local / staging (done on local DB 2026-07-23)

1. [x] Migrations applied (`keyword_filters`, `category_review_flags`)
2. [x] Matcher smoke: hard `PROHIBITED_ALCOHOL`, soft perfume, image `IMAGE_FLAG_WEAPON`
3. [x] `keywordFilters.enabled = true` on local `platform_settings`
4. [x] Restricted categories created with `requiresReview`: perfumes, wellness, supplements, collectibles
5. [x] Public `GET /api/listings/categories` returns the new flagged categories

Apply again anytime: `cd apps/api && node scripts/haram-rollout-apply.js`  
(requires `packages/utils` dist built: `pnpm --filter @community-marketplace/utils exec tsc -p tsconfig.json --outDir dist`)

### VPS / production (run on a machine with SSH)

```bash
cd /opt/sellnearby
git pull origin main
./infra/scripts/vps-update.sh
# inside API container or host with DATABASE_URL:
# node apps/api/scripts/haram-rollout-apply.js
# then reindex categories from admin Search if needed
```

1. [ ] Deploy `main` + migrations on VPS
2. [ ] Run `haram-rollout-apply.js` against prod DB (or enable filters + flags via admin UI)
3. [ ] Reindex categories (admin Search)
4. [ ] Smoke-test one hard-term listing create and one image upload with a banned filename

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
