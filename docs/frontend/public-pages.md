# Public Pages

Unauthenticated routes under the `(site)` route group.

| Route | Description |
|-------|-------------|
| `/` | Home — hero, categories, featured listings, how it works, trust |
| `/listings` | Searchable catalog with filters, pagination |
| `/listings/[id]` | Gallery, description, seller card, chat/save/report |
| `/store/[sellerSlug]` | Seller storefront |
| `/auth/login` | Email/password login |
| `/auth/register` | OTP registration flow |
| `/help` | FAQ help centre |
| `/about` | Platform overview |

## Layout

All public pages use `PublicLayout` (header + footer).

## Listings browse

- Desktop: inline `FilterBar`
- Mobile: bottom-sheet filters
- API-backed with mock fallback

## Listing detail

- Swipeable `Gallery` on touch devices
- `SimilarListings` by category
- `ChatButton` redirects unauthenticated users to login
