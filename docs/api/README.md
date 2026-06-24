# API Documentation

REST and WebSocket reference for `apps/api`. All successful responses use `{ "data": ... }`.

## Modules

| Document | Base path |
|----------|-----------|
| [auth.md](./auth.md) | `/api/auth` |
| [users.md](./users.md) | `/api/users`, `/api/buyer/profile`, `/api/seller/profile`, `/api/admin/users` |
| [listings.md](./listings.md) | `/api/listings`, `/api/seller/listings`, `/api/admin/listings` |
| [chat.md](./chat.md) | `/api/chat`, WebSocket `/chat` |
| [payments.md](./payments.md) | `/api/payments`, `/api/buyer/payments`, `/api/seller/earnings` |
| [notifications.md](./notifications.md) | `/api/notifications` |
| [search.md](./search.md) | `/api/search` |
| [moderation.md](./moderation.md) | `/api/moderation` |
| [admin.md](./admin.md) | `/api/admin`, `/api/super-admin` |

## Cross-cutting

| Endpoint | Auth | Description |
|----------|------|-------------|
| `GET /api/health` | Public | Liveness |
| `GET /api/health/ready` | Public | DB + Redis + Meili readiness |
| `GET /api/health/queues` | Public | BullMQ queue depth |
| `GET /api/metrics` | Public | Prometheus metrics |

## Conventions

- **Auth header:** `Authorization: Bearer <accessToken>`
- **Validation:** `packages/validation` Zod schemas + NestJS `ValidationPipe`
- **RBAC:** `@RequirePermissions()` + `RolesPermissionsGuard`
- **Errors:** `{ statusCode, message, error? }`

## Related

- [Feature specifications](../features/README.md)
- [Security — API](../security/api-security.md)
- [Developer Quickstart](../onboarding/quickstart.md)
