# System Settings (Super Admin)

> **Screen:** `/super-admin/settings` · **Role:** `SUPER_ADMIN` only

## Platform configuration

Stored in PostgreSQL `platform_settings` (via `PlatformSettingsService`). Monetization publish toggles (`displayAdsEnabled`, `boostsEnabled`, `featuredEnabled`, `aiMarketingEnabled`, etc.) are edited under **Monetization** in admin.

- Platform fee percentage
- Feature flags
- Maintenance mode (when enabled)
- Email sender defaults

## RBAC & admins

| Screen | Path | Description |
|--------|------|-------------|
| RBAC | `/super-admin/rbac` | Role-permission matrix |
| Admins | `/super-admin/admins` | Create/manage admin users |

## API

`GET/PATCH /api/super-admin/settings`  
`GET/POST /api/super-admin/admins`

## Screenshot placeholder

`docs/admin/assets/settings-platform.png`
