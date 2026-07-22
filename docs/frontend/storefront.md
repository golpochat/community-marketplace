# Storefront System

Each seller can have one public storefront at `/store/[sellerSlug]`.

**Managed at** `/account/storefront` (legacy `/seller/storefront` redirects there).

## Data model

Types live in `packages/types/src/storefront.ts`:

- `SellerStorefront` — slug, branding, sections, listings, reviews, policies, analytics
- `StoreSection` — up to 10 optional sections grouping listing IDs
- `StoreReview`, `StorePolicy`, `StoreAnalytics` — placeholder-friendly metadata

## Service

`apps/web/src/services/storefront.service.ts` fetches `GET /stores/:slug` with mock fallback from `lib/mock-data.ts` (`dublin-cycles` demo store).

## Components

| Component | Role |
|-----------|------|
| `StoreHeader` | Banner + logo + name + verified badge |
| `StoreDescription` | About text + analytics placeholders |
| `StoreSectionTabs` | Filter listings by section (max 10) |
| `StoreListingGrid` | Listing cards for active section |
| `StoreReviewList` | Review placeholders |
| `StorePolicySection` | Returns, shipping, response time |

## Branding

- `bannerUrl` — full-width header image (fallback gradient)
- `logoUrl` — circular store logo overlaying banner

## Linking from listings

`SellerCard` on listing detail links to `/store/{sellerSlug}` when a slug is known.

## API

Backend `GET /api/stores/:slug` is **live** (`StoresController`). Web page: `/store/[slug]`. Client may still fall back to mock data when the API is unavailable.
