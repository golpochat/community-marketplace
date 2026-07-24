# Monetization

> **This document has been consolidated.**

The single canonical planning document is:

**[master-blueprint-v1.md](./master-blueprint-v1.md)** — SellNearby Master Blueprint (v1)

It includes monetization, pricing, rollout, revenue model, competitive positioning / Year-1 GTM (§11), UX flows, safety, moderation, and category tree — with full engineering specs, copy, and policy in appendices A–L.

**Revenue stance:** [§4](./master-blueprint-v1.md#4-revenue-projection-12-months) — bootstrap: Year-1 **€3k–€15k**, marketing **€30–€50/mo**, solo; **ops cash BEP ~3–8 months** then reinvest ([§12.13](./master-blueprint-v1.md#1213-break-even--reinvest-rules)). **Execute:** [§12](./master-blueprint-v1.md#12-year-1-execution-plan).

**Implementation status (2026-07-24):** Foundation through Growth Phases 1 / 1.5 / 2 / 3 are live, plus wallet spend (boosts / fast-track / early unlock), buyer statements, **priority message**, store slots, featured storefront, AI credit packs, and Seller Growth Pack. Featured listing slots remain **card-only** (no credit mix). GMV listing checkout remains **card-only**. Still open: buyer protection (legal), Starter/Pro/Premium ledger packages, advertiser self-serve ads, GMV wallet+card mix — see [§1.2 Revenue streams](./master-blueprint-v1.md#12-revenue-streams) and [Growth phases](./master-blueprint-v1.md#growth-phases).

### External display advertising (brands / sponsors)

**Admin campaign MVP (Phases 1–2):** ops upload a creative and schedule it into existing slots — homepage leaderboard, browse/category sidebar, and search/browse inline are live. Payment stays offline. Gated by `ADS_SYSTEM_ENABLED` + `displayAdsEnabled` (optional `ADS_PREVIEW_MODE` for empty shells). See [display-ads-admin-campaigns.md](./display-ads-admin-campaigns.md).

**Not built:** advertiser self-serve portal, in-product checkout, CPM auctions.

Sellers already buy **boosts** and **featured** via Listing promotions — separate from brand banner slots.

**Planned later (roadmap Enterprise):**
- Advertiser (or admin-on-behalf) self-serve: creative, targeting, schedule, checkout
- Advanced reporting beyond basic impression/click counters

For payment implementation details (seller products), see [payments API](../api/payments.md).

### Money vocabulary (glossary)

| Term | Meaning | User-facing? |
|------|---------|--------------|
| **SellNearby Credit** | Soft EUR balance (cashback + top-up packs). Spend on platform SKUs; no cash-out. | Yes — primary brand |
| **BuyerWallet** / route `/account/wallet` | Code/DB row and URL for that Credit balance | Code/URL only |
| **WalletTransaction** | Movement of SellNearby Credit (earn, spend, expire, top-up) | Prefer “Credit activity” in UI |
| **CashbackGrant** | Pending cashback before cooling unlock | Prefer “Pending cashback” |
| **LedgerEntry** | Payment settlement audit (charge / refund / payout) — not the buyer Credit wallet | Admin/ops |
| **Settlement / payout** | Stripe Connect money to the seller’s bank | Never call this “Credit” |
| **Escrow** | Not offered today | Disclaimer only |
| **AI free units** | Monthly free Marketing Hub generation quota | Keep distinct from Credit |
| **AI credit pack** | Paid SKU that **adds SellNearby Credit** | CTA: “Top up SellNearby Credit” |
