# Buyer Flow

## Routes

| Route | Page |
|-------|------|
| `/buyer/dashboard` | Overview cards + profile summary |
| `/buyer/listings` | Browse catalog |
| `/buyer/favorites` | Saved listings |
| `/buyer/purchases` | Payment history (re-exports payments page) |
| `/buyer/chat` | Messaging with sellers |
| `/buyer/notifications` | In-app notifications |
| `/buyer/settings` | Profile & preferences |

## Navigation

Sidebar items are defined in `@community-marketplace/ui-dashboard` (`BUYER_SIDEBAR`). Mobile users get a collapsible drawer via `BuyerSidebar`.

## Key interactions

1. **Browse** — `/buyer/listings` or public `/listings`
2. **Save** — `SaveButton` on listing detail (local state; API wiring pending)
3. **Chat** — `BuyerChatLayout` with authenticated socket token
4. **Pay** — `/buyer/purchases` → payments service
5. **Notify** — `BuyerNotificationList` + header `NotificationBell`

## Auth

Requires `BUYER` role cookie set at login. Middleware redirects unauthorized users to `/unauthorized`.
