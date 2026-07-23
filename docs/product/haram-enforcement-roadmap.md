# Haram / prohibited content enforcement roadmap

> **Status:** Phase A ✅ · Phase B ✅ · Phase C ✅ · Phase D ✅ · Phase F (policy page) ✅ · Phase E planned  
> **Policy source:** [master-blueprint-v1.md](./master-blueprint-v1.md) §6–§8  
> **Goal:** Hard/soft keyword filters, category flags, and image checks for a haram-free, Ireland-safe catalog

## Current baseline

| Capability | Status |
|------------|--------|
| Scam / fraud keyword checks | ✅ Live |
| Listing auto-moderation → `pending_review` | ✅ Live |
| User reports + admin queue | ✅ Live |
| Image filename hints | ✅ Phase D |
| Haram hard/soft tiers + admin JSON | ✅ Phase A–B |
| Category `requiresReview` / hidden | ✅ Phase C |
| Public `/policies/prohibited-items` | ✅ Phase F |
| Vision image classification | 📋 Phase E |
| Admin reject/soft-queue metrics | 📋 Phase F follow-up |

## Phase A — Foundations ✅

**Goal:** config + matcher + admin settings. **No listing reject yet.**

- [x] Types: `KeywordFiltersConfig` / match result
- [x] Defaults from blueprint §7.1–7.4 (`DEFAULT_KEYWORD_FILTERS`)
- [x] Shared matcher (`matchKeywordFilters`, allowlist, image hints)
- [x] `platform_settings.keyword_filters` JSON column
- [x] Exposed on `GET/PATCH /api/admin/monetization/settings` as `keywordFilters`
- [x] Master switch `keywordFilters.enabled` defaults **`false`** until enabled for Phase B

## Phase B — Keyword enforcement on listings ✅

1. [x] When `keywordFilters.enabled`, run matcher on create / update / title amend / submit / admin approve
2. [x] Hard → `400` BadRequest with prohibited-terms message
3. [x] Soft → audit / queue `pending_review` (create soft reasons; active/paused edits pull listing offline for review)
4. [x] Boost / featured already require `active`|`paused` — soft-queued listings cannot buy visibility
5. [x] Listing-create policy link (Phase F)
6. [x] Public `/policies/prohibited-items` page (Phase F)

**Enable in admin:** `PATCH /api/admin/monetization/settings` with `{ "keywordFilters": { "enabled": true } }` (other fields merge from defaults).

## Phase C — Category enforcement ✅

1. [x] `categories.requiresReview` / `isHidden`
2. [x] Inherit on listing create / category change / submit (soft-queue reason)
3. [x] Hide from public picker, browse-by-slug, and search facets / Meili index
4. [x] Admin category flags — `GET/PATCH /api/admin/categories` + `/admin/categories` UI

## Phase D — Image heuristics ✅

1. [x] Expanded `imageHints` defaults (alcohol, pork, weapons, drugs, adult, gambling, counterfeit)
2. [x] Reject upload when filename/key matches (`assertImageSourcesClean`) — always on, not gated by `keywordFilters.enabled`
3. [x] Re-check image URLs on submit; seller must replace before re-submit

## Phase E — Vision provider

1. Async scan on upload
2. Confidence thresholds + kill switch
3. Cost controls + appeals

## Phase F — Policy page + ops ✅ (page shipped; metrics later)

1. [x] `/policies/prohibited-items`
2. [x] Listing-create policy link
3. [ ] Audit which term/rule fired (structured codes in API responses)
4. [ ] Admin metrics (rejects / soft queue / false positives)

## Rollout rule

Ship **A → B → C → D → F**, then **E** when vision spend is justified. Keep `keywordFilters.enabled = false` in prod until Phase B is tested in staging. Image filename heuristics (Phase D) are always on.
