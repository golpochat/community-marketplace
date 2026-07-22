# RBAC Security Model

## Roles

| Code | Description |
|------|-------------|
| `SUPER_ADMIN` | Full platform access (bypass) |
| `ADMIN` | Scoped operator (+ personas e.g. `ACCOUNTS_ADMIN`) |
| `MEMBER` | Default marketplace account (unified `/account`) |
| `SELLER` | Listing seller capability |
| `BUYER` | Marketplace buyer capability |

`MEMBER` can satisfy `@RequireRole('BUYER'|'SELLER')` via capability mapping in the API.

## Permission enforcement

```mermaid
flowchart TD
  REQ[HTTP Request] --> AUTH[AuthGuard - JWT valid]
  AUTH --> ROLE[RolesPermissionsGuard]
  ROLE --> PERM{@RequirePermissions}
  PERM -->|pass| OK[Handler]
  PERM -->|fail| E403[403 Forbidden]
```

## Permission mapping

Permissions are stored in `permissions` table and linked via `role_permissions`. User overrides in `user_permission_overrides`.

Common permissions:

| Permission | Used by |
|------------|---------|
| `view_users` | User list |
| `suspend_user` | Suspend action |
| `view_reports` | Moderation queue |
| `take_moderation_action` | Warn/ban |
| `manage_roles` | RBAC UI (SUPER_ADMIN) |
| `manage_platform_permissions` | Settings |

Full matrix: seed data in `apps/api/scripts/seed-rbac.ts`.

## Related

- [features/rbac.md](../features/rbac.md)
- [api/admin.md](../api/admin.md)
