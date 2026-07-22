# Display ads — Admin campaign MVP

> **Status:** Phase 2 implemented — homepage + browse/category sidebar + search/browse inline. Self-serve brand portal is **not** in scope.
>
> Related: [monetization.md](./monetization.md), [roadmap.md](./roadmap.md) (Enterprise self-serve).

## Goal

Sell sponsorships **offline**, run creatives from **Admin** into existing display slots. No advertiser accounts, no in-app checkout.

## What stays manual (ops)

| Step | How |
|------|-----|
| Lead → deal | Email / sales |
| Pricing | Offline rate card |
| Payment | Invoice / bank / Stripe Payment Link outside product |
| Creative | Brand sends image + click URL + dates |
| Brand safety | Admin review before publish |
| Pause / end | Admin toggles campaign |

## What the product does

1. Admin creates a campaign (advertiser name, placement, schedule, image, click URL).
2. Admin publishes (or pauses / ends).
3. Public `GET /ads/placements` returns the winning live creative for each slot when display ads are effective.
4. Homepage renders the creative instead of an empty shell.

## Placements (existing)

| Placement | Size | Contexts | UI |
|-----------|------|----------|----|
| `homepage_leaderboard` | 728×90 | homepage | **Live** |
| `category_sidebar` | 300×250 | category, browse | **Live** (desktop sidebar) |
| `search_results_inline` | 320×100 | search, browse | **Live** (above results) |

## Campaign model

- `advertiserName` (+ optional email / notes)
- `placement`, `startsAt`, `endsAt`
- `status`: `draft` \| `scheduled` \| `live` \| `paused` \| `ended`
- `imageKey` / `imageUrl`, `clickUrl`, `altText`
- `priority` — higher wins if two campaigns overlap on the same placement

**Serve rule:** `status ∈ {live, scheduled}` AND `startsAt ≤ now ≤ endsAt`, order by `priority DESC`, then `startsAt ASC`. Still gated by `ADS_SYSTEM_ENABLED` + `displayAdsEnabled` (or preview mode for empty shells only — preview does not show paid creatives unless module is effective).

## Admin surfaces

- Monetization → **Advertising** → Display campaigns (list / create / edit / pause / end)
- Existing Display advertising publish toggle + deploy flags unchanged

## Non-goals (later)

- Advertiser self-serve portal
- In-product payment / SKUs / CPM auction
- Impression / click billing
- Targeting beyond placement + date range

## Suggested offline rate card (not in code)

| Placement | Example |
|-----------|---------|
| Homepage leaderboard | Highest — weekly flat |
| Category sidebar | Mid |
| Search inline | Lower |

## Rollout

1. **Phase 1:** Homepage serve + admin CRUD + upload ✅  
2. **Phase 2:** Wire browse/search/category slots in the web app ✅  
3. Optional click redirect + basic counters  
4. Self-serve only after real demand + traffic (roadmap Enterprise)

## Success criteria

- Offline deal → creative live on homepage after admin publish  
- Pause without deploy  
- Empty shell when no active campaign  
- No payment code in this MVP  
