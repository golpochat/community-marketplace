# Component Library

Shared and domain components for `apps/web`.

## Layout

| Component | Path | Purpose |
|-----------|------|---------|
| `PublicLayout` | `components/layout/public-layout.tsx` | Header + main + footer for public pages |
| `DashboardLayout` | `components/layout/dashboard-layout.tsx` | Re-export of ui-dashboard shell |
| `ChatLayout` | `components/layout/chat-layout.tsx` | Inbox + chat window grid |
| `Header` / `Footer` | `components/layout/` | Public site chrome |

## Shared (`components/shared/`)

| Component | Purpose |
|-----------|---------|
| `Avatar` | Initials or image avatar |
| `Tabs` | Horizontal tab navigation |
| `Skeleton` / `ListingCardSkeleton` | Loading placeholders |
| `Modal` | Re-export of `Dialog` from ui package |
| `EmptyState` | Empty list placeholder |
| `Pagination` | Page navigation |
| `NotificationBell` | Unread badge link |

## Public marketplace (`components/public/`)

`HeroSection`, `CategoryShortcuts`, `FeaturedListings`, `HowItWorks`, `TrustSection`

## Listings (`components/listings/`)

`ListingCard`, `FilterBar`, `Gallery`, `SellerCard`, `ChatButton`, `SaveButton`, `ReportButton`, `DescriptionSection`, `SimilarListings`, `ListingsBrowseClient`, `ListingDetailClient`

## Buyer (`components/buyer/`)

`BuyerSidebar`, `BuyerDashboardCards`, `BuyerChatLayout`, `BuyerNotificationList`

## Seller (`components/seller/`)

`SellerSidebar`, `SellerDashboardCards`, `SellerCharts`, `ListingForm`, `SellerChatLayout`

## Storefront (`components/storefront/`)

`StoreHeader`, `StoreBanner`, `StoreLogo`, `StoreDescription`, `StoreSectionTabs`, `StoreListingGrid`, `StoreReviewList`, `StorePolicySection`, `StorefrontPageClient`

## Chat (`components/chat/`)

`ConversationList`, `ChatWindow`, `MessageBubble`, `TypingIndicator`, `ReadReceipts`, `ListingPreviewInChat`, `ChatPageClient`

## Notifications (`components/notifications/`)

`NotificationList`, `NotificationItem`, `NotificationIconByType`

## UI package primitives

Import from `@community-marketplace/ui`: `Button`, `Input`, `Card`, `Badge`, `Dialog`, `Select`, `Table`, `BarChart`, `Toast`.
