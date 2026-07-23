# Monetization

> **This document has been consolidated.**

The single canonical planning document is:

**[master-blueprint-v1.md](./master-blueprint-v1.md)** — SellNearby Master Blueprint (v1)

It includes monetization, pricing, rollout, revenue model, UX flows, safety, moderation, and category tree — with full engineering specs, copy, and policy in appendices A–L.

**Implementation status (2026-07-23):** Foundation through Growth Phases 1 / 1.5 / 2 / 3 are live, plus wallet spend (boosts / fast-track / early unlock), buyer statements, store slots, featured storefront, AI credit packs, and Seller Growth Pack. Featured listing slots remain **card-only** (no credit mix). GMV listing checkout remains **card-only**. Still open: priority message (no purchase type), buyer protection (legal), Starter/Pro/Premium ledger packages, advertiser self-serve ads, GMV wallet+card mix — see [§1.2 Revenue streams](./master-blueprint-v1.md#12-revenue-streams) and [Growth phases](./master-blueprint-v1.md#growth-phases).

### External display advertising (brands / sponsors)

**Admin campaign MVP (Phases 1–2):** ops upload a creative and schedule it into existing slots — homepage leaderboard, browse/category sidebar, and search/browse inline are live. Payment stays offline. Gated by `ADS_SYSTEM_ENABLED` + `displayAdsEnabled` (optional `ADS_PREVIEW_MODE` for empty shells). See [display-ads-admin-campaigns.md](./display-ads-admin-campaigns.md).

**Not built:** advertiser self-serve portal, in-product checkout, CPM auctions.

Sellers already buy **boosts** and **featured** via Listing promotions — separate from brand banner slots.

**Planned later (roadmap Enterprise):**
- Advertiser (or admin-on-behalf) self-serve: creative, targeting, schedule, checkout
- Advanced reporting beyond basic impression/click counters

For payment implementation details (seller products), see [payments API](../api/payments.md).
