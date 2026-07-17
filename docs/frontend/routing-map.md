# Routing Map

## Public (`apps/web/src/app/(site)/`)

```
/                          → HomePage
/listings                  → ListingsPage (client browse)
/listings/[id]             → ListingDetailPage
/store/[sellerSlug]        → StorePage
/auth/login                → LoginPage
/auth/register             → RegisterPage
/auth/activate             → ActivatePage
/help                      → HelpPage
/about                     → AboutPage
/chat                      → Chat redirect hub → /account/messages
```

## Account (unified marketplace — `apps/web/src/app/account/`)

Canonical member shell. Prefer these paths for all new work.

```
/account                   → Account home
/account/selling           → Seller setup workflow
/account/storefront        → Storefront management
/account/listings          → My listings
/account/listings/create   → Create listing
/account/listings/[id]/edit → Edit listing
/account/earnings          → Earnings & payouts
/account/verification      → Identity verification
/account/purchases         → Purchases
/account/wallet            → SellNearby Credit
/account/saved             → Saved items
/account/messages          → Messages
/account/disputes          → Disputes (buyer or seller view by phase)
/account/notifications     → Notifications
/account/settings          → Settings
```

Storefront is required before listing tools unlock (`SellerCapabilityGate`).

## Buyer / Seller (`/buyer/*`, `/seller/*`) — legacy

Exact and nested paths redirect into `/account/*` (or `/listings`) via `LEGACY_DASHBOARD_REDIRECTS` and prefix rewrites in `apps/web/src/lib/route-guards.ts`.

## Middleware

| Path prefix | Required role |
|-------------|---------------|
| `/account/*` | `MEMBER` (also legacy `BUYER` / `SELLER`) |
| `/buyer/*` | Buyer-capable roles (redirected) |
| `/seller/*` | Seller-capable roles (redirected) |
| `/dashboard/*` | Redirects to role dashboard |

## API routes (web client)

See `apps/web/src/lib/api-routes.ts` (`WEB_API_ROUTES`).

## Path constants

See `apps/web/src/lib/rbac-routes.ts` (`WEB_APP_ROUTES`) and `apps/web/src/lib/seller-routes.ts` / `buyer-routes.ts`.
