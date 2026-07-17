# Seller flow (unified account)

Canonical paths live under `/account`. Legacy `/seller/*` URLs redirect.

## Navigation

Sidebar items for selling are built by `buildAccountSidebarItems` in `apps/web/src/lib/account-sidebar.ts`, driven by `deriveAccountSellingPhase`:

| Phase | Selling nav |
|-------|-------------|
| `buyer_only` | Start selling |
| `setup_in_progress` | Continue setup |
| `active_seller` | My listings, Create listing, Storefront, Earnings |
| `suspended` | Seller account |

Account shell: `AccountDashboardLayout` (`theme` = seller when setup/active).

## Core routes

| Path | Purpose |
|------|---------|
| `/account/selling` | Guided setup (type → storefront → listing → verify → payouts) |
| `/account/storefront` | Create/edit storefront (required before listings) |
| `/account/listings` | Manage listings |
| `/account/listings/create` | Create listing |
| `/account/verification` | Identity verification |
| `/account/earnings` | Earnings & Stripe Connect |

## Rules

1. Storefront (name) before any listing create.
2. Up to `sellerLimit` (default 5) admin-approved live listings while unverified.
3. Then `verification_required` — create/submit blocked until verified.
