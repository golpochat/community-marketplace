# Monetization

> **This document has been consolidated.**

The single canonical planning document is:

**[master-blueprint-v1.md](./master-blueprint-v1.md)** — SellNearby Master Blueprint (v1)

It includes monetization, pricing, rollout, revenue model, UX flows, safety, moderation, and category tree — with full engineering specs, copy, and policy in appendices A–L.

**Implementation status (2026-06-27):** Foundation, Phase 1 (boosts), Phase 1.5 (featured), and Phase 3 (fast-track) are live. Phase 2 (wallet spend) and Phases 4–6+ remain planned — see the blueprint header and [Growth phases](./master-blueprint-v1.md#growth-phases).

### Future — external display advertising (brands / sponsors)

**Not built yet.** Admin **Advertising → Display advertising** only reserves homepage / browse / search banner **slots** (plus env kill-switches and preview placeholders).

Sellers already buy **boosts** and **featured** via Listing promotions. Outside brands (non-sellers) **cannot** self-serve upload creative and pay for banner placement today.

**Planned later:**
- Advertiser (or admin-on-behalf) campaign flow: creative upload, placement targeting, schedule, checkout
- Serve paid creatives into existing display slots instead of empty/preview shells
- Separate from seller listing boosts / featured SKUs

For payment implementation details, see [payments API](../api/payments.md).
