# Admin Panel

> **Feature:** Enterprise admin console · **Apps:** `apps/admin`

## Functional requirements

- Dual namespaces: `/admin/dashboard/*`, `/super-admin/dashboard/*`
- Permission-aware navigation and UI gates
- Dashboard with platform stats and charts
- Management screens: users, verifications, listings, moderation, payments, notifications, search, audit, analytics, RBAC, admins, settings
- Dark mode, toast feedback, data tables

## Non-functional requirements

- Server-side RBAC on every protected page
- Stats cached 120s (Redis)
- Responsive layout for desktop operators

## User flows

```mermaid
flowchart TD
  LOGIN[Admin login] --> ME[/admin/me permissions]
  ME --> NAV[Filtered sidebar]
  NAV --> SCREEN[Permission-gated screen]
```

## Edge cases

| Case | Behavior |
|------|----------|
| Missing permission | 403 page / hidden nav item |
| SUPER_ADMIN | Full access |
| Session expired | Redirect to login |

## Acceptance criteria

- [ ] ADMIN sees only permitted nav items
- [ ] SUPER_ADMIN accesses settings and RBAC
- [ ] Dashboard loads stats within 3s

## Related

- [Admin operator guide](../admin/README.md)
- [Admin API](../api/admin.md)
- [RBAC](./rbac.md)
