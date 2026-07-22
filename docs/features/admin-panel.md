# Admin Panel

> **Feature:** Enterprise admin console · **App:** `apps/web` (`/admin/*`, `/super-admin/*`)  
> **Note:** `apps/admin` is retired; do not run or document it as a live app.

## Functional requirements

- Dual namespaces: `/admin/*` (operators) and `/super-admin/*` (governance)
- Permission-aware navigation and UI gates
- Dashboard with platform stats and charts
- Management screens: users, seller verification, listings, moderation queues (title/price/delivery/message), payments, finance, monetization (boosts/featured/display ads/AI hub), fraud, disputes, notifications, search, audit, analytics, RBAC, admins, invitations, settings
- Dark mode, toast feedback, data tables

## Non-functional requirements

- Server-side RBAC on every protected page
- Stats cached (Redis where applicable)
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
| SUPER_ADMIN | Full access; `/admin` → `/super-admin` rewrite |
| Session expired | Redirect to login |

## Acceptance criteria

- [ ] ADMIN sees only permitted nav items
- [ ] SUPER_ADMIN accesses settings and RBAC
- [ ] Dashboard loads stats within 3s

## Related

- [Admin operator guide](../admin/README.md)
- [Admin API](../api/admin.md)
- [RBAC](./rbac.md)
