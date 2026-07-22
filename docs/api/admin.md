# Admin & Super-Admin API

> Base paths: `/api/admin`, `/api/super-admin`  
> **Auth:** Bearer JWT · **Roles:** `ADMIN`, admin personas, or `SUPER_ADMIN` · **RBAC:** permission decorators on each route  
> **UI:** `apps/web` at `/admin/*` and `/super-admin/*` (`apps/admin` is deprecated)  
> **Last synced:** 2026-07-22

Enterprise administration APIs for platform operations, moderation, payments, search, notifications, monetization, fraud, disputes, seller verification, finance, email, and RBAC.

Permission codes must match `packages/types` `PERMISSIONS`. Global prefix: `/api`.

| Namespace | Role | Scope |
|-----------|------|-------|
| `/api/admin/*` | `ADMIN` (+ personas) | Permission-scoped |
| `/api/super-admin/*` | `SUPER_ADMIN` | Full platform (permission checks still declared; bypass in practice) |

Responses: `{ "data": T }`.

**Invite accept (public):** `POST /api/auth/admin-invite/preview`, `POST /api/auth/admin-invite/accept` — see [auth.md](./auth.md).

---

## Core (`/api/admin`)

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| `GET` | `/stats` | `view_platform_stats` | Dashboard statistics |
| `GET` | `/me` | role only | Current admin + effective permissions |
| `GET` | `/users` | `view_users` | List users (legacy core) |
| `POST` | `/users/suspend` | `suspend_user` | Suspend user |
| `POST` | `/actions` | `execute_admin_action` | Execute admin action |
| `GET` | `/audit` | `view_audit_log` | Audit entries |

Prefer **`/api/admin/users/*`** for full user management (below).

---

## Users (`/api/admin/users`)

| Method | Path | Permission |
|--------|------|------------|
| `GET` | `/` | `view_users` |
| `GET` | `/search` | `view_users` |
| `GET` | `/audit-logs` | `view_users` |
| `GET` | `/:id` | `view_users` |
| `POST` | `/suspend` | `suspend_user` |
| `POST` | `/:id/unsuspend` | `suspend_user` |
| `PATCH` | `/:id/status` | `suspend_user` |
| `POST` | `/ban` | `ban_user` |
| `POST` | `/:userId/bans/:banId/unban` | `ban_user` |

---

## Listings (`/api/admin/listings`)

Permission column uses live decorators (`manage_listings`, `approve_listing`, `ban_listing`, `manage_reports`).

| Method | Path | Permission |
|--------|------|------------|
| `GET` | `/` | `manage_listings` |
| `GET` | `/pending` · `/flagged` · `/rejected` · `/removed` | `manage_listings` |
| `POST` | `/approve` · `/reject` · `/investigate` | `approve_listing` |
| `POST` | `/remove` | `ban_listing` |
| `GET` | `/reports` | `manage_listings` |
| `POST` | `/reports/:reportId/action` | `manage_reports` |
| `GET` | `/:id` · `/:id/review` · `/:id/status-history` | `manage_listings` |
| `POST` | `/:id/review/messages` | `manage_listings` |
| `PATCH` | `/:id` | `manage_listings` |
| `POST` | `/:id/approve` · `/:id/reject` · `/:id/request-changes` | `approve_listing` |
| `POST` | `/:id/remove` · `/:id/restore` · `/:id/ban` · `/:id/unban` | `ban_listing` |

---

## Moderation (`/api/admin/moderation`)

| Method | Path | Permission |
|--------|------|------------|
| `GET` | `/reports` · `/reports/:id` | `view_reports` |
| `PATCH` | `/reports/:id/assign` · `/reports/:id/notes` | `manage_reports` |
| `POST` | `/reports/:id/actions` | `resolve_report` |
| `PATCH` | `/reports/:id` | `resolve_report` |
| `GET` | `/actions` · `/bans` · `/bans/check/:userId` | `view_reports` |
| `GET` | `/appeals` · `/appeals/:id` | `view_reports` |
| `PATCH` | `/appeals/:id` | `resolve_report` |
| `GET` | `/audit-logs` | `view_audit_log` |
| `GET` | `/analytics` | `view_platform_stats` |

See [moderation.md](./moderation.md) for schemas. Marketplace disputes ≠ Stripe disputes — use `/api/admin/disputes`.

---

## Payments (`/api/admin/payments`)

| Method | Path | Permission |
|--------|------|------------|
| `GET` | `/` · `/:id` · `/ledger` | `manage_payments` |
| `GET` | `/refunds/pending` | `manage_payments` |
| `POST` | `/refunds/approve` | `refund_payment` |
| `GET` | `/disputes` · `/disputes/:id` | `manage_payments` |
| `POST` | `/disputes/evidence` | `manage_payments` |
| `POST` | `/payouts/manual` | `manage_payments` |
| `GET` | `/connect/:userId` | `manage_payments` |

---

## Marketplace disputes (`/api/admin/disputes`)

| Method | Path | Permission |
|--------|------|------------|
| `GET` | `/` · `/:id` | `view_disputes` |
| `POST` | `/:id/request-evidence` · `/:id/under-review` · `/:id/resolve` | `resolve_disputes` |

---

## Fraud (`/api/admin/fraud`)

| Method | Path | Permission |
|--------|------|------------|
| `GET` | `/high-risk-users` · `/high-risk-listings` · `/signals` | `view_fraud` |
| `GET` | `/users/:userId/breakdown` | `view_fraud` |
| `POST` | `/mark-safe` · `/escalate` | `manage_fraud` |

---

## Finance reports (`/api/admin/finance`)

| Method | Path | Permission |
|--------|------|------------|
| `GET` | `/report/summary` · `/report/pdf` · `/report/csv` · `/report/xlsx` | `manage_payments` |

---

## Monetization (`/api/admin/monetization`)

All routes require `manage_payments` (unless noted). Covers pricing settings, ads system status, AI Marketing publish gate, products, overrides, display campaigns, platform purchases, cashback/wallet lists.

| Method | Path | Description |
|--------|------|-------------|
| `GET` · `PATCH` | `/settings` | Platform monetization settings |
| `GET` | `/ads-system` · `/ai-marketing-access` | Module effective status |
| `GET` · `POST` · `PATCH` | `/products` · `/products/:id` | SKU catalog |
| `GET` · `POST` | `/display-campaigns` (+ `/upload-url`, `/:id`, `/:id/status`) | Admin display ads |
| `GET` | `/marketing-hub-analytics` | AI hub → boost attribution |
| `GET` | `/platform-purchases` · `/cashback-grants` · `/wallet-transactions` | Ops lists |
| `GET` · `POST` | seller/buyer fee & AI free-units overrides · search | Per-user overrides |

Product detail: [display-ads-admin-campaigns.md](../product/display-ads-admin-campaigns.md), [ai-marketing-hub.md](../product/ai-marketing-hub.md), [monetization.md](../product/monetization.md).

---

## Seller verification (`/api/admin/seller-verification` · `/api/admin/seller`)

| Method | Path | Permission |
|--------|------|------------|
| `GET` | `/seller-verification/requests` · `/pending` · `/requests/:id` · `/:id` | `review_seller_verification` / `view_seller_documents` |
| `GET` | `/seller-verification/sellers/:userId` | `view_seller_documents` |
| `POST` | `/seller-verification/approve` · `/reject` | `review_seller_verification` |
| `POST` | `/seller/suspend` | `suspend_seller` |
| `POST` | `/seller/limit` | `manage_seller_limits` |
| `POST` | `/seller/reactivate` | `reactivate_seller` |
| `POST` | `/seller/force-reverify` · `/reverify` | `force_reverify_seller` |
| `GET` | `/seller/status-history/:userId` | `review_seller_verification` |

---

## Notifications (`/api/admin/notifications`)

| Method | Path | Permission |
|--------|------|------------|
| `GET` · `PATCH` · `DELETE` | `/inbox*` | role only (operator inbox) |
| `POST` | `/send` | `send_notification` |
| `POST` | `/broadcast` | `manage_notifications` |
| `GET` · `POST` | `/templates` · `/templates/preview` | `manage_notifications` |
| `GET` · `POST` · `PATCH` | `/providers` · `/providers/:id` · `/providers/:id/health` | `manage_notifications` |
| `GET` | `/logs` | `manage_notifications` |

---

## Search (`/api/admin/search`)

| Method | Path | Permission |
|--------|------|------------|
| `GET` | `/indexes` · `/health` · `/analytics` | `manage_search_index` |
| `POST` | `/reindex` | `reindex_search` |
| `GET` | `/reindex/:type/status` | `reindex_search` |
| `POST` | `/synonyms` · `/stop-words` | `manage_search_index` |
| `PATCH` | `/relevance` | `manage_search_index` |

---

## Chat moderation (`/api/admin/chat`)

| Method | Path | Permission |
|--------|------|------------|
| `GET` | `/threads/:threadId` · `/flags` · `/messages/search` | `moderate_chat` \| `moderate_messages` |
| `POST` | `/flags/:flagId/resolve` | `moderate_chat` \| `moderate_messages` |
| `POST` | `/messages/:messageId/flag` | `flag_message` |
| `POST` | `/ban` | `ban_from_chat` |

---

## RBAC (`/api/admin/rbac`)

Uses `@RequireAnyPermission` for catalog vs mutation scopes. Key routes:

| Method | Path | Notes |
|--------|------|-------|
| `GET` | `/scopes` · `/roles` · `/permissions` · `/roles/:roleId/permissions` | Catalog (any of manage_*_permissions / manage_roles) |
| `POST` · `PUT` · `DELETE` | `/roles` · `/roles/:roleId` · permissions sync | `manage_roles` (scoped) |
| `POST` · `DELETE` | `/users/assign-role` · `/users/:userId/role` | `assign_role` \| `manage_admins` |
| `POST` · `DELETE` · `GET` | permission-overrides · effective-permissions | `assign_permission_override` / `view_users` |

---

## Email (`/api/admin/email`)

| Method | Path | Permission |
|--------|------|------------|
| `GET` | `/status` | `manage_platform_permissions` |
| `PATCH` | `/settings` | `manage_platform_permissions` |
| `POST` | `/test` | `manage_platform_permissions` |

---

## Super-admin (`/api/super-admin`)

`SUPER_ADMIN` only. Highlights:

| Area | Paths |
|------|-------|
| Platform / settings | `GET /platform`, `GET|PATCH /settings`, `GET /stats`, `GET /me` |
| Admins | `GET|POST /admins`, `GET|PATCH /admins/:userId/*`, send password reset |
| Invitations | `/invitations` (+ inviteable-roles, resend, revoke) — preferred provisioning |
| RBAC mirrors | `/roles`, `/permissions`, matrix, assign-role, overrides |
| Ops mirrors | `/users`, `/listings/*`, `/moderation/*`, `/notifications/*`, `/search/*` |
| Review queues | `/title-reviews`, `/price-reviews`, `/delivery-reviews` (`manage_listings`) |
| Audit / actions | `GET /audit`, `POST /actions` |

Settings persistence: Prisma `platform_settings` (not Redis-primary).

---

## Example: dashboard stats

```http
GET /api/admin/stats
Authorization: Bearer <access_token>
```

```json
{
  "data": {
    "users": { "total": 1200, "active": 1100, "suspended": 12 },
    "listings": { "total": 450, "active": 380 },
    "payments": { "volumeCents": 1250000, "count": 340 },
    "moderation": { "openReports": 8, "pendingAppeals": 2 },
    "verifications": { "pending": 15 }
  }
}
```

---

## Error codes

| Code | Meaning |
|------|---------|
| `401` | Missing or invalid token |
| `403` | Insufficient role or permission |
| `404` | Resource not found |
| `422` | Validation error |
| `429` | Rate limited |

---

## Related

- [Admin operator guide](../admin/README.md)
- [RBAC feature spec](../features/rbac.md)
- [Security — RBAC](../security/rbac.md)
- [Auth API](./auth.md) (admin-invite)
