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

- `middleware.ts` protects dashboard prefixes: `/account/*`, `/admin/*`, `/super-admin/*`, `/buyer/*`, `/seller/*` (via `cm-role` cookie and `route-guards`).
- Super Admins hitting `/admin/*` are rewritten to `/super-admin/*`.
- Many legacy `/buyer/*` and `/seller/*` paths redirect to `/account/*`.
- Account shell + `WebRoleDashboardShell` bridge Zustand auth into `@community-marketplace/ui-dashboard`.
- Public routes live under the `(site)` route group with `PublicLayout`.
- Operator consoles: `/admin/*` and `/super-admin/*` (not a separate admin app).

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
