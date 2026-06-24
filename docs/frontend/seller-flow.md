# Seller Flow

## Routes

| Route | Page |
|-------|------|
| `/seller/dashboard` | Stats cards + weekly chart placeholder |
| `/seller/listings` | Manage listings |
| `/seller/listings/create` | Multi-step `ListingForm` |
| `/seller/sales` | Sales history |
| `/seller/earnings` | Stripe Connect + payouts |
| `/seller/chat` | Buyer messaging |
| `/seller/verification` | Identity verification |
| `/seller/notifications` | Seller notifications |
| `/seller/settings` | Store & account settings |

## Navigation

`SELLER_SIDEBAR` in ui-dashboard. Mobile drawer via `SellerSidebar`.

## Listing creation

`ListingForm` is a 4-step wizard: Details → Pricing → Location → Review.

## Storefront

Sellers get a public shop at `/store/[sellerSlug]` (see [storefront.md](./storefront.md)).

## Auth

Requires `SELLER` role. Middleware enforces route access.
