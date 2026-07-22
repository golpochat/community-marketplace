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
| `/account/marketing` | AI Marketing Hub |

## Rules

1. Storefront (name) before any listing create.
2. Up to `sellerLimit` (default 5) admin-approved live listings while unverified.
3. Then `verification_required` — create/submit blocked until verified.
4. After a listing has been approved once, title changes are **amendments only** (≥60% similarity). Live title stays visible until admin approves (`Title Reviews` admin queue).
5. Submit for review requires at least one photo.
6. After identity verification, soft-prompt Stripe Connect (banner on Selling / Listings / Create). Card checkout hard-requires Connect readiness.
7. Seller status `under_review` blocks new listing create/submit until verification completes.
8. New accounts (&lt;30 days) also have a fraud rate limit of 5 draft creates per day.
