# OVH VPS deploy — SellNearby pilot

> **VPS:** Gravelines · **Domain:** `sellnearby.ie` · **IP:** your VPS IPv4  
> **Prerequisites:** SSH login, DNS A records → VPS IP

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
  traefik postgres redis meilisearch api worker web admin

docker compose -f docker-compose.prod.yml --env-file .env.prod up -d \
  traefik postgres redis meilisearch api worker web admin
```

### 5. Run database migrations

```bash
cd /opt/sellnearby
docker compose -f infra/docker/docker-compose.prod.yml --env-file infra/docker/.env.prod \
  exec api sh -c 'cd /app && npx prisma migrate deploy'
```

If `exec` path differs, use:

```bash
docker compose -f infra/docker/docker-compose.prod.yml --env-file infra/docker/.env.prod \
  run --rm api npx prisma migrate deploy
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
| https://admin.sellnearby.ie | Admin login |
| https://api.sellnearby.ie/api/health/ready | JSON `status: ok` |

---

## Phase 5 — After first boot (before real users)

1. **Stripe** — live keys + webhook `https://api.sellnearby.ie/api/payments/webhooks/stripe`
2. **SendGrid** — domain auth for `sellnearby.ie`, add `SENDGRID_API_KEY` to `.env.prod`, restart API
3. **R2** — image uploads, add R2 vars, restart API
4. **Seed admin** — only if needed; keep `RBAC_SEED_ENABLED=false` in prod

Restart after env changes:

```bash
cd /opt/sellnearby/infra/docker
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d api worker web admin
```

---

## Troubleshooting

### TLS / certificate errors

- Confirm DNS A records point to VPS IP (`dig sellnearby.ie +short`)
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

Ensure latest code with `DOMAIN` env support, or edit `infra/docker/docker-compose.prod.yml` labels to use `sellnearby.ie` / `api.sellnearby.ie` / `admin.sellnearby.ie`.

### Prisma migrate fails

Ensure postgres is healthy:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod ps postgres
```

---

## Related

- [pilot-kickoff.md](./pilot-kickoff.md)
- [launch-checklist.md](../product/launch-checklist.md)
- [deploy.md](./deploy.md)
