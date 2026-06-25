# Development Credentials

> **Local development only.** Change all passwords and secrets before staging or production.  
> Values below match seed scripts and `apps/api/.env.example` unless you have overridden them in `.env`.  
> **Problems starting the stack?** See [Troubleshooting](./troubleshooting.md).

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

All dashboards run in the **unified web app** on port **3000**. There is no separate admin frontend on port 3001.

| Service | URL |
|---------|-----|
| Web (marketplace + all role dashboards) | http://localhost:3000 |
| Sign in | http://localhost:3000/auth/login |
| API | http://localhost:4000/api |
| API health | http://localhost:4000/api/health |
| API live probe | http://localhost:4000/api/health/live |

### Role dashboard entry points

| Role | Dashboard URL |
|------|----------------|
| `SUPER_ADMIN` | http://localhost:3000/super-admin/dashboard |
| `ADMIN` | http://localhost:3000/admin/dashboard |
| `SELLER` | http://localhost:3000/seller/dashboard |
| `BUYER` | http://localhost:3000/buyer/dashboard |

---

## Local development modes

Use **one** API process on port **4000**. Running Docker API and `pnpm dev` API at the same time causes `EADDRINUSE`.

### Mode A — Hybrid (recommended)

Docker runs **infrastructure + API**; you run the **web app locally** for fast UI work.

```bash
# 1. Start infra + API in Docker
docker compose -f infra/docker/docker-compose.dev.yml up -d postgres redis meilisearch api worker

# 2. Migrate + seed (from repo root)
pnpm --filter @community-marketplace/api prisma:migrate:deploy
pnpm seed:rbac
pnpm seed:dev-users

# 3. Web only (port 3000)
pnpm dev:web
```

Point `apps/web/.env` at the Docker API:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Mode B — Fully local (web + API via pnpm)

Docker runs **infrastructure only**; API and web run on the host.

```bash
# 1. Start infra only (no api / web / admin containers)
docker compose -f infra/docker/docker-compose.dev.yml up -d postgres redis meilisearch

# 2. Copy env files
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# 3. In apps/api/.env use Docker-mapped ports:
#    DATABASE_URL=postgresql://cm:cm_dev_password@localhost:5434/community_marketplace
#    REDIS_URL=redis://localhost:6380
#    MEILISEARCH_HOST=http://localhost:7700

# 4. Migrate + seed, then start both apps
pnpm --filter @community-marketplace/api prisma:migrate:deploy
pnpm seed:rbac
pnpm seed:dev-users
pnpm dev
```

### Deprecated

| Item | Notes |
|------|-------|
| `apps/admin` (port 3001) | Retired — dashboards live under `apps/web` |
| `pnpm dev:admin` | Removed from root scripts |
| Docker `admin` service | Still in compose file for legacy; do not use for new work |

---

## Seeded application users (one per role)

Run seeds in order:

```bash
pnpm seed:rbac
pnpm seed:dev-users
```

| Role | Email | Password | Display name | User ID | After login |
|------|-------|----------|--------------|---------|-------------|
| `SUPER_ADMIN` | `superadmin@community.market` | `ChangeMe!SuperAdmin1` | Super Admin | `00000000-0000-4000-8000-000000000010` | `/super-admin/dashboard` |
| `ADMIN` | `admin@community.market` | `ChangeMe!Admin1` | Platform Admin | `00000000-0000-4000-8000-000000000011` | `/admin/dashboard` |
| `SELLER` | `seller@community.market` | `ChangeMe!Seller1` | Demo Seller | `00000000-0000-4000-8000-000000000012` | `/seller/dashboard` |
| `BUYER` | `buyer@community.market` | `ChangeMe!Buyer1` | Demo Buyer | `00000000-0000-4000-8000-000000000013` | `/buyer/dashboard` |

Sign in at http://localhost:3000/auth/login with any row above. All roles use the same web app; middleware sends each role to the correct dashboard.

### Phone numbers (seller / buyer)

| Role | Phone |
|------|-------|
| `SELLER` | `+353871000001` |
| `BUYER` | `+353871000002` |

Seller and buyer accounts support **email + password** login and OTP flows when needed.

---

## SUPER_ADMIN policy (immutable singleton)

The bootstrap `SUPER_ADMIN` account is **seed-only**:

| Rule | Enforced |
|------|----------|
| Only one `SUPER_ADMIN` exists | Created by `pnpm seed:rbac` / `pnpm seed:dev-users` |
| Cannot create another `SUPER_ADMIN` via API | `POST /api/super-admin/users/assign-role` with `SUPER_ADMIN` role → **403** |
| Cannot suspend, ban, or reassign the bootstrap account | Admin user management → **403** |
| Cannot delete the bootstrap account | Protected at service layer |

Additional `ADMIN`, `SELLER`, and `BUYER` users may be created through normal registration or admin tools.

---

## Seed environment overrides

Configured in `apps/api/.env`:

| Variable | Default | Purpose |
|----------|---------|---------|
| `RBAC_SUPER_ADMIN_EMAIL` | `superadmin@community.market` | Bootstrap super-admin email |
| `RBAC_SUPER_ADMIN_PASSWORD` | `ChangeMe!SuperAdmin1` | Bootstrap super-admin password |
| `RBAC_SUPER_ADMIN_DISPLAY_NAME` | `Super Admin` | Display name |
| `RBAC_SEED_RESET_PASSWORD` | `false` | Set `true` to re-hash passwords on next seed |
| `RBAC_SEED_ENABLED` | `true` | Disable seeding when `false` |
| `RBAC_SEED_FORCE` | `false` | Allow seed in production when `true` (recovery only) |

Dev user passwords (`ADMIN`, `SELLER`, `BUYER`) are defined in `apps/api/src/database/dev-users.seed.data.ts` and follow the same `RBAC_SEED_RESET_PASSWORD` behaviour.

---

## OTP codes in development

OTP is **not** a fixed code. When you call `POST /api/auth/otp/send`, the API logs the code to the **API console**:

```text
[OtpService] OTP sent to phone +353... (dev code: 123456) [ip=...]
```

Use that 6-digit code with `POST /api/auth/otp/verify`. Codes expire after **10 minutes**.

---

## Infrastructure (Docker dev stack)

From `infra/docker/docker-compose.dev.yml`. Host-machine ports are what local `apps/api` and `apps/web` use when connecting from outside Docker.

| Service | Host port | Container | Purpose |
|---------|-----------|-----------|---------|
| PostgreSQL | `5434` | `5432` | Primary database |
| Redis | `6380` | `6379` | Cache, sessions, BullMQ |
| Meilisearch | `7700` | `7700` | Full-text search |
| API | `4000` | `4000` | NestJS REST + WebSocket |
| Worker | `4001` | `4001` | BullMQ worker health |
| Web | `3000` | `3000` | Next.js (optional — prefer `pnpm dev:web`) |

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
| URL (Docker dev stack — use this locally) | `redis://localhost:6380` |
| URL (inside Docker network) | `redis://redis:6379` |
| Password | *(none — default Redis image)* |

### Meilisearch

| Field | Value |
|-------|-------|
| Host (local) | `http://localhost:7700` |
| Master key (Docker default) | `dev-master-key` |
| API key in `.env` | `MEILISEARCH_API_KEY=dev-master-key` |

---

## API secrets (development defaults)

| Variable | Default | Purpose |
|----------|---------|---------|
| `JWT_SECRET` | `dev-jwt-secret-change-in-production` | Access & refresh token signing |
| `NODE_ENV` | `development` | Enables RBAC/dev-user seed, OTP console logging |
| `CORS_ORIGIN` | `http://localhost:3000` | Allowed browser origin for API |
| `WEB_APP_URL` | `http://localhost:3000` | Activation email links |

Stripe, SendGrid, FCM, OpenAI, and R2 keys are **empty** in `.env.example` until you configure them.

---

## Quick login checklist

1. Start Docker infra (and API if using **Mode A**):
   ```bash
   docker compose -f infra/docker/docker-compose.dev.yml up -d postgres redis meilisearch api worker
   ```
2. Migrate + seed:
   ```bash
   pnpm --filter @community-marketplace/api prisma:migrate:deploy
   pnpm seed:rbac
   pnpm seed:dev-users
   ```
3. Start web:
   - **Mode A:** `pnpm dev:web`
   - **Mode B:** stop Docker `api` first, then `pnpm dev`
4. Open http://localhost:3000/auth/login and sign in:

| Role | Email | Password |
|------|-------|----------|
| Super admin | `superadmin@community.market` | `ChangeMe!SuperAdmin1` |
| Admin | `admin@community.market` | `ChangeMe!Admin1` |
| Seller | `seller@community.market` | `ChangeMe!Seller1` |
| Buyer | `buyer@community.market` | `ChangeMe!Buyer1` |

### Troubleshooting

| Symptom | Fix |
|---------|-----|
| `EADDRINUSE` on port `4000` | Docker `api` is already running. Use **Mode A** (`pnpm dev:web` only) or stop the container: `docker compose -f infra/docker/docker-compose.dev.yml stop api` |
| `EADDRINUSE` on port `3000` | Stop Docker `web` or another Next.js process: `docker compose -f infra/docker/docker-compose.dev.yml stop web` |
| API cannot reach Redis | Set `REDIS_URL=redis://localhost:6380` in `apps/api/.env` when using the Docker dev stack |

---

## Stripe (test mode — Ireland / EUR)

Payments use **Stripe Connect Express** for sellers and **PaymentIntents** for buyers. Configure keys in local `.env` files (never commit them).

| File | Variable |
|------|----------|
| `apps/api/.env` | `STRIPE_SECRET_KEY=sk_test_...` |
| `apps/api/.env` | `STRIPE_WEBHOOK_SECRET=whsec_...` (from Stripe CLI, below) |
| `apps/web/.env` | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...` |

### One-time: enable Connect on your Stripe account

API keys alone are not enough. The **platform** Stripe account must enroll in Connect before seller onboarding works.

1. Open [Stripe Dashboard → Connect (Test mode)](https://dashboard.stripe.com/test/connect).
2. Complete the short Connect setup wizard (Express accounts, marketplace / platform).
3. Restart the API, then try **Seller → Earnings → Connect with Stripe** again.

If you see *"You can only create new accounts if you've signed up for Connect"*, this step was skipped.

### End-to-end payment test flow

1. **Seller** — sign in as `seller@community.market`, open **Seller → Earnings**, click **Connect with Stripe**, complete Express onboarding (test business details are fine in test mode).
2. **Seller** — create an **active** listing (admin approval may be required depending on seed data).
3. **Buyer** — sign in as `buyer@community.market`, open **Buyer → Purchases**, select the listing, pay with test card `4242 4242 4242 4242` (any future expiry, any CVC).
4. Confirm the listing moves to **sold** and payment status is **succeeded**.

### Local webhooks (recommended)

Stripe webhooks keep payment status and listing state in sync if the buyer closes the tab before confirm runs.

```bash
# Install Stripe CLI: https://stripe.com/docs/stripe-cli
pnpm stripe:listen
```

Copy the `whsec_...` signing secret from the CLI output into `apps/api/.env` as `STRIPE_WEBHOOK_SECRET`, then restart the API.

Webhook endpoint: `POST http://localhost:4000/api/payments/webhooks/stripe`

---

## Security reminder

- Do **not** commit real production credentials to git.
- Rotate all `ChangeMe!*` passwords after first login in any shared environment.
- RBAC and dev-user seeding is **blocked in production** unless `RBAC_SEED_FORCE=true`.
