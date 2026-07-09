# OVH VPS deploy — SellNearby pilot

> **VPS:** Gravelines · **Domain:** `sellnearby.ie` · **IP:** your VPS IPv4  
> **Prerequisites:** SSH login, DNS A records for `sellnearby.ie`, `www`, and `api` → VPS IP (no `admin.` subdomain)

---

## Phase 1 — Server setup (run on VPS as root/ubuntu)

### 1. Update system & firewall

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl ca-certificates

sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
sudo ufw status
```

### 2. Install Docker

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
newgrp docker
docker --version
docker compose version
```

Log out and SSH back in if `docker` without sudo fails.

---

## Phase 2 — Clone app & configure env

### 3. Clone repository

```bash
sudo mkdir -p /opt/sellnearby
sudo chown $USER:$USER /opt/sellnearby
cd /opt/sellnearby
git clone https://github.com/golpochat/community-marketplace.git .
```

> If `sellnearby.ie` hostnames are not on `main` yet, pull your branch or patch compose labels (see [Troubleshooting](#troubleshooting) below).

### 4. Create production env file

```bash
cd /opt/sellnearby/infra/docker
cp .env.prod.example .env.prod
nano .env.prod
```

**Required values to change:**

| Variable | How to set |
|----------|------------|
| `DOMAIN` | `sellnearby.ie` |
| `ACME_EMAIL` | `support@sellnearby.ie` (for Let's Encrypt) |
| `POSTGRES_PASSWORD` | `openssl rand -hex 24` |
| `JWT_SECRET` | `openssl rand -hex 32` |
| `MEILI_MASTER_KEY` | `openssl rand -hex 32` |
| `GRAFANA_PASSWORD` | strong password (optional stack) |

Leave Stripe/SendGrid/R2 empty for first boot — add before real users.

---

## Phase 3 — Build & start (pilot stack, ~15–25 min)

Pilot starts **core services only** (saves RAM on VPS-2). Observability can be added later.

```bash
cd /opt/sellnearby/infra/docker

docker compose -f docker-compose.prod.yml --env-file .env.prod build \
  traefik postgres redis meilisearch api worker web

docker compose -f docker-compose.prod.yml --env-file .env.prod up -d \
  traefik postgres redis meilisearch api worker web
```

### 5. Run database migrations

Start Postgres first if the full stack is not up yet:

```bash
cd /opt/sellnearby/infra/docker
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d postgres
```

Apply migrations with a **one-off container** (works even when `api` is crashed):

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod \
  run --rm api npx prisma migrate deploy
```

You should see `Applying migration` lines and `All migrations have been successfully applied.`

Then **seed RBAC roles** (required once — migrations do not insert roles):

```bash
cd /opt/sellnearby
chmod +x infra/scripts/seed-rbac-prod-docker.sh
./infra/scripts/seed-rbac-prod-docker.sh
```

Without this step, account activation fails with `users_primary_role_id_fkey`.

Then start (or restart) the app services:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d api worker web
```

If `api` is already running, you can use `exec` instead:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod \
  exec api npx prisma migrate deploy
```

### 6. Check logs

```bash
cd /opt/sellnearby/infra/docker
docker compose -f docker-compose.prod.yml --env-file .env.prod ps
docker compose -f docker-compose.prod.yml --env-file .env.prod logs -f api --tail 50
```

Wait until Traefik obtains TLS certificates (first request may take 1–2 minutes).

---

## Phase 4 — Verify

### On VPS

```bash
curl -s http://localhost:4000/api/health/ready
curl -s https://api.sellnearby.ie/api/health/ready
```

### On your Windows PC

```powershell
.\scripts\smoke-pilot.ps1 -BaseUrl "https://api.sellnearby.ie"
```

### Browser

| URL | Expected |
|-----|----------|
| https://sellnearby.ie | Marketplace homepage |
| https://sellnearby.ie/admin | Admin panel (`/admin/dashboard`) |
| https://sellnearby.ie/super-admin | Super Admin panel (`/super-admin/dashboard`) |
| https://api.sellnearby.ie/api/health/ready | JSON `status: ok` |

---

### Lookup a user role (production DB)

```bash
cd /opt/sellnearby
chmod +x infra/scripts/lookup-user-prod-docker.sh
./infra/scripts/lookup-user-prod-docker.sh sujan@sellnearby.ie
./infra/scripts/lookup-user-prod-docker.sh '%hijabi%'
```

---

## Phase 5 — After first boot (before real users)

1. **Stripe** — live keys + webhook `https://api.sellnearby.ie/api/payments/webhooks/stripe`
2. **SendGrid** — domain auth for `sellnearby.ie`, add `SENDGRID_API_KEY` to `.env.prod`, restart API
3. **R2** — image uploads, add R2 vars, restart API
4. **Seed admin** — only if needed; keep `RBAC_SEED_ENABLED=false` in prod

Restart after env changes:

```bash
cd /opt/sellnearby/infra/docker
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d api worker web
```

---

## Troubleshooting

### `container … is not connected to the network`

Docker occasionally leaves a **stopped** container registered on the compose network even though it is no longer attached. `docker compose up` then fails with:

```text
Error response from daemon: container <id> is not connected to the network community-marketplace-prod_cm-network
```

**Quick fix on VPS** (images already built — no need to rebuild):

```bash
cd /opt/sellnearby/infra/docker

# Remove known stale containers from the error output
docker rm -f 95db75d96b90 cef2ac821617 2>/dev/null || true

# Remove ALL exited containers for this compose project
docker ps -a \
  --filter "label=com.docker.compose.project=community-marketplace-prod" \
  --filter "status=exited" \
  -q | xargs -r docker rm -f

# Start the full pilot stack (skip rebuild — images are already fresh)
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d \
  traefik postgres redis meilisearch api worker web

# Verify
sleep 5
docker compose -f docker-compose.prod.yml --env-file .env.prod exec -T api \
  wget -qO- http://localhost:4000/api/health/ready
curl -s https://api.sellnearby.ie/api/health/ready
```

If that still fails, reset the whole stack (volumes are preserved):

```bash
cd /opt/sellnearby/infra/docker
docker compose -f docker-compose.prod.yml --env-file .env.prod down --remove-orphans
docker ps -a --filter "label=com.docker.compose.project=community-marketplace-prod" -q | xargs -r docker rm -f
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d \
  traefik postgres redis meilisearch api worker web
```

Then re-run the update script with build skipped:

```bash
cd /opt/sellnearby
SKIP_PULL=1 SKIP_BUILD=1 ./infra/scripts/vps-update.sh
```

`vps-update.sh` now auto-removes all stale/exited compose containers before retrying; pull latest `main` if your copy predates that fix.

### TLS / certificate errors

- Confirm DNS A records point to VPS IP (`dig sellnearby.ie +short`, `dig api.sellnearby.ie +short`)
- Remove any `admin.sellnearby.ie` A record in OVH if it still exists
- Ports 80 and 443 open (`sudo ufw status`)
- Check Traefik logs: `docker compose ... logs traefik`

### Out of memory

```bash
docker stats
```

Stop observability if you started it:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod stop prometheus grafana loki otel-collector
```

### Compose still says `community.market`

Ensure latest code with `DOMAIN` env support, or edit `infra/docker/docker-compose.prod.yml` labels to use `sellnearby.ie` / `api.sellnearby.ie` (no `admin.` subdomain).

### Prisma migrate fails

Ensure postgres is healthy:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod ps postgres
```

If `api` crashed with `The table ... does not exist`, migrations were not applied. Use `run --rm` (not `exec`):

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod \
  run --rm api npx prisma migrate deploy
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d api worker
```

### SSL / smoke test fails (`Could not establish trust relationship`)

Traefik may still be serving a default cert if Let's Encrypt has not issued yet.

**If ACME logs show `unable to parse email address`:** set a valid email in `.env.prod`:

```bash
grep ACME_EMAIL infra/docker/.env.prod
# ACME_EMAIL=support@sellnearby.ie
```

Then reset the ACME store and recreate Traefik:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod stop traefik
docker volume rm community-marketplace-prod_traefik_acme
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --force-recreate traefik api web
```

**If Traefik logs show `client version 1.24 is too old`:** Docker on the VPS is newer than Traefik v3.2 supports. Upgrade Traefik:

```bash
git pull origin main   # needs traefik:v3.6.1+ in compose
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --force-recreate traefik api web
```

On VPS:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod logs traefik --tail 50 | grep -i acme
curl -vk https://api.sellnearby.ie/api/health/ready 2>&1 | grep -E "issuer|subject|SSL"
```

Ensure `.env.prod` has `ACME_EMAIL=support@sellnearby.ie`, ports **80** and **443** are open (`sudo ufw status`), and DNS A records point to the VPS IP.

After pulling compose TLS label fixes, recreate Traefik and app routers:

```bash
git pull origin main
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --force-recreate traefik api web
```

Wait 1–2 minutes, then hit `https://api.sellnearby.ie` once in a browser to trigger cert issuance.

**Workaround (API already healthy):** smoke test via SSH tunnel without public TLS:

```powershell
ssh -L 4000:localhost:4000 ubuntu@YOUR_VPS_IP
# In another terminal on VPS: curl http://localhost:4000/api/health/ready
.\scripts\smoke-pilot.ps1 -BaseUrl "http://localhost:4000"
```

---

- [pilot-kickoff.md](./pilot-kickoff.md)
- [launch-checklist.md](../product/launch-checklist.md)
- [deploy.md](./deploy.md)
