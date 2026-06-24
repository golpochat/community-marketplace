# RBAC Security Model

## Roles

| Code | Description |
|------|-------------|
| `BUYER` | Marketplace buyer |
| `SELLER` | Listing seller |
| `ADMIN` | Scoped operator |
| `SUPER_ADMIN` | Full platform access |

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
