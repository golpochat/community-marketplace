# Developer Security Checklist

Use before opening a PR that touches auth, payments, admin, or user data.

## Authentication & sessions

- [ ] No tokens or secrets logged
- [ ] New endpoints have correct `@Public()` or auth guard
- [ ] Refresh token handling unchanged or reviewed

## Authorization

- [ ] `@RequirePermissions()` on admin routes
- [ ] SUPER_ADMIN-only routes under `/super-admin`
- [ ] No permission bypass in services

## Input & output

- [ ] Request validated via Zod / DTO
- [ ] No raw SQL; Prisma only
- [ ] Error messages don't leak internal details

## Data

- [ ] PII access scoped to owner or admin with permission
- [ ] File upload keys verified before confirm
- [ ] Audit log for sensitive mutations

## Infrastructure

- [ ] No secrets committed (`.env` gitignored)
- [ ] New env vars in `.env.example` + `packages/config`
- [ ] CORS origins not widened to `*` in production

## Dependencies

- [ ] No unmaintained packages for crypto/auth
- [ ] `pnpm audit` reviewed for high/critical

## Related

- [CONTRIBUTING.md](../../CONTRIBUTING.md)
- [STANDARDS.md](../STANDARDS.md)
