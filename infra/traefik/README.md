# Traefik

Reverse proxy configuration for Community Marketplace.

| File | Purpose |
|------|---------|
| `traefik.yml` | Static config (entry points, providers, logging) |
| `dynamic/routes.yml` | Dynamic routing rules and middlewares |

## Routes

| Host | Service |
|------|---------|
| `localhost` / `community.market` | web (3000) |
| `admin.localhost` / `admin.community.market` | admin (3001) |
| `api.localhost` / `api.community.market` | api (4000) |

## Dashboard

Traefik dashboard: `http://localhost:8080` (insecure in dev — secure in production)
