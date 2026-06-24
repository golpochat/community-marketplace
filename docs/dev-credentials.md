# Development Credentials

> **Local development only.** Change all passwords and secrets before staging or production.  
> Values below match `apps/api/.env.example` and Docker defaults unless you have overridden them in `.env`.

---

## Platform locale (Ireland)

| Setting | Value |
|---------|-------|
| Language | English (`en`) |
| Locale | `en-IE` |
| Currency | EUR (€) |
| Country | Ireland (`IE`) |
| Timezone | `Europe/Dublin` |

Configured in `packages/config/src/platform.ts` and used by formatting utilities, validation defaults, and payment onboarding.

---

## Application URLs

| App | URL |
|-----|-----|
| Web (buyer / seller) | http://localhost:3000 |
| Admin | http://localhost:3001 |
| API | http://localhost:4000/api |
| API health | http://localhost:4000/api/health |

---

## Seeded application users

Only one user account is created automatically by `pnpm seed:rbac` (or `prisma db seed`).

| Role | Email | Password | Display name | Login app | Notes |
|------|-------|----------|--------------|-----------|-------|
| `SUPER_ADMIN` | `superadmin@community.market` | `ChangeMe!SuperAdmin1` | Super Admin | Admin (`http://localhost:3001`) | Full platform access; assign other admin roles from super-admin dashboard |

**Stable user ID (seed):** `00000000-0000-4000-8000-000000000010`

### Environment overrides

Configured in `apps/api/.env`:

| Variable | Default |
|----------|---------|
| `RBAC_SUPER_ADMIN_EMAIL` | `superadmin@community.market` |
| `RBAC_SUPER_ADMIN_PASSWORD` | `ChangeMe!SuperAdmin1` |
| `RBAC_SUPER_ADMIN_DISPLAY_NAME` | `Super Admin` |
| `RBAC_SEED_RESET_PASSWORD` | `false` (set `true` to re-hash password on next seed) |

---

## Users **not** pre-seeded

There are **no** default `BUYER`, `SELLER`, or `ADMIN` accounts with fixed passwords.

| Role | How to create |
|------|----------------|
| `BUYER` | Register via web app OTP flow (`POST /api/auth/otp/send` → verify → `register/complete` → email activation) |
| `SELLER` | Same registration flow; assign `SELLER` role via super admin or admin RBAC tools |
| `ADMIN` | Super admin creates/provisions an admin user and assigns the `ADMIN` role |

### OTP codes in development

OTP is **not** a fixed code. When you call `POST /api/auth/otp/send`, the API logs the code to the **API console**:

```text
[OtpService] OTP sent to phone +1... (dev code: 123456) [ip=...]
```

Use that 6-digit code with `POST /api/auth/otp/verify`. Codes expire after **10 minutes**.

---

## Infrastructure credentials (Docker)

From `infra/docker/docker-compose.yml` and `apps/api/.env.example`.

### PostgreSQL

| Field | Value |
|-------|-------|
| Host (from host machine) | `localhost` |
| Port (mapped) | `5434` |
| Database | `community_marketplace` |
| User | `cm` |
| Password | `cm_dev_password` |
| Connection string | `postgresql://cm:cm_dev_password@localhost:5434/community_marketplace` |

### Redis

| Field | Value |
|-------|-------|
| URL (local) | `redis://localhost:6379` |
| Password | *(none — default Redis image)* |

### Meilisearch

| Field | Value |
|-------|-------|
| Host (local) | `http://localhost:7700` |
| Master key (Docker default) | `dev-master-key` |
| API key in `.env` | `MEILISEARCH_API_KEY=dev-master-key` (must match Docker master key) |
| Start locally | `docker compose -f infra/docker/docker-compose.yml up -d meilisearch` |

Compose sets `MEILI_ENV=development` so the short dev key is accepted and port `7700` is published to the host.

---

## API secrets (development defaults)

| Variable | Default | Purpose |
|----------|---------|---------|
| `JWT_SECRET` | `dev-jwt-secret-change-in-production` | Access & refresh token signing |
| `NODE_ENV` | `development` | Enables RBAC seed, OTP console logging |

Stripe, SendGrid, FCM, OpenAI, and R2 keys are **empty** in `.env.example` until you configure them.

---

## Quick login checklist

1. Start stack: `docker compose -f infra/docker/docker-compose.yml up -d`
2. Migrate + seed: `pnpm --filter @community-marketplace/api prisma:migrate` then `pnpm seed:rbac`
3. Start apps: `pnpm dev`
4. **Super admin:** open http://localhost:3001 → login with `superadmin@community.market` / `ChangeMe!SuperAdmin1`
5. **Buyer / seller:** register on http://localhost:3000 using phone OTP (watch API logs for the code)

---

## Security reminder

- Do **not** commit real production credentials to git.
- Rotate `RBAC_SUPER_ADMIN_PASSWORD` after first login in any shared environment.
- RBAC seeding is **blocked in production** unless `RBAC_SEED_FORCE=true`.
