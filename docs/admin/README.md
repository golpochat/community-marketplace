# Admin Panel — Operator Guide

> **App:** `apps/web` (port **3000**) · routes `/admin/*` and `/super-admin/*`  
> **API:** [admin.md](../api/admin.md) · **Feature spec:** [admin-panel.md](../features/admin-panel.md)  
> **Note:** `apps/admin` is **deprecated** — see `apps/admin/DEPRECATED.md`. Do not run `pnpm dev:admin`.

Enterprise admin console for **ADMIN**, admin personas, and **SUPER_ADMIN** with granular RBAC. Super Admins are redirected from `/admin/*` to `/super-admin/*`.

## Architecture

```
apps/web/
├── src/app/admin/**              # ADMIN operator URLs
├── src/app/super-admin/**        # SUPER_ADMIN URLs
├── src/components/admin/**       # Feature panels
└── src/middleware.ts             # Role cookie + dashboard guards
packages/ui-dashboard/
└── src/sidebar/sidebar-config.ts # Nav definitions
```

## Getting started

```bash
pnpm dev    # http://localhost:3000/admin/dashboard
```

Credentials: [dev-credentials.md](../dev-credentials.md)

## Screen index

| Screen | Path | Guide |
|--------|------|-------|
| Dashboard | `/admin/dashboard` · `/super-admin/dashboard` | — |
| Users | `/admin/users` · `/super-admin/users` | [user-management](./user-management.md) |
| Seller verification | `/admin/seller-verification/*` | [seller-verification](./seller-verification.md) |
| Listings & moderation | `/admin/listings`, `/admin/listing-moderation`, `/admin/moderation` | [listings-moderation](./listings-moderation.md) |
| Payments / finance | `/admin/payments`, `/admin/finance` | [payments](./payments.md) |
| Monetization / ads / AI | `/admin/monetization` | Product: [display ads](../product/display-ads-admin-campaigns.md), [AI hub](../product/ai-marketing-hub.md) |
| Fraud | `/admin/fraud` | — |
| Disputes | `/admin/disputes` | — |
| Search | `/admin/search` | [search](./search.md) |
| Notifications | `/admin/notifications` | [notifications](./notifications.md) |
| System settings / RBAC | `/super-admin/settings`, `/super-admin/rbac`, `/super-admin/admins` | [settings](./settings.md) |

## Feature flags (ops)

| Flag | Where | Purpose |
|------|-------|---------|
| `ADS_SYSTEM_ENABLED` / `NEXT_PUBLIC_ADS_SYSTEM_ENABLED` | API + web | Master kill switch for ads modules |
| `ADS_PREVIEW_MODE` / `NEXT_PUBLIC_ADS_PREVIEW_MODE` | API + web | Empty placement shells only |
| `displayAdsEnabled` / `boostsEnabled` / `featuredEnabled` | `platform_settings` | Per-module publish toggles (admin Monetization) |
| `AI_MARKETING_ENABLED` | API | AI Marketing Hub master switch |
| `aiMarketingEnabled` | `platform_settings` | Hub publish toggle |

## RBAC layers

| Layer | Mechanism |
|-------|-----------|
| Middleware | Role cookie enforcement |
| Server pages | Permission gates |
| Client UI | `<PermissionGate>` / sidebar filter |

`SUPER_ADMIN` bypasses all permission checks.

## Related

- [Dev credentials](../dev-credentials.md)
- [Security RBAC](../security/rbac.md)
- [API admin reference](../api/admin.md)
