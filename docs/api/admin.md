# Admin & Super-Admin API

> Base paths: `/api/admin`, `/api/super-admin`  
> **Auth:** Bearer JWT · **Roles:** `ADMIN` or `SUPER_ADMIN` · **RBAC:** permission decorators on each route

Enterprise administration APIs for platform operations, moderation, payments, search, notifications, and RBAC.

---

## Overview

| Namespace | Role | Scope |
|-----------|------|-------|
| `/api/admin/*` | `ADMIN` | Permission-scoped operations |
| `/api/super-admin/*` | `SUPER_ADMIN` | Full platform control (bypasses permission checks) |

Responses: `{ "data": T }`. Errors: standard HTTP + `{ statusCode, message }`.

---

## Core admin (`/api/admin`)

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| `GET` | `/stats` | `view_platform_stats` | Dashboard statistics (Redis-cached 120s) |
| `GET` | `/me` | — | Current admin user + effective permissions |
| `GET` | `/users` | `view_users` | List users (filter, paginate) |
| `POST` | `/users/suspend` | `suspend_user` | Suspend / unsuspend user |
| `POST` | `/actions` | varies | Generic admin action log |
| `GET` | `/audit` | `view_audit_log` | Admin audit entries |

---

## Moderation (`/api/admin/moderation`)

| Method | Path | Permission |
|--------|------|------------|
| `GET` | `/reports` | `view_reports` |
| `GET` | `/reports/:id` | `view_reports` |
| `PATCH` | `/reports/:id/assign` | `manage_reports` |
| `PATCH` | `/reports/:id/notes` | `manage_reports` |
| `POST` | `/reports/:id/actions` | `take_moderation_action` |
| `PATCH` | `/reports/:id` | `manage_reports` |
| `GET` | `/actions` | `view_reports` |
| `GET` | `/bans` | `view_reports` |
| `GET` | `/bans/check/:userId` | `view_reports` |
| `GET` | `/appeals` | `view_reports` |
| `PATCH` | `/appeals/:id` | `manage_appeals` |
| `GET` | `/audit-logs` | `view_audit_log` |
| `GET` | `/analytics` | `view_reports` |

See [moderation.md](./moderation.md) for request/response schemas.

---

## Listings (`/api/admin/listings`)

| Method | Path | Permission |
|--------|------|------------|
| `GET` | `/` | `view_listings` |
| `GET` | `/:id` | `view_listings` |
| `PATCH` | `/:id` | `manage_listings` |
| `POST` | `/:id/ban` | `ban_listing` |
| `POST` | `/:id/unban` | `ban_listing` |
| `GET` | `/reports` | `view_reports` |
| `POST` | `/reports/:reportId/action` | `manage_listings` |

---

## Payments (`/api/admin/payments`)

| Method | Path | Permission |
|--------|------|------------|
| `GET` | `/` | `view_payments` |
| `GET` | `/:id` | `view_payments` |
| `GET` | `/ledger` | `view_payments` |
| `GET` | `/refunds/pending` | `approve_refunds` |
| `POST` | `/refunds/approve` | `approve_refunds` |
| `GET` | `/disputes` | `view_payments` |
| `POST` | `/disputes/evidence` | `manage_disputes` |
| `POST` | `/payouts/manual` | `manage_payouts` |
| `GET` | `/connect/:userId` | `view_payments` |

---

## Notifications (`/api/admin/notifications`)

| Method | Path | Permission |
|--------|------|------------|
| `POST` | `/send` | `manage_notifications` |
| `POST` | `/broadcast` | `manage_notifications` |
| `GET` | `/templates` | `manage_notifications` |
| `POST` | `/templates` | `manage_notifications` |
| `GET` | `/providers` | `manage_notifications` |
| `GET` | `/logs` | `view_audit_log` |

---

## Search (`/api/admin/search`)

| Method | Path | Permission |
|--------|------|------------|
| `GET` | `/indexes` | `manage_search_index` |
| `GET` | `/health` | `manage_search_index` |
| `POST` | `/reindex` | `manage_search_index` |
| `GET` | `/analytics` | `manage_search_index` |
| `POST` | `/synonyms` | `manage_search_index` |
| `POST` | `/stop-words` | `manage_search_index` |
| `PATCH` | `/relevance` | `manage_search_index` |

---

## RBAC (`/api/admin/rbac`)

| Method | Path | Permission |
|--------|------|------------|
| `GET` | `/roles` | `manage_roles` |
| `GET` | `/permissions` | `manage_roles` |
| `POST` | `/users/assign-role` | `manage_roles` |
| `PUT` | `/roles/:roleId/permissions` | `manage_roles` |
| `GET` | `/users/:userId/effective-permissions` | `manage_roles` |

`SUPER_ADMIN` mirrors most RBAC routes under `/api/super-admin/*`.

---

## Super-admin only

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/super-admin/settings` | Platform settings (Redis) |
| `PATCH` | `/super-admin/settings` | Update platform config |
| `GET` | `/super-admin/admins` | List admin users |
| `POST` | `/super-admin/admins` | Create admin |
| `GET` | `/super-admin/platform` | Platform metadata |

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
    "listings": { "total": 450, "active": 380, "banned": 5 },
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
| `422` | Validation error (Zod / class-validator) |
| `429` | Rate limited |

---

## Related

- [Admin operator guide](../admin/README.md)
- [RBAC feature spec](../features/rbac.md)
- [Security — RBAC](../security/rbac.md)
