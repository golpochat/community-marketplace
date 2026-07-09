# Traefik

Reverse proxy configuration for Community Marketplace.

| File | Purpose |
|------|---------|
| `traefik.yml` | Static config (entry points, providers, logging) |
| `dynamic/routes.yml` | Dynamic routing rules and middlewares |

## Routes

| Host | Service |
|------|---------|
| `localhost` / `community.market` | web (3000) — marketplace + all role dashboards |
| `api.localhost` / `api.community.market` | api (4000) |

Admin and Super Admin panels are path-based on the web app (`/admin/*`, `/super-admin/*`). There is no `admin.` subdomain in production.

## Dashboard

Traefik dashboard: `http://localhost:8080` (insecure in dev — secure in production)
