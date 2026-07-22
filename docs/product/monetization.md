# Monetization

> **This document has been consolidated.**

The single canonical planning document is:

**[master-blueprint-v1.md](./master-blueprint-v1.md)** — SellNearby Master Blueprint (v1)

It includes monetization, pricing, rollout, revenue model, UX flows, safety, moderation, and category tree — with full engineering specs, copy, and policy in appendices A–L.

**Implementation status (2026-07-22):** Foundation, Phase 1 (boosts), Phase 1.5 (featured listings), Phase 2 wallet spend (boosts + fast-track credits + early cashback unlock), and Phase 3 (fast-track) are live. Featured listing slots remain **card-only** (no credit mix). Phases 4–6+ remain planned — see the blueprint header and [Growth phases](./master-blueprint-v1.md#growth-phases).

### External display advertising (brands / sponsors)

**Admin campaign MVP (Phases 1–2):** ops upload a creative and schedule it into existing slots — homepage leaderboard, browse/category sidebar, and search/browse inline are live. Payment stays offline. Gated by `ADS_SYSTEM_ENABLED` + `displayAdsEnabled` (optional `ADS_PREVIEW_MODE` for empty shells). See [display-ads-admin-campaigns.md](./display-ads-admin-campaigns.md).

**Not built:** advertiser self-serve portal, in-product checkout, CPM auctions.

Sellers already buy **boosts** and **featured** via Listing promotions — separate from brand banner slots.

**Planned later (roadmap Enterprise):**
- Advertiser (or admin-on-behalf) self-serve: creative, targeting, schedule, checkout
- Advanced reporting beyond basic impression/click counters

For payment implementation details (seller products), see [payments API](../api/payments.md).
