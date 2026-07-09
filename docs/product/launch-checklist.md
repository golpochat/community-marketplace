# Launch Readiness Checklist

> **As of:** 2026-06-27 · **App version:** 0.1.0 (pre-1.0)  
> **Related:** [functional-requirements.md](./functional-requirements.md) · [non-functional-requirements.md](./non-functional-requirements.md) · [master-blueprint-v1.md](./master-blueprint-v1.md) · [deployment runbook](../runbooks/deploy.md)

Single canonical checklist for **closed pilot** vs **public Ireland launch**. Tick items as you complete them.

> **Ready to start?** Follow the step-by-step runbook: [pilot-kickoff.md](../runbooks/pilot-kickoff.md) · Smoke test: `.\scripts\smoke-pilot.ps1`

---

## How to read this document

### Status symbols (implementation)

| Symbol | Meaning |
|--------|---------|
| ✅ | Done in codebase (may still need prod config) |
| ⚠️ | Partial, stub, or pilot-only with manual workaround |
| ❌ | Missing or blocker for that launch tier |
| 📋 | Planned (blueprint / roadmap — not required for first launch) |

### Launch tiers

| Column | Meaning |
|--------|---------|
| **Pilot** | Closed beta — invite-only, real money OK, manual ops acceptable |
| **Public** | Open Ireland launch — legal, safety, and ops must be solid |

### Executive verdict

| Launch type | Ready this month? | What's missing |
|-------------|-------------------|----------------|
| **Local / demo** | ✅ Yes | — |
| **Closed pilot** (50–500 users) | ⚠️ ~70% | Prod deploy, Stripe live, real email, basic legal, support playbook |
| **Public launch** | ❌ ~45% | Lawyer-reviewed legal pack, safety automation, GDPR tooling, observability hardening |

---

## 1. Functional requirements (FR)

### FR-1 — User management

| ID | Feature | Sub-features | Pilot | Public | Status |
|----|---------|--------------|-------|--------|--------|
| FR-1.1 | Registration | Email + password, profile fields | Must | Must | ✅ |
| FR-1.2 | Login | Password + OTP | Must | Must | ✅ |
| FR-1.3 | Email activation | Activation link, resend | Should | Must | ⚠️ Code ✅; needs **SendGrid + domain** in prod |
| FR-1.4 | Profile | Name, avatar, bio, location, phone | Must | Must | ✅ (+ R2 uploads) |
| FR-1.5 | Identity verification | ID docs, selfie, admin review | Should | Must | ✅ Seller verification flow |
| FR-1.6 | Account status | Suspend / activate / ban | Must | Must | ✅ Admin + moderation |
| — | Account deletion | GDPR right to erasure | Nice | Must | ❌ Not built |
| — | Data export | GDPR portability | Nice | Must | ❌ Not built |
| — | Cookie consent | EU cookie banner | Nice | Must | ❌ Not verified |

**Pilot checklist**

- [ ] Registration + login smoke-tested on prod
- [ ] SendGrid configured; activation emails deliver
- [ ] Seller verification flow tested end-to-end

**Public checklist**

- [ ] Email activation enforced before sensitive actions
- [ ] Account deletion + data export implemented
- [ ] Cookie consent banner + policy published

---

### FR-2 — Listings

| ID | Feature | Sub-features | Pilot | Public | Status |
|----|---------|--------------|-------|--------|--------|
| FR-2.1 | Listing CRUD | Create, edit, delete, seller dashboard | Must | Must | ✅ |
| FR-2.2 | Browse | Homepage, category, pagination | Must | Must | ✅ |
| FR-2.3 | Listing metadata | Categories, images, condition, price, location | Must | Must | ✅ |
| FR-2.4 | Lifecycle | Draft → active → sold → expired → renew | Must | Must | ✅ (+ expiry jobs) |
| FR-2.5 | Admin listing review | Approve / reject / moderation queue | Should | Must | ✅ |
| — | Image upload | Presigned R2 URLs | Must | Must | ✅ (needs **R2 prod bucket**) |
| — | Featured / boosted | Paid visibility | Nice | Should | ✅ Monetization live |
| — | Share links | Short URLs, share analytics | Nice | Nice | ✅ |
| — | Seller storefront | Public `/store/[slug]` | Should | Must | ✅ |
| — | Favorites / saved | Buyer saved listings | Nice | Should | ✅ |
| — | Reviews | Buyer ↔ seller reviews | Nice | Should | ✅ |
| — | Full category tree | Blueprint v1 hierarchy | Nice | Must | ⚠️ Dev 8-category seed only |
| — | Prohibited category blocklist | Haram / restricted categories | Nice | Must | ❌ Blueprint only |
| — | Keyword filter (hard/soft) | Auto-flag on create | Nice | Must | ❌ Not in API |
| — | Urgent badge / auto-refresh | Paid add-ons | 📋 | 📋 | ❌ Priced, not built |

**Pilot checklist**

- [ ] R2 prod bucket + public URL configured
- [ ] Create listing with images works on prod
- [ ] Listing expiry / renew job verified

**Public checklist**

- [ ] Full category tree migrated from blueprint
- [ ] Keyword filters + prohibited category enforcement live
- [ ] Public prohibited-items policy linked at listing create

---

### FR-3 — Messaging

| ID | Feature | Sub-features | Pilot | Public | Status |
|----|---------|--------------|-------|--------|--------|
| FR-3.1 | Listing chat | Open thread from listing | Must | Must | ✅ |
| FR-3.2 | Real-time delivery | WebSocket gateway | Should | Must | ✅ |
| FR-3.3 | History | Paginated messages, read state | Must | Must | ✅ |
| FR-3.4 | Push for messages | FCM mobile/web push | Nice | Should | ⚠️ FCM stubbed; in-app ✅ |
| — | Message moderation | Admin message review | Should | Must | ✅ |
| — | Priority messaging SKU | Paid inbox pin | 📋 | 📋 | ❌ Phase 4 |

**Pilot checklist**

- [ ] Chat open from listing detail on prod
- [ ] WebSocket reconnect tested on mobile browser

**Public checklist**

- [ ] FCM push notifications production-ready (or documented as in-app only)

---

### FR-4 — Payments

| ID | Feature | Sub-features | Pilot | Public | Status |
|----|---------|--------------|-------|--------|--------|
| FR-4.1 | Card checkout | Stripe PaymentIntent, buyer UI | Must | Must | ✅ (needs **Stripe live**) |
| FR-4.2 | Seller Connect | Express onboarding, payout eligibility | Must | Must | ✅ |
| FR-4.3 | Payment history | Buyer purchases, seller earnings | Must | Must | ✅ |
| FR-4.4 | Payment notifications | In-app + email on success/fail | Should | Must | ⚠️ In-app ✅; email needs SendGrid |
| — | Webhooks | `payment_intent.succeeded`, refunds, disputes | Must | Must | ✅ |
| — | Platform fee | 10% default, 8% verified | Must | Must | ✅ |
| — | Fraud limits | Daily payment cap, self-purchase block | Must | Must | ✅ |
| — | Refunds | Admin / dispute-driven | Should | Must | ⚠️ Webhook path exists; ops playbook needed |
| — | Disputes module | Buyer/seller dispute CRUD | Should | Must | ✅ UI + API |
| — | Buyer protection SKU | Optional checkout add-on | 📋 | 📋 | ❌ Phase 5 (legal gate) |
| — | Wallet spend at checkout | Credits + card split | 📋 | 📋 | ❌ Phase 2 |
| — | Apple Pay / Google Pay | Express checkout | 📋 | Nice | ❌ Phase 7+ |
| — | Bank transfer | Off-card payments | 📋 | 📋 | ❌ Explicitly out of v1 |

**Pilot checklist**

- [ ] Stripe **live** mode enabled
- [ ] Connect onboarding completes for test seller on prod
- [ ] End-to-end purchase + webhook + seller payout path verified
- [ ] Stripe webhook endpoint registered on prod URL
- [ ] Internal refund / dispute playbook written

**Public checklist**

- [ ] Public refund & dispute policy published
- [ ] Payment failure / refund emails deliver via SendGrid

---

### FR-5 — Search

| ID | Feature | Sub-features | Pilot | Public | Status |
|----|---------|--------------|-------|--------|--------|
| FR-5.1 | Full-text search | Meilisearch index | Must | Must | ✅ |
| FR-5.2 | Relevance ranking | Boosted/featured sort | Should | Must | ✅ |
| FR-5.3 | Auto-index | On listing create/update | Must | Must | ✅ |
| — | Faceted filters | Price, category, condition | Nice | Should | ⚠️ Basic; geo/facets 📋 roadmap |
| — | Autocomplete | Search suggestions | Nice | Should | ⚠️ Partial |
| — | Admin reindex | Full rebuild tool | Should | Must | ✅ |

**Pilot checklist**

- [ ] Meilisearch prod instance secured (master key)
- [ ] New listing appears in search within expected latency

---

### FR-6 — Moderation & trust

| ID | Feature | Sub-features | Pilot | Public | Status |
|----|---------|--------------|-------|--------|--------|
| FR-6.1 | User reports | Report listing / user / message | Must | Must | ✅ |
| FR-6.2 | Report queue | Admin resolve / dismiss | Must | Must | ✅ |
| FR-6.3 | Bans | Temp / permanent, appeals | Must | Must | ✅ |
| — | Listing moderation | Pending review, hard reject | Should | Must | ✅ |
| — | Fraud dashboard | Admin fraud tools | Should | Must | ✅ |
| — | Violation score | Points + thresholds | Nice | Should | ❌ Blueprint only |
| — | Image vision flags | Auto-detect prohibited images | Nice | Should | ❌ Stub in blueprint |
| — | Escalation queue | Separate assignee filter | Nice | Should | ⚠️ Partial |
| — | Public prohibited-items page | `/policies/prohibited-items` | Nice | Must | ❌ Not built |
| — | Haram catalog enforcement | Category + keyword + admin | Nice | Must | ❌ Policy in docs only |

**Pilot checklist**

- [ ] Report → admin queue → action tested once
- [ ] Moderation staffing assigned (who watches queue daily)

**Public checklist**

- [ ] Prohibited items policy page live
- [ ] Keyword / category enforcement implemented
- [ ] Appeal process documented in community rules

---

### FR-7 — Administration

| ID | Feature | Sub-features | Pilot | Public | Status |
|----|---------|--------------|-------|--------|--------|
| FR-7.1 | Dashboard | Users, listings, reports, revenue stats | Must | Must | ✅ |
| FR-7.2 | User & listing mgmt | Search, edit, suspend | Must | Must | ✅ |
| FR-7.3 | Audit log | Timestamped admin actions | Should | Must | ✅ |
| — | RBAC | Roles, permissions, super-admin | Must | Must | ✅ |
| — | Seller verification queue | Approve / reject / force reverify | Must | Must | ✅ |
| — | Fast-track priority | Paid queue bump | Nice | Should | ✅ |
| — | Monetization hub | Fees, cashback, SKU pricing, ledger | Must | Must | ✅ |
| — | Price / delivery reviews | Admin review workflows | Nice | Should | ✅ |
| — | Notifications broadcast | Admin → user notifications | Should | Must | ✅ |

**Pilot checklist**

- [ ] `RBAC_SEED_ENABLED=false` in production
- [ ] Admin accounts use strong passwords + MFA on GitHub/email
- [ ] Super-admin access limited to founders

---

### FR-8 — Monetization (blueprint)

| Feature | Sub-features | Pilot | Public | Status |
|---------|--------------|-------|--------|--------|
| Platform fee + cashback | 10%/8%, 1.5% earn-only wallet | Must | Must | ✅ |
| Listing boosts | 7d/30d, Stripe, badge, ranking | Nice | Should | ✅ |
| Featured slots | Homepage/category, caps, expiry | Nice | Should | ✅ |
| Fast-track verification | €2.99, priority queue | Nice | Should | ✅ |
| Wallet spend | Credits → boosts / early unlock | 📋 | 📋 | ❌ Phase 2 |
| Buyer micro-SKUs | Early unlock, alerts, wanted ads | 📋 | 📋 | ❌ Phase 4 |
| Seller packages | Starter / Pro / Premium bundles | 📋 | 📋 | ❌ Phase 6 |

**Pilot checklist**

- [ ] Boost + featured Stripe live purchase tested once
- [ ] Cashback grant appears on buyer wallet after card purchase

---

### FR-9 — Notifications

| Feature | Sub-features | Pilot | Public | Status |
|---------|--------------|-------|--------|--------|
| In-app notifications | Bell, read/unread, types | Must | Must | ✅ |
| Email (transactional) | Activation, payment, verification | Must | Must | ⚠️ SendGrid wired; prod keys + templates |
| Push (FCM) | Mobile / PWA push | Nice | Should | ❌ Stub |
| Seller verification nudge | Force-reverify notification | Must | Must | ✅ |

---

## 2. Non-functional requirements (NFR)

### Performance

| ID | Requirement | Target | Pilot | Public | Status |
|----|-------------|--------|-------|--------|--------|
| NFR-P1 | API p95 read | < 200 ms | Should | Must | ⚠️ Not load-tested |
| NFR-P2 | API p95 write | < 500 ms | Should | Must | ⚠️ Not load-tested |
| NFR-P3 | WebSocket latency | < 100 ms | Nice | Should | ⚠️ Not measured |
| NFR-P4 | Search p95 | < 150 ms | Should | Must | ⚠️ Not measured |
| NFR-P5 | Lighthouse score | ≥ 85 | Nice | Must | ⚠️ Not verified on prod |

- [ ] Baseline load test on staging (pilot)
- [ ] Lighthouse audit on prod homepage (public)

### Scalability

| ID | Requirement | Target | Pilot | Public | Status |
|----|-------------|--------|-------|--------|--------|
| NFR-S1 | Concurrent users | 10,000 | — | Must | ⚠️ HPA manifests exist; not proven |
| NFR-S2 | Horizontal scaling | 2–10 pods | Nice | Must | ✅ K8s HPA defined |
| NFR-S3 | Listing catalog | 1M+ | — | Must | ⚠️ Architecture supports; untested |
| NFR-S4 | Search index | 1M+ docs | — | Must | ⚠️ Meilisearch; untested at scale |

### Availability & reliability

| ID | Requirement | Target | Pilot | Public | Status |
|----|-------------|--------|-------|--------|--------|
| NFR-A1 | Uptime SLA | 99.9% | Nice | Must | ❌ No SLA / status page yet |
| NFR-A2 | RPO | < 1 hour | Must | Must | ⚠️ Backup scripts exist; schedule unverified |
| NFR-A3 | RTO | < 4 hours | Should | Must | ⚠️ Runbook exists; not drilled |
| NFR-A4 | Health checks | All services | Must | Must | ✅ `/health/live`, `/ready`, `/queues` |

- [ ] Scheduled Postgres backups configured
- [ ] Backup restore drill completed ([restore-backup runbook](../runbooks/restore-backup.md))
- [ ] Rollback drill completed ([rollback runbook](../runbooks/rollback.md))
- [ ] Public status page live (public launch)

### Security

| ID | Requirement | Target | Pilot | Public | Status |
|----|-------------|--------|-------|--------|--------|
| NFR-SEC1 | TLS everywhere | HTTPS only | Must | Must | ⚠️ Traefik/K8s; needs prod certs |
| NFR-SEC2 | JWT expiry | 15 min | Must | Must | ✅ |
| NFR-SEC3 | Password min length | 8 chars | Must | Must | ✅ |
| NFR-SEC4 | OTP rate limit | 5 / 10 min | Must | Must | ✅ |
| NFR-SEC5 | Admin IP allowlist | Traefik middleware | Nice | Must | ⚠️ Config exists; enable in prod |
| NFR-SEC6 | Secrets management | K8s secrets / vault | Must | Must | ⚠️ GitHub secrets + K8s; audit needed |
| NFR-SEC7 | OWASP Top 10 | Required | Should | Must | ⚠️ No formal pen test |
| — | Stripe webhook signature verify | Required | Must | Must | ✅ |
| — | RBAC seed disabled in prod | Required | Must | Must | ✅ `RBAC_SEED_ENABLED=false` |
| — | CORS locked to prod domains | Required | Must | Must | ⚠️ Config via env |

- [ ] All prod secrets rotated from dev defaults
- [ ] `JWT_SECRET` strong and unique in prod
- [ ] CORS_ORIGIN set to prod web URL only
- [ ] Admin IP allowlist enabled (public launch)
- [ ] Dependency / CVE scan policy in place

### Maintainability

| ID | Requirement | Pilot | Public | Status |
|----|-------------|-------|--------|--------|
| NFR-M1 | pnpm monorepo | ✅ | ✅ | ✅ |
| NFR-M2 | TypeScript strict | ✅ | ✅ | ✅ |
| NFR-M3 | API docs | Should | Must | ⚠️ Markdown docs; OpenAPI partial |
| NFR-M4 | IaC | Must | Must | ✅ Docker + K8s overlays |

### Accessibility & UX

| ID | Requirement | Pilot | Public | Status |
|----|-------------|-------|--------|--------|
| NFR-U1 | WCAG AA | Nice | Must | ⚠️ Not audited |
| NFR-U2 | PWA installable | Nice | Should | ✅ next-pwa + manifest |
| NFR-U3 | Mobile responsive | Must | Must | ✅ |

### Observability

| ID | Requirement | Pilot | Public | Status |
|----|-------------|-------|--------|--------|
| NFR-O1 | Structured logging (Pino JSON) | Must | Must | ✅ |
| NFR-O2 | Distributed tracing (OTEL) | Nice | Should | ⚠️ Optional env; not fully wired |
| NFR-O3 | Error tracking (Sentry) | Should | Must | ❌ Not integrated |
| NFR-O4 | Metrics (Prometheus + Grafana) | Should | Must | ⚠️ `/api/metrics` ✅; dashboards TBD |

- [ ] Sentry (or equivalent) connected to prod API + web
- [ ] Grafana dashboards for error rate, latency, queue depth
- [ ] Alert rules configured (error spike, queue backlog, disk)

---

## 3. Automation & background jobs

| Area | What | Pilot | Public | Status |
|------|------|-------|--------|--------|
| **CI** | Lint, typecheck, build, Docker image | Must | Must | ✅ `build.yml` |
| **CD dev** | Auto deploy on `develop` | Must | Must | ✅ |
| **CD staging** | Auto deploy on `main` | Must | Must | ✅ |
| **CD prod** | Manual workflow + confirm | Must | Must | ✅ `deploy-prod.yml` |
| **DB migrations** | `prisma migrate deploy` in pipeline | Must | Must | ✅ |
| **Listing expiry** | Cron / BullMQ job | Must | Must | ✅ |
| **Boost expiry** | Remove ranking bump | Must | Must | ✅ |
| **Featured expiry** | Remove from featured feeds | Must | Must | ✅ |
| **Cashback unlock** | Scheduled grant unlock | Must | Must | ✅ |
| **Search reindex** | On listing change + admin full reindex | Must | Must | ✅ |
| **Email sending** | SendGrid via notification service | Must | Must | ⚠️ Needs prod API key |
| **Stripe webhooks** | Payment + platform purchase fulfillment | Must | Must | ✅ |
| **DB backups** | Scheduled Postgres (+ R2 optional) | Must | Must | ⚠️ Scripts exist; cron TBD |
| **Automated tests in CI** | Unit / integration / E2E | Should | Must | ❌ CI has no test job |
| **Smoke tests post-deploy** | Login, checkout, health | Should | Must | ⚠️ Manual in runbook |
| **Alerting** | Error rate, queue depth, disk | Should | Must | ❌ Grafana alerts TBD |
| **Dependabot / security scan** | CVE monitoring | Nice | Must | ⚠️ Verify GitHub settings |

- [ ] GitHub Actions secrets complete for target environment
- [ ] Post-deploy smoke checklist in [deploy runbook](../runbooks/deploy.md) executed
- [ ] Backup cron scheduled on prod Postgres
- [ ] CI test job added (public launch target)

---

## 4. Tools & third-party services

| Tool | Purpose | Pilot | Public | Setup checklist |
|------|---------|-------|--------|-----------------|
| **Stripe** | Connect + card payments + webhooks | Must | Must | See below |
| **SendGrid** | Transactional email | Must | Must | See below |
| **Cloudflare R2** | Listing + avatar media | Must | Must | See below |
| **PostgreSQL** | Primary DB | Must | Must | See below |
| **Redis** | Cache + BullMQ | Must | Must | See below |
| **Meilisearch** | Search index | Must | Must | See below |
| **Kubernetes / Docker** | Runtime | Must | Must | See below |
| **Traefik / ingress** | TLS + routing | Must | Must | See below |
| **GitHub Actions** | CI/CD | Must | Must | See below |
| **Domain + DNS** | Production domains | Must | Must | See below |
| **FCM / Firebase** | Push notifications | Nice | Should | ❌ Not production-ready |
| **Sentry** | Error tracking | Should | Must | ❌ Not set up |
| **Grafana + Prometheus** | Metrics & alerts | Should | Must | ⚠️ Partial |
| **OpenAI** (optional) | Embeddings / future AI mod | Nice | Nice | Optional |
| **Stripe CLI** | Dev webhook testing | Dev only | — | ✅ For local QA |

### Stripe

- [ ] Live mode enabled
- [ ] Connect platform profile complete
- [ ] Webhook endpoint on prod API URL
- [ ] Webhook signing secret in prod env
- [ ] Payout schedule and business verification complete
- [ ] Test purchase on live mode (small amount)

### SendGrid

- [ ] API key in prod secrets
- [ ] Domain authentication (SPF / DKIM)
- [ ] `EMAIL_FROM` address verified
- [ ] Activation email delivers to inbox (not spam)

### Cloudflare R2

- [ ] Production bucket created
- [ ] `R2_PUBLIC_URL` configured
- [ ] CORS allows prod web origin
- [ ] Upload + display tested on prod

### Data & search

- [ ] Managed Postgres with automated backups
- [ ] Redis with no eviction of BullMQ keys
- [ ] Meilisearch master key secured; not exposed publicly

### Infrastructure

- [ ] Staging deploy verified end-to-end
- [ ] Production deploy via manual workflow
- [ ] TLS certificates valid for web + API domains
- [ ] All GitHub Actions secrets set for prod

### Domain & DNS

- [ ] Web app domain (e.g. `www.…`)
- [ ] API domain (e.g. `api.…`)
- [ ] Assets domain (R2 public URL or CDN)

---

## 5. Legal & compliance documentation

| Document | Pilot minimum | Public launch | Current status |
|----------|---------------|---------------|----------------|
| **Terms of Service** | Short beta terms (solicitor-reviewed) | Full Ireland consumer terms | ⚠️ Stub page only |
| **Privacy Policy** | GDPR-aligned draft | Full policy + DPA with processors | ⚠️ Stub page only |
| **Community Rules** | Published + enforced | Same + appeal process | ⚠️ Basic page ✅ |
| **Prohibited Items Policy** | Required for trust brand | Public + linked at listing create | ❌ Blueprint only |
| **Cookie Policy** | If analytics used | Banner + policy | ❌ |
| **Seller Agreement** | Stripe Connect ToS + platform seller terms | Formal seller terms | ⚠️ Implicit only |
| **Buyer checkout disclosures** | Platform fee, cashback, no escrow disclaimer | Same + refund policy | ⚠️ Partial in UI |
| **Cashback program terms** | Earn rules, expiry, caps | Legal wording on wallet page | ⚠️ UI copy; legal review needed |
| **Refund & dispute policy** | Manual ops doc (internal) | Public-facing | ⚠️ Disputes UI ✅; policy ❌ |
| **GDPR** | Privacy contact + basic lawful basis | DPO/contact, ROPA, DPIA, erasure/export | ❌ No tooling |
| **PCI** | Stripe-hosted (SAQ A) | Same | ✅ Card data not stored |
| **VAT / tax** | Accountant advice for Ireland | Invoice / VAT registration if required | ❌ Business decision |
| **Age restriction** | 18+ if needed for certain categories | Terms clause | ⚠️ Not explicit |
| **Insurance** | Optional for pilot | Public liability / cyber | ❌ Business decision |
| **Stripe Connect compliance** | KYC via Stripe | Ongoing monitoring | ⚠️ Stripe handles KYC |

**Pilot legal minimum**

- [ ] Solicitor-reviewed beta Terms of Service
- [ ] Solicitor-reviewed Privacy Policy (GDPR baseline)
- [ ] Privacy contact email published
- [ ] Internal dispute / refund playbook

**Public legal minimum**

- [ ] Full Terms, Privacy, Cookie, Prohibited Items policies published
- [ ] Cookie consent implemented
- [ ] GDPR account deletion + data export
- [ ] Processor list (Stripe, SendGrid, R2) documented in Privacy Policy
- [ ] VAT / tax position confirmed with accountant

---

## 6. Business & operations (non-code)

| Item | Pilot | Public | Notes |
|------|-------|--------|-------|
| **Business entity registered** (Ireland) | Must | Must | Ltd / sole trader |
| **Business bank account** | Must | Must | For Stripe reconciliation |
| **Stripe platform account** (live) | Must | Must | Connect platform profile complete |
| **Support email / contact** | Must | Must | `/contact` page exists |
| **Support SLA** (internal) | 24–48h manual | Published response times | ❌ |
| **Dispute playbook** | Internal doc | Staff-trained | ⚠️ Use admin disputes UI manually |
| **Moderation staffing** | Founder + admin | Rotating coverage | Manual queue OK for pilot |
| **Incident response** | Runbooks read | On-call rotation | ⚠️ Runbooks ✅ |
| **Status page** | Nice | Must | ❌ |
| **Beta invite process** | Waitlist / codes | — | Your choice |
| **Marketing / SEO** | Minimal | Full | ✅ Phases 0–4 coded — [deploy checklist](./seo-audit.md#part-11--production-deploy-checklist-seo) + [monthly SEO ops](./seo-operations.md) + GSC/GA4 manual |
| **App distribution** | PWA | PWA (+ native later) | PWA ✅ |

- [ ] Irish business entity registered
- [ ] Business bank account linked to Stripe
- [ ] Support inbox monitored daily during pilot
- [ ] Moderation queue owner assigned
- [ ] Beta invite / waitlist process defined

---

## 7. Pre-launch smoke test matrix

Run on **staging**, then **production** after each deploy. See also [troubleshooting](../troubleshooting.md).

### Authentication & users

- [ ] Register → activation email → activate → login
- [ ] OTP login works
- [ ] Profile update + avatar upload to R2

### Listings & search

- [ ] Create listing with images → appears in browse + search
- [ ] Edit / mark sold / renew expired listing
- [ ] Boost purchase → badge + ranking bump
- [ ] Featured purchase → homepage featured section

### Commerce

- [ ] Seller completes Stripe Connect onboarding
- [ ] Buyer pays for listing → webhook → payment succeeded
- [ ] Seller sees earnings; buyer sees purchase + cashback grant
- [ ] Refund or dispute path tested manually once

### Trust

- [ ] Seller submits verification → admin approves → 8% fee applied
- [ ] Fast-track purchase → priority in admin queue
- [ ] Report listing → appears in admin moderation

### Admin

- [ ] Dashboard loads stats
- [ ] Ban user → user cannot pay
- [ ] Audit log records action
- [ ] Monetization settings save

### Infrastructure

- [ ] `GET /api/health/ready` all dependencies green
- [ ] `GET /api/health/queues` stable backlog
- [ ] Backup restore drill completed
- [ ] Rollback drill completed

---

## 8. Recommended launch paths

### Path A — Closed pilot (target: 2–3 weeks)

**Must complete before first paying user:**

1. [ ] Production deploy verified (staging → prod)
2. [ ] Stripe **live** + webhooks on prod URL
3. [ ] SendGrid + domain authentication
4. [ ] R2 prod bucket for images
5. [ ] Solicitor-reviewed **beta Terms + Privacy**
6. [ ] Internal dispute + moderation playbook
7. [ ] `RBAC_SEED_ENABLED=false`, secrets rotated, TLS live
8. [ ] Section 7 smoke test matrix green on prod

**Acceptable gaps for pilot:** FCM push, keyword automation, full category tree, wallet spend, automated E2E tests, status page.

---

### Path B — Public Ireland launch (target: 6–10 weeks after pilot)

**Add on top of pilot:**

1. [ ] Full legal pack (Terms, Privacy, Prohibited Items, Cookie, refunds)
2. [ ] Keyword + category safety enforcement (blueprint §6–7)
3. [ ] Full category tree migration
4. [ ] GDPR: account deletion + data export
5. [ ] Sentry + Grafana alerts + status page
6. [ ] Load test to NFR targets
7. [ ] WCAG accessibility pass
8. [ ] Remove all stub / “coming soon” legal copy
9. [ ] 2–4 weeks pilot learnings incorporated

---

## 9. Quick scorecard

| Area | Pilot readiness | Public readiness |
|------|-----------------|------------------|
| Core marketplace (list, chat, search) | **90%** | **85%** |
| Payments & monetization | **85%** | **80%** |
| Admin & moderation | **85%** | **80%** |
| Legal & compliance | **25%** | **15%** |
| Safety automation (haram/keywords) | **10%** | **10%** |
| NFR (perf, scale, observability) | **40%** | **35%** |
| Automation (CI/CD, backups, alerts) | **60%** | **50%** |
| **Overall** | **~70%** | **~45%** |

---

## 10. Decision log

| Date | Decision | Notes |
|------|----------|-------|
| 2026-06-27 | Checklist created | Consolidates FR/NFR, tools, legal, ops for pilot vs public launch |
| 2026-06-27 | Pilot before public | Closed beta with manual ops acceptable; public blocked on legal + safety automation |

---

## Related docs

- [SEO audit & enterprise roadmap](./seo-audit.md)
- [SEO keyword priority & monthly checklist](./seo-operations.md)
- [Deploy runbook](../runbooks/deploy.md)
- [Rollback runbook](../runbooks/rollback.md)
- [Restore backup runbook](../runbooks/restore-backup.md)
- [Troubleshooting](../troubleshooting.md)
- [Local development](../onboarding/local-development.md)
- [Dev credentials](../dev-credentials.md) (local/staging only — never use in prod)
