# Frontend Architecture

The **web app** (`apps/web`) is the public marketplace PWA built with **Next.js 15 App Router**, **React 19**, and **Tailwind CSS**. It consumes shared workspace packages for types, UI primitives, validation, and dashboard shells.

## Layering

```
src/
├── app/              # Routes (App Router)
├── components/       # UI by domain (public, listings, buyer, seller, storefront, chat, notifications, shared)
├── hooks/            # Client hooks (auth, chat socket, profile)
├── lib/              # API client, routes, mock data, session
├── services/         # Thin API wrappers
└── store/            # Zustand auth store
```

## Data flow

1. **Server components** fetch catalog data where possible (`listingsService`, `storefrontService`).
2. **Client components** handle interactivity (filters, chat, forms, notifications).
3. **API client** (`lib/api-client.ts`) attaches auth tokens, refreshes on 401, and falls back to mock data when the API is unavailable.

## Auth & RBAC

- `middleware.ts` protects `/buyer/*` and `/seller/*` via the `cm-role` cookie.
- `WebRoleDashboardShell` bridges Zustand auth state into `@community-marketplace/ui-dashboard`.
- Public routes live under the `(site)` route group with `PublicLayout`.

## Realtime

- Chat uses **Socket.IO** (`use-chat-socket`) plus REST (`chat.service.ts`).
- Notifications are polled via REST; `NotificationBell` shows unread counts in the header.

## Styling

- Tailwind with CSS variables from `@community-marketplace/ui` and `@community-marketplace/ui-dashboard`.
- Mobile-first responsive layouts; bottom-sheet filters and swipeable gallery on small screens.

## Related docs

- [Component library](./component-library.md)
- [Routing map](./routing-map.md)
- [Storefront system](./storefront.md)
