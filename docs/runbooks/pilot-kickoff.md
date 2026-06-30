# Pilot kickoff runbook

> **Goal:** Closed pilot with real users and real card payments in ~2–3 weeks.  
> **Master checklist:** [launch-checklist.md](../product/launch-checklist.md)  
> **Smoke script:** `[scripts/smoke-pilot.ps1](../../scripts/smoke-pilot.ps1)`

This runbook is the **execution order**. The launch checklist is the **full inventory**.

---

## Current baseline (2026-06-27)

| Check                                  | Result                                        |
| -------------------------------------- | --------------------------------------------- |
| Local API `/api/health/ready`          | ✅ DB, Redis, Meilisearch up                  |
| Local smoke script                     | Run: `.\scripts\smoke-pilot.ps1`              |
| Staging `api.staging.community.market` | ❌ DNS not resolving — **infra not live yet** |
| Production `api.community.market`      | ❌ DNS not resolving — **infra not live yet** |

**Conclusion:** Product works locally. **Next blocker is infrastructure** (cluster/host + DNS + secrets), not new features.

---

## Phase A — Prove it works (Week 1)

### Day 1 — Local baseline ✅ (do today)

```powershell
# From repo root — API + Docker infra running (pnpm dev)
.\scripts\smoke-pilot.ps1

# Optional: login smoke with dev seller
.\scripts\smoke-pilot.ps1 -LoginEmail "seller@community.market" -LoginPassword "ChangeMe!Seller1"
```

Manual browser checks (15 min):

- [ ] Homepage loads, listings visible
- [ ] Listing detail → open chat
- [ ] Seller login → dashboard → create/edit listing
- [ ] Admin login → dashboard → moderation queue

---

### Day 2 — Choose hosting path

Pick **one** path for staging + prod:

| Path                                       | Best for                   | Notes                                                          |
| ------------------------------------------ | -------------------------- | -------------------------------------------------------------- |
| **A. Kubernetes** (repo default)           | Scale, CI/CD already wired | Needs cluster (GKE, EKS, DO K8s) + GitHub secrets              |
| **B. Docker Compose prod** on VPS          | Fastest pilot              | `infra/docker/docker-compose.prod.yml` on Hetzner/DigitalOcean |
| **C. Managed PaaS** (Railway, Render, Fly) | Minimal ops                | Adapt env vars; may skip K8s manifests                         |

**Recommended for speed:** Path **B** for pilot, migrate to K8s later if needed.

---

### Day 3 — Domain & DNS

Target hosts (from `infra/k8s/base/ingress.yaml`):

| Host                                      | Service |
| ----------------------------------------- | ------- |
| `community.market` (or your brand domain) | Web     |
| `api.community.market`                    | API     |
| `admin.community.market`                  | Admin   |

- [ ] Register domain (if not owned)
- [ ] Create A/CNAME records → load balancer or VPS IP
- [ ] TLS: Let's Encrypt (Traefik / cert-manager) or Cloudflare proxy

---

### Day 4 — GitHub secrets (K8s path)

Configure in GitHub → Settings → Environments → **staging** / **production**:

| Secret                 | Purpose                    |
| ---------------------- | -------------------------- |
| `STAGING_DATABASE_URL` | Postgres connection string |
| `STAGING_KUBECONFIG`   | Base64 kubeconfig          |
| `PROD_DATABASE_URL`    | Prod Postgres              |
| `PROD_KUBECONFIG`      | Prod kubeconfig            |
| `GHCR_TOKEN`           | Push Docker images         |

API pod secrets (`infra/k8s/base/secrets.yaml` template):

| Key                          | Purpose                              |
| ---------------------------- | ------------------------------------ |
| `JWT_SECRET`                 | Strong random (64+ chars)            |
| `STRIPE_SECRET_KEY`          | Stripe **live** secret (after Day 6) |
| `STRIPE_WEBHOOK_SECRET`      | From Stripe dashboard                |
| `SENDGRID_API_KEY`           | Transactional email                  |
| `R2_*`                       | Cloudflare R2 media                  |
| `MEILISEARCH_API_KEY`        | Search master key                    |
| `DATABASE_URL` / `REDIS_URL` | Data layer                           |

**Production safety:**

- [ ] `RBAC_SEED_ENABLED=false`
- [ ] `NODE_ENV=production`
- [ ] Rotate all values from dev defaults

---

### Day 5 — Staging deploy + smoke

**K8s:** merge to `main` triggers `deploy-staging.yml`, or run workflow manually.

**Verify:**

```powershell
.\scripts\smoke-pilot.ps1 -BaseUrl "https://api.staging.community.market"
```

- [ ] Web URL loads over HTTPS
- [ ] Admin URL loads over HTTPS
- [ ] Worker processing jobs (`/api/health/queues` stable)
- [ ] Migrations applied (`prisma migrate deploy` in CI log)

---

### Day 6–7 — Wire money, email, media (staging first)

Do in this order; test each before moving on.

#### 1. Stripe (test mode on staging, live on prod)

- [ ] Stripe Connect enabled on platform account
- [ ] Webhook endpoint: `https://api.<env>/api/payments/webhooks/stripe`
- [ ] Events — **Your account:** `checkout.session.completed`, `payment_intent.succeeded`, `payment_intent.payment_failed`, `refund.created`, `charge.dispute.created`, `account.updated`, `transfer.created`
- [ ] Events — **Connected accounts:** `payout.paid`, `payout.failed`
- [ ] Seller Connect onboarding completes on staging
- [ ] Test purchase end-to-end (Stripe test card `4242…`)

#### 2. SendGrid

- [ ] API key in secrets
- [ ] Domain authentication (SPF, DKIM)
- [ ] `EMAIL_FROM` verified
- [ ] Registration → activation email received

#### 3. Cloudflare R2

- [ ] Bucket per environment (`community-marketplace-staging`, `-prod`)
- [ ] `R2_PUBLIC_URL` set
- [ ] Create listing with photo → image loads on web

Re-run smoke + manual checkout after each pipe.

---

## Phase B — Production + pilot users (Week 2)

### Day 8 — Production deploy

1. Staging smoke matrix green (section 7 of [launch-checklist](../product/launch-checklist.md))
2. GitHub Actions → **Deploy Production** → type `deploy`
3. Run:

```powershell
.\scripts\smoke-pilot.ps1 -BaseUrl "https://api.community.market"
```

- [ ] Switch Stripe to **live** keys on prod only
- [ ] One real €1–€5 test purchase, then refund if needed

---

### Day 9 — Minimum legal + ops

Not code — required before inviting outsiders:

- [ ] Beta **Terms of Service** (solicitor-reviewed)
- [ ] Beta **Privacy Policy** (GDPR baseline)
- [ ] 1–2 page **internal playbook**: disputes, refunds, moderation SLA
- [ ] Support email on `/contact` monitored daily

---

### Day 10 — Invite pilot cohort

- [ ] 10–20 sellers (people you know)
- [ ] Invite-only signup (manual approval or hidden link)
- [ ] One geographic focus if possible (e.g. one Irish city)
- [ ] Daily admin queue check (reports, verification, payments)

**Acceptable gaps during pilot:** FCM push, keyword automation, full category tree, wallet spend, status page.

---

## Phase C — Learn & plan public launch (Week 3–4)

After 2 weeks of pilot usage, review:

| Signal                      | Action                                                                                                                      |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Moderation load high        | Prioritize keyword filters + prohibited items page                                                                          |
| Connect onboarding drop-off | Improve seller onboarding UX copy                                                                                           |
| Disputes / refunds          | Formalize public refund policy                                                                                              |
| Ready to open signup        | Start [launch-checklist Path B](../product/launch-checklist.md#path-b--public-ireland-launch-target-6-10-weeks-after-pilot) |

---

## Quick reference

```powershell
# Local
.\scripts\smoke-pilot.ps1

# Staging
.\scripts\smoke-pilot.ps1 -BaseUrl "https://api.staging.community.market"

# Production
.\scripts\smoke-pilot.ps1 -BaseUrl "https://api.community.market"

# With login
.\scripts\smoke-pilot.ps1 -LoginEmail "..." -LoginPassword "..."
```

| Doc                                                   | Purpose                          |
| ----------------------------------------------------- | -------------------------------- |
| [deploy.md](./deploy.md)                              | Deploy procedures                |
| [launch-checklist.md](../product/launch-checklist.md) | Full FR/NFR/legal inventory      |
| [troubleshooting.md](../troubleshooting.md)           | Local dev issues                 |
| [dev-credentials.md](../dev-credentials.md)           | Local/staging test accounts only |

---

## Decision log

| Date       | Decision                                                         |
| ---------- | ---------------------------------------------------------------- |
| 2026-06-27 | Pilot kickoff: infra before features; local smoke script added   |
| 2026-06-27 | Staging/prod DNS not live — Day 2–5 blocked until hosting chosen |
