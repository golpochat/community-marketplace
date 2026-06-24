# System Settings (Super Admin)

> **Screen:** `/dashboard/settings` · **Role:** `SUPER_ADMIN` only

## Platform configuration

Stored in Redis (`platform:settings`):

- Platform fee percentage
- Feature flags
- Maintenance mode (when enabled)
- Email sender defaults

## RBAC & admins

| Screen | Path | Description |
|--------|------|-------------|
| RBAC | `/dashboard/rbac` | Role-permission matrix |
| Admins | `/dashboard/admins` | Create/manage admin users |

## API

`GET/PATCH /api/super-admin/settings`  
`GET/POST /api/super-admin/admins`

## Screenshot placeholder

`docs/admin/assets/settings-platform.png`
