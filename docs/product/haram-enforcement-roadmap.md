# Haram / prohibited content enforcement roadmap

> **Status:** Phase A ✅ · Phase B ✅ (2026-07-23) · Phases C–F planned  
> **Policy source:** [master-blueprint-v1.md](./master-blueprint-v1.md) §6–§8  
> **Goal:** Hard/soft keyword filters, category flags, and image checks for a haram-free, Ireland-safe catalog

## Current baseline (before this work)

| Capability | Status |
|------------|--------|
| Scam / fraud keyword checks | ✅ Live |
| Listing auto-moderation → `pending_review` | ✅ Live |
| User reports + admin queue | ✅ Live |
| Image filename hints (limited) | ✅ Partial |
| Haram hard/soft tiers + admin JSON | 🚧 Phase A |
| Category `requiresReview` / hidden | 📋 Phase C |
| Vision image classification | 📋 Phase E |

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
5. [ ] Seller UI field-level errors + policy link (follow-up web polish)
6. [ ] Public `/policies/prohibited-items` page (Phase F)

**Enable in admin:** `PATCH /api/admin/monetization/settings` with `{ "keywordFilters": { "enabled": true } }` (other fields merge from defaults).

## Phase C — Category enforcement

1. `categories.requiresReview` / `isHidden`
2. Inherit on listing create
3. Hide from browse/search facets
4. Admin category flags

## Phase D — Image heuristics

1. Expand filename/caption hints via `imageHints`
2. Pause + queue on hit
3. Require image replace before re-submit

## Phase E — Vision provider

1. Async scan on upload
2. Confidence thresholds + kill switch
3. Cost controls + appeals

## Phase F — Policy page + ops

1. `/policies/prohibited-items`
2. Listing-create policy link
3. Audit which term/rule fired
4. Admin metrics (rejects / soft queue / false positives)

## Rollout rule

Ship **A → B → C → D → F**, then **E** when vision spend is justified. Keep `keywordFilters.enabled = false` in prod until Phase B is tested in staging.
