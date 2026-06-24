# API Route Namespaces (RBAC)

Global prefix: `/api`

| Namespace | Role | Access model |
|-----------|------|----------------|
| `/super-admin/**` | `SUPER_ADMIN` | Class-level `@RequireRole` + per-endpoint `@RequirePermissions` |
| `/admin/**` | `ADMIN`, `SUPER_ADMIN` | Class-level `@RequireRole` + per-endpoint `@RequirePermissions` |
| `/seller/**` | `SELLER` | Class-level `@RequireRole` + per-endpoint `@RequirePermissions` |
| `/buyer/**` | `BUYER` | Class-level `@RequireRole` + per-endpoint `@RequirePermissions` |
| `/auth/**` | Public | Authentication |
| `/listings` (GET) | Public | Catalog browse |
| `/search` (GET) | Public | Search |
| `/chat/**` | Authenticated | Permission-gated (`SEND_MESSAGE`, `VIEW_CONVERSATIONS`) |
| `/notifications/**` | Authenticated | User inbox (admin send → `/admin/notifications`) |

## Examples

```
GET  /api/super-admin/platform
GET  /api/admin/stats
GET  /api/admin/moderation/reports
POST /api/seller/listings
GET  /api/seller/payments
POST /api/buyer/purchases
POST /api/buyer/reviews
```
