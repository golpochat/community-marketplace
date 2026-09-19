# API Security

## Controls

| Control | Implementation |
|---------|----------------|
| **CORS** | `CORS_ORIGIN` env; credentials enabled for cookie auth |
| **Rate limiting** | Traefik middleware + Nest `ThrottlerGuard` (100/min) + Redis (OTP, notifications) |
| **IP blocking** | Traefik `ipAllowList` for admin/search internal routes and `/api/metrics` |
| **HTTP headers** | Helmet on the API + Traefik `secure-headers` |
| **Metrics** | `GET /api/metrics` requires `METRICS_SCRAPE_TOKEN`; public hostname is internal-only |
| **Input validation** | Zod schemas in `packages/validation` (`schema.parse` + `GlobalExceptionFilter`) |
| **SQL injection** | Prisma parameterized queries only |
| **XSS** | CSP headers (Traefik) + React escaping |
| **CSRF** | Double-submit cookie `cm_csrf` + `x-csrf-token` header (`GET /api/auth/csrf`). Stripe webhooks skip CSRF. |
| **Auth** | Global `AuthGuard` + `@Public()` opt-out |
| **RBAC** | `RolesPermissionsGuard` + `@RequirePermissions()` |

## Security headers (Traefik)

Configured in `infra/traefik/dynamic/middlewares.yml`:

- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Strict-Transport-Security`
- Content-Security-Policy

## Audit logs

| Module | Service |
|--------|---------|
| Auth | `AuthAuditService` |
| Moderation | `ModerationAuditService` |
| Payments | `PaymentsAuditService` |
| Users | `UserAuditService` |
| Admin | `GET /admin/audit` |

## Data protection

- PII minimized in logs (Pino structured, no passwords)
- Verification docs in private R2 prefix with presigned access
- GDPR: user deletion request flow in users settings

## Related

- [checklist.md](./checklist.md)
- [Infrastructure](../infrastructure/README.md)
