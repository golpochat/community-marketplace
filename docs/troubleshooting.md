# Troubleshooting Guide

> **Audience:** Developers and operators working on Community Marketplace locally or in shared dev environments.  
> **Scope:** Symptom-based fixes for the monorepo (`apps/api`, `apps/web`, Docker infra).  
> **Related:** [Dev credentials](./dev-credentials.md) · [Local development](./onboarding/local-development.md) · [Runbooks](./runbooks/README.md)

---

## How to use this guide

1. Find your **symptom** in the table below.
2. Follow the **verify → fix → confirm** steps in that section.
3. Run only **one** fix at a time, then re-test before moving on.

| Symptom | Go to |
|---------|--------|
| `EADDRINUSE` / port already in use | [Port conflicts](#port-conflicts) |
| API crashes on startup | [API won't start](#api-wont-start) |
| Browser shows connection refused / API unreachable | [API not responding](#api-not-responding) |
| Web loads but data fails / 401 / 404 on API calls | [Web ↔ API connectivity](#web--api-connectivity) |
| `prisma generate` EPERM or DLL locked | [Prisma client locked](#prisma-client-locked) |
| Migration or schema errors | [Database & migrations](#database--migrations) |
| Redis eviction policy warnings | [Redis warnings](#redis-warnings) |
| Search returns nothing / Meilisearch errors | [Meilisearch](#meilisearch) |
| TypeScript errors after pulling changes | [Build & typecheck](#build--typecheck) |
| Can't log in / empty categories | [Seeds & dev users](#seeds--dev-users) |
| Docker services unhealthy | [Docker infrastructure](#docker-infrastructure) |
| Stripe webhooks not firing | [Stripe webhooks](#stripe-webhooks-local) |

---

## Quick health checks

Run these from the **repository root** after services should be running.

| Check | Command | Expected |
|-------|---------|----------|
| API live | `curl http://localhost:4000/api/health/live` | HTTP `200` |
| API ready | `curl http://localhost:4000/api/health` | HTTP `200` with dependency status |
| Web | Open http://localhost:3000 | Marketplace home loads |
| Postgres | `docker compose -f infra/docker/docker-compose.dev.yml ps postgres` | `healthy` |
| Redis | `docker compose -f infra/docker/docker-compose.dev.yml ps redis` | `healthy` |
| Meilisearch | `curl http://localhost:7700/health` | `{"status":"available"}` |

**Windows (PowerShell)** — API health:

```powershell
Invoke-WebRequest -Uri "http://localhost:4000/api/health/live" -UseBasicParsing
```

---

## Port conflicts

### Symptom

```text
Error: listen EADDRINUSE: address already in use :::4000
```

Or the web app shows `ERR_CONNECTION_REFUSED` while the API terminal reports a crash.

### Cause

Another process is already bound to the port. Common sources:

- A **stale Node process** from a previous `pnpm dev` (often from a background terminal or Nest watch restart on Windows).
- **Two dev sessions at once** — e.g. Cursor agent background `pnpm dev` **and** your terminal `pnpm dev`.
- **Two API instances** — e.g. Docker API **and** local `pnpm dev:api` both on port `4000`.
- A crashed Nest watch process that did not release the port immediately.

### Automatic cleanup (recommended)

`pnpm dev` now runs a dev orchestrator that:

1. Stops any **previous dev session** from this repo (via `.dev/dev.lock.json`)
2. Clears stale **Community Marketplace** listeners on ports **3000** and **4000**
3. Shuts down **both** web and API when you press `Ctrl+C`

Manual cleanup if needed:

```bash
pnpm dev:kill
```

### Verify

**Windows (PowerShell):**

```powershell
# What is listening on port 4000?
Get-NetTCPConnection -LocalPort 4000 -ErrorAction SilentlyContinue |
  Select-Object LocalAddress, LocalPort, State, OwningProcess

# Alternative
netstat -ano | findstr ":4000"
```

**macOS / Linux:**

```bash
lsof -i :4000
# or
ss -tlnp | grep 4000
```

### Fix

**Windows** — stop the owning process (replace `<PID>` with `OwningProcess` from above):

```powershell
Stop-Process -Id <PID> -Force
```

**macOS / Linux:**

```bash
kill -9 <PID>
```

Then start **only one** API:

```bash
pnpm dev:api
# or full stack:
pnpm dev
```

### Confirm

```powershell
Invoke-WebRequest -Uri "http://localhost:4000/api/health/live" -UseBasicParsing
```

### Prevention

| Rule | Why |
|------|-----|
| Use **`pnpm dev`** (orchestrator) instead of starting web/API separately when possible | Auto-cleans stale listeners and coordinates shutdown |
| Run **`pnpm dev:kill`** if ports are stuck | Clears project dev processes on 3000/4000 only |
| Run **one** API on port `4000` | Docker API **or** `pnpm dev:api`, not both |
| Stop dev with `Ctrl+C` and wait for exit | Avoids orphan Node listeners |
| Use `pnpm dev:web` when Docker runs the API | See [dev-credentials — Mode A](./dev-credentials.md#mode-a--hybrid-recommended) |

**Port reference**

| Port | Service |
|------|---------|
| `3000` | Next.js web app |
| `4000` | NestJS API |
| `4001` | BullMQ worker health (optional) |
| `5434` | PostgreSQL (host → Docker) |
| `6380` | Redis (host → Docker) |
| `7700` | Meilisearch |

---

## API won't start

### Symptom

NestJS compiles (`Found 0 errors`) then exits with `EADDRINUSE`, database connection errors, or module import failures.

### Verify

```bash
# From repo root — typecheck API only
pnpm --filter @community-marketplace/api exec tsc --noEmit
```

Check API logs for the **first** error line (not the stack trace tail).

### Fix by error type

| Error | Action |
|-------|--------|
| `EADDRINUSE :::4000` | [Port conflicts](#port-conflicts) |
| `Can't reach database` / `ECONNREFUSED` on `5434` | [Docker infrastructure](#docker-infrastructure) |
| `Prisma Client` / schema out of date | [Database & migrations](#database--migrations) |
| TypeScript errors in `apps/api` | [Build & typecheck](#build--typecheck) |
| `EPERM` on `prisma generate` | [Prisma client locked](#prisma-client-locked) |

### Clean restart (fully local mode)

```bash
# 1. Ensure infra is up
docker compose -f infra/docker/docker-compose.dev.yml up -d postgres redis meilisearch

# 2. Regenerate Prisma client (API stopped first)
pnpm --filter @community-marketplace/api prisma:generate

# 3. Apply migrations
pnpm --filter @community-marketplace/api prisma:migrate:deploy

# 4. Start API
pnpm dev:api
```

---

## API not responding

### Symptom

`curl http://localhost:4000/api/health/live` fails, or the web app cannot load listings.

### Verify

```powershell
# Is anything listening?
netstat -ano | findstr ":4000" | findstr LISTENING
```

### Fix

1. If **nothing** is listening → start the API: `pnpm dev:api`
2. If something is listening but health fails → check API terminal for runtime errors (DB, Redis).
3. If a **stale** process is listening → [Port conflicts](#port-conflicts)

### Confirm

```bash
curl http://localhost:4000/api/health/live
curl http://localhost:4000/api/health
```

---

## Web ↔ API connectivity

### Symptom

Web UI loads at `localhost:3000` but API calls fail (network errors, CORS, 404, empty data).

### Verify

Check `apps/web/.env` (or `.env.local`):

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

In the browser **Network** tab, confirm requests go to `http://localhost:4000/api/...`, not the wrong host or port.

### Fix

| Issue | Command / action |
|-------|-------------------|
| Wrong API URL | Update `NEXT_PUBLIC_API_URL`, restart web: `pnpm dev:web` |
| API down | `pnpm dev:api` and [health check](#quick-health-checks) |
| 404 on super-admin routes | Ensure API is latest; super-admin listing routes require a recent API build |
| Stale Next.js env | Stop web dev server, delete `.next`, restart: `pnpm dev:web` |

```bash
# Clear Next.js cache (from apps/web or repo root)
rm -rf apps/web/.next
pnpm dev:web
```

---

## Prisma client locked

### Symptom

```text
EPERM: operation not permitted, rename ... query_engine-windows.dll.node
```

### Cause

The API process holds the Prisma query engine DLL while `prisma generate` runs.

### Fix

1. Stop the API (`Ctrl+C` in the API terminal, or [kill port 4000](#port-conflicts)).
2. Regenerate:

```bash
pnpm --filter @community-marketplace/api prisma:generate
```

3. Restart the API:

```bash
pnpm dev:api
```

---

## Database & migrations

### Symptom

`PrismaClientKnownRequestError`, missing columns, enum mismatches, or `migrate` failures.

### Verify

```bash
# Postgres container healthy?
docker compose -f infra/docker/docker-compose.dev.yml ps postgres

# Can you connect? (credentials in dev-credentials.md)
docker compose -f infra/docker/docker-compose.dev.yml exec postgres \
  psql -U cm -d community_marketplace -c "SELECT 1"
```

Confirm `DATABASE_URL` in `apps/api/.env` matches Docker host port **`5434`** for local mode:

```env
DATABASE_URL=postgresql://cm:cm_dev_password@localhost:5434/community_marketplace
```

### Fix

```bash
# Apply pending migrations (safe for shared dev / CI-like flows)
pnpm --filter @community-marketplace/api prisma:migrate:deploy

# Regenerate client after schema changes
pnpm --filter @community-marketplace/api prisma:generate
```

**Create a new migration** (local development only):

```bash
pnpm --filter @community-marketplace/api prisma:migrate
```

### Confirm

Restart API and hit an endpoint that reads the DB, e.g.:

```bash
curl http://localhost:4000/api/listings/categories
```

---

## Redis warnings

### Symptom

API logs repeatedly show:

```text
IMPORTANT! Eviction policy is allkeys-lru. It should be "noeviction"
```

### Impact

**Low in local dev** — cache keys may be evicted under memory pressure. **Higher in production** — job queue data could be lost if Redis evicts BullMQ keys.

### Fix (local Docker Redis)

```bash
docker compose -f infra/docker/docker-compose.dev.yml exec redis \
  redis-cli CONFIG SET maxmemory-policy noeviction
```

For a permanent fix, update the Redis configuration in `infra/docker/docker-compose.dev.yml` or your production Redis config.

### Verify

```bash
docker compose -f infra/docker/docker-compose.dev.yml exec redis \
  redis-cli CONFIG GET maxmemory-policy
```

Expected: `noeviction`

---

## Meilisearch

### Symptom

Search returns no results, or API logs `Failed to connect to Meilisearch`.

### Verify

```bash
curl http://localhost:7700/health
docker compose -f infra/docker/docker-compose.dev.yml ps meilisearch
```

Check `MEILISEARCH_HOST=http://localhost:7700` in `apps/api/.env`.

### Fix

```bash
docker compose -f infra/docker/docker-compose.dev.yml up -d meilisearch
```

Re-index if needed (after bulk data changes):

```bash
# Restart API — indexing listeners run on startup / listing events
pnpm dev:api
```

---

## Build & typecheck

### Symptom

`Found N errors` in API watch mode, or web build fails after `git pull`.

### Fix

```bash
# Rebuild shared packages first
pnpm --filter "./packages/*" build

# Full monorepo typecheck
pnpm typecheck

# API only
pnpm --filter @community-marketplace/api exec tsc --noEmit

# Web only
pnpm --filter @community-marketplace/web exec tsc --noEmit
```

If errors reference old listing statuses (`banned`, `archived`), pull latest `main` and run migrations — see [Database & migrations](#database--migrations).

---

## Seeds & dev users

### Symptom

Login fails, dashboards redirect incorrectly, or create-listing shows "No categories".

### Fix

Run seeds **in order** from repo root:

```bash
pnpm seed:rbac
```

### Test credentials

See [dev-credentials.md](./dev-credentials.md#seeded-application-users-bootstrap).

| Role | Email | Password |
|------|-------|----------|
| Super Admin | `superadmin@sellnearby.ie` | `ChangeMe!SuperAdmin1` |
| Admin | `admin@sellnearby.ie` | `ChangeMe!Admin1` |
| Member | `member@sellnearby.ie` | `ChangeMe!Member1` |

### OTP in development

OTP codes are printed in the **API console** when you request one — there is no fixed dev code.

### OTP on production VPS (pilot)

SMS is **not** sent until a provider (e.g. Twilio) is integrated. During pilot:

1. The register page shows a **Pilot mode** banner when `NEXT_PUBLIC_OTP_PILOT_MODE=true` (baked into the web image at build; API uses `OTP_PILOT_MODE`).
2. Codes appear in API container logs:

```bash
cd /opt/sellnearby/infra/docker
docker compose -f docker-compose.prod.yml --env-file .env.prod logs api --tail=200 | grep "dev code"
```

3. After wiring real SMS, set `OTP_PILOT_MODE=false` in `.env.prod`, rebuild and recreate `web`.

See [pilot-vps-day-by-day.md](./runbooks/pilot-vps-day-by-day.md#b2-registration--phone-otp-pilot-mode).

---

## Docker infrastructure

### Symptom

Database, Redis, or Meilisearch connection refused.

### Start infrastructure only (Mode B — fully local)

```bash
docker compose -f infra/docker/docker-compose.dev.yml up -d postgres redis meilisearch
```

### Start infrastructure + API in Docker (Mode A — hybrid)

```bash
docker compose -f infra/docker/docker-compose.dev.yml up -d postgres redis meilisearch api worker
```

Then run **only** the web app locally: `pnpm dev:web`

### Check status

```bash
docker compose -f infra/docker/docker-compose.dev.yml ps
```

### Reset volumes (destructive — wipes local DB)

> **Warning:** Deletes all local data. Use only when the database is corrupted or you need a clean slate.

```bash
docker compose -f infra/docker/docker-compose.dev.yml down -v
docker compose -f infra/docker/docker-compose.dev.yml up -d postgres redis meilisearch
pnpm --filter @community-marketplace/api prisma:migrate:deploy
pnpm seed:rbac
```

---

## Stripe webhooks (local)

### Symptom

Payments succeed in UI but order/listing state does not update.

### Fix

Forward Stripe events to the local API (separate terminal):

```bash
pnpm stripe:listen
```

Ensure `STRIPE_WEBHOOK_SECRET` in `apps/api/.env` matches the secret printed by the Stripe CLI.

---

## Common workflow mistakes

| Mistake | Result | Correct approach |
|---------|--------|------------------|
| Docker API + `pnpm dev:api` together | `EADDRINUSE` on 4000 | Pick [Mode A or B](./dev-credentials.md#local-development-modes) |
| Multiple `pnpm --filter api dev` terminals | Port conflict / flaky restarts | One API terminal only |
| Edit `apps/web/.env` without restart | Stale API URL in browser | Restart `pnpm dev:web` |
| Skip migrations after pull | 500 errors, missing columns | `prisma:migrate:deploy` |
| Run `prisma generate` while API is running (Windows) | `EPERM` DLL error | Stop API first |

---

## Escalation checklist

If the issue persists after this guide:

1. Capture **API terminal output** from first error to crash.
2. Note **dev mode** (Mode A hybrid vs Mode B fully local).
3. Record output of:
   ```bash
   node -v && pnpm -v
   docker compose -f infra/docker/docker-compose.dev.yml ps
   curl -s http://localhost:4000/api/health
   ```
4. Check recent git changes touching `prisma/schema.prisma` or `apps/api/.env`.
5. For production incidents, follow [Runbooks](./runbooks/README.md) and on-call procedures.

---

## Document history

| Date | Change |
|------|--------|
| 2026-06-25 | Initial troubleshooting guide (ports, Prisma, Docker, connectivity) |
