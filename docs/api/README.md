# API Documentation

REST and WebSocket reference for `apps/api`. All successful responses use `{ "data": ... }`. Global prefix: **`/api`**.

## Modules

| Document | Base path |
|----------|-----------|
| [auth.md](./auth.md) | `/api/auth` (+ `/api/auth/admin-invite`) |
| [users.md](./users.md) | `/api/users`, `/api/buyer/profile`, `/api/seller/profile`, `/api/admin/users` |
| [listings.md](./listings.md) | `/api/listings`, `/api/seller/listings`, `/api/stores`, `/api/admin/listings` |
| [chat.md](./chat.md) | `/api/chat`, `/api/messages`, WebSocket `/chat` |
| [payments.md](./payments.md) | `/api/buyer/payments`, `/api/seller/earnings`, `/api/checkout`, `/api/order`, `/api/payments/webhooks` |
| [notifications.md](./notifications.md) | `/api/notifications`, role mirrors, `/api/admin/notifications` |
| [search.md](./search.md) | `/api/search` (+ buyer/seller mirrors) |
| [moderation.md](./moderation.md) | `/api/moderation`, `/api/admin/*` moderation |
| [admin.md](./admin.md) | `/api/admin`, `/api/super-admin` |

### Additional live modules (product docs / expand here)

| Area | Representative prefixes | Product / notes |
|------|-------------------------|-----------------|
| Monetization | `/api/seller/monetization/*`, `/api/buyer/wallet`, `/api/ads`, `/api/admin/monetization` | [monetization.md](../product/monetization.md), [display-ads](../product/display-ads-admin-campaigns.md) |
| AI Marketing | `/api/seller/marketing-hub` | [ai-marketing-hub.md](../product/ai-marketing-hub.md) |
| Verification | `/api/seller/verification`, `/api/admin/seller-verification` | [seller-verification](../admin/seller-verification.md) |
| Disputes | `/api/disputes`, `/api/admin/disputes` | Marketplace disputes (≠ Stripe chargebacks) |
| Fraud | `/api/admin/fraud` | Admin fraud queue |
| Share | `/api/share` | Short links / share attribution |
| Statements / finance | `/api/buyer/statements`, `/api/admin/finance` | |
| Platform | `/api/platform` | Public platform meta / settings surfaces |

## Cross-cutting

| Endpoint | Auth | Description |
|----------|------|-------------|
| `GET /api/health` | Public | Aggregate health |
| `GET /api/health/live` | Public | Liveness probe |
| `GET /api/health/ready` | Public | DB + Redis + Meili readiness |
| `GET /api/health/queues` | Public | BullMQ queue depth |
| `GET /api/metrics` | Public | Prometheus metrics |

## Conventions

- **Auth header:** `Authorization: Bearer <accessToken>`
- **Validation:** `packages/validation` Zod schemas + NestJS `ValidationPipe`
- **RBAC:** `@RequirePermissions()` + `RolesPermissionsGuard`
- **Errors:** `{ statusCode, message, error? }`
- **Frontend:** unified `apps/web` — marketplace `/account`, operators `/admin` · `/super-admin`

## Related

- [Feature specifications](../features/README.md)
- [Security — API](../security/api-security.md)
- [Developer Quickstart](../onboarding/quickstart.md)
