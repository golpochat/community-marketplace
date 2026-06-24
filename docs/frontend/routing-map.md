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
/chat                      → Chat redirect hub
```

## Buyer (`apps/web/src/app/buyer/`)

```
/buyer/dashboard           → BuyerDashboardPage
/buyer/listings            → BuyerListingsPage
/buyer/favorites           → BuyerFavoritesPage
/buyer/purchases           → re-exports payments
/buyer/payments            → PaymentsPage
/buyer/chat                → BuyerChatPage
/buyer/notifications       → BuyerNotificationsPage
/buyer/settings            → BuyerSettingsPage
/buyer/search              → SearchPage
```

## Seller (`apps/web/src/app/seller/`)

```
/seller/dashboard          → SellerDashboardPage
/seller/listings           → SellerListingsPage
/seller/listings/create    → CreateListingPage
/seller/sales              → SellerSalesPage
/seller/earnings           → EarningsPage
/seller/chat               → SellerChatPage
/seller/verification       → SellerVerificationPage
/seller/notifications      → SellerNotificationsPage
/seller/settings           → SellerSettingsPage
/seller/search             → SearchPage
```

## Middleware

| Path prefix | Required role |
|-------------|---------------|
| `/buyer/*` | `BUYER` |
| `/seller/*` | `SELLER` |
| `/dashboard/*` | Redirects to role dashboard |

## API routes (web client)

See `apps/web/src/lib/api-routes.ts` (`WEB_API_ROUTES`).

## Path constants

See `apps/web/src/lib/rbac-routes.ts` (`WEB_APP_ROUTES`).
