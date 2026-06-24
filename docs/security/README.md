# Security Documentation

Platform security model for Community Marketplace.

| Document | Description |
|----------|-------------|
| [RBAC Model](./rbac.md) | Roles, permissions, overrides |
| [Authentication](./authentication.md) | OTP, JWT, sessions |
| [API Security](./api-security.md) | CORS, rate limits, validation |
| [Developer Checklist](./checklist.md) | Pre-merge security review |

## Principles

1. **Least privilege** — default deny; grant explicit permissions
2. **Defense in depth** — Traefik + API guards + validation + Prisma
3. **Auditability** — sensitive actions logged
4. **No secrets in docs or code** — env vars + secret managers only

## Related

- [Features — RBAC](../features/rbac.md)
- [Infrastructure security](../infrastructure/README.md)
