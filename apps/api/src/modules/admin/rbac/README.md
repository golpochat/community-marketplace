# Admin RBAC Management API

Base URL: `/api/admin/rbac`

All endpoints require `Authorization: Bearer <token>` and role `ADMIN` or `SUPER_ADMIN`.

## Authorization model

| Actor | Capabilities |
|-------|----------------|
| **SUPER_ADMIN** | Full RBAC: manage admins, privileged roles (`ADMIN`, `SUPER_ADMIN`), privileged permissions, all scopes |
| **Scoped ADMIN** | Manage permissions within assigned scopes on non-privileged roles (`SELLER`, `BUYER`) |
| **accounts-admin** | `MANAGE_ACCOUNTS_PERMISSIONS` — users, verification, role assignment |
| **financial-admin** | `MANAGE_FINANCIAL_PERMISSIONS` — payment-related permissions |
| **moderation-admin** | `MANAGE_MODERATION_PERMISSIONS` — reports, bans, reviews |

Scoped admin personas are `ADMIN` users with `user_permissions` GRANT overrides for the relevant `manage_*_permissions` code.

## Scopes

| Scope ID | Management permission | Domain |
|----------|----------------------|--------|
| `accounts` | `manage_accounts_permissions` | Users, roles, verification |
| `financial` | `manage_financial_permissions` | Payments, purchases |
| `moderation` | `manage_moderation_permissions` | Reports, bans, reviews |
| `listings` | `manage_listing_permissions` | Listing lifecycle |
| `platform` | `manage_platform_permissions` | Search, notifications, audit |

## Endpoints

### Catalog

| Method | Path | Guard (any of) | Description |
|--------|------|----------------|-------------|
| `GET` | `/scopes` | scope management perms | Scopes the caller can administer |
| `GET` | `/roles` | catalog perms | List all roles |
| `GET` | `/permissions?scope=` | catalog perms | List permissions (optionally filtered by scope) |
| `GET` | `/roles/:roleId/permissions` | catalog perms | Permissions assigned to a role |

### User roles

| Method | Path | Guard | Policy |
|--------|------|-------|--------|
| `POST` | `/users/assign-role` | `assign_role` \| `manage_admins` | `ADMIN`/`SUPER_ADMIN` targets → SUPER_ADMIN + `manage_admins` only |
| `DELETE` | `/users/:userId/role` | `assign_role` \| `manage_admins` | Resets user to fallback role (default: `BUYER`) |

**Assign role body:**
```json
{
  "userId": "uuid",
  "roleId": "uuid",
  "reason": "optional"
}
```

### Role permissions

| Method | Path | Guard | Policy |
|--------|------|-------|--------|
| `POST` | `/roles/:roleId/permissions` | scoped management perms | Add one permission to role |
| `DELETE` | `/roles/:roleId/permissions/:permissionId` | scoped management perms | Remove permission from role |
| `PUT` | `/roles/:roleId/permissions` | scoped management perms | Replace all role permissions |

**Sync body:**
```json
{ "permissionIds": ["uuid", "uuid"] }
```

Privileged roles (`ADMIN`, `SUPER_ADMIN`) and privileged permissions require **SUPER_ADMIN** with `manage_roles` / `manage_permissions`.

### User permission overrides

| Method | Path | Guard | Description |
|--------|------|-------|-------------|
| `POST` | `/users/permission-overrides` | `assign_permission_override` | GRANT or DENY override for a user |
| `GET` | `/users/:userId/permission-overrides` | `assign_permission_override` \| `manage_users` \| `view_users` | List active overrides for a user |
| `DELETE` | `/users/:userId/permission-overrides/:permissionId` | `assign_permission_override` | Revoke override |

**Override body:**
```json
{
  "userId": "uuid",
  "permissionId": "uuid",
  "effect": "GRANT",
  "reason": "financial-admin persona",
  "expiresAt": "2026-12-31T00:00:00.000Z"
}
```

### Inspection

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/users/:userId/effective-permissions` | Resolved effective permission set |

## Response envelope

All responses use the global API wrapper:

```json
{
  "data": { ... },
  "meta": { "timestamp": "..." }
}
```

## Frontend integration

Update `apps/admin/src/lib/api-routes.ts`:

```typescript
admin: {
  rbac: {
    scopes: '/admin/rbac/scopes',
    roles: '/admin/rbac/roles',
    permissions: '/admin/rbac/permissions',
    assignRole: '/admin/rbac/users/assign-role',
    // ...
  },
}
```

Types and Zod schemas: `@community-marketplace/types`, `@community-marketplace/validation`.

Scope definitions: `RBAC_PERMISSION_SCOPES` in `packages/types/src/rbac-scopes.ts`.
