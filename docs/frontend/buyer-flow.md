# Buyer flow (unified account)

Canonical paths live under `/account`. Legacy `/buyer/*` URLs redirect.

## Navigation

Base sidebar: `ACCOUNT_SIDEBAR` in `packages/ui-dashboard` — Account home, Browse, Purchases, Saved, Messages, Disputes, Notifications, Settings.

## Core routes

| Path | Purpose |
|------|---------|
| `/account` | Account home |
| `/listings` | Browse marketplace |
| `/account/purchases` | Orders & payments (incl. future active reserves / complete purchase) |
| `/account/wallet` | SellNearby Credit |
| `/account/saved` | Favourites |
| `/account/messages` | Chat |
| `/account/disputes` | Purchase disputes |
| `/account/selling` | Opt in to sell |

Buying does not require a storefront. Starting to sell uses the seller setup workflow.

## Related product specs

- [Listing reserve](../product/listing-reserve.md) — free hold for ID-verified members after seller approval (Phase 1 MVP)
