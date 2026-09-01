# SellNearby pilot testing guide

> **Purpose:** One place for **what to test**, **what to expect**, **what differs by environment**, **what to do next**, and **which options matter** during closed pilot.  
> **Domain:** `https://sellnearby.ie` · **API:** `https://api.sellnearby.ie`  
> **Related:** [pilot-kickoff.md](./pilot-kickoff.md) · [pilot-vps-day-by-day.md](./pilot-vps-day-by-day.md) · [pilot-feedback.md](./pilot-feedback.md) · [launch-checklist.md](../product/launch-checklist.md) · [TESTING.md](../TESTING.md)

Use this document as the **manual QA script**. Use the day-by-day runbook for **infra setup**. Use the launch checklist for **ready / not ready** inventory.

---

## 1. How to use this guide

| Role | Use this for |
|------|----------------|
| Founder / ops | End-to-end checks before inviting external users; daily spot-checks during pilot |
| Developer | Local → staging → prod regression after deploy |
| Admin / moderator | Trust, refunds, disputes, verification queues |
| Pilot users | Not required — they use the product; you use §14 feedback |

**Pass rule for closed pilot:** every **Must** case in §6–§13 is green on **production** (or explicitly waived with a note).

**Symbols**

| Mark | Meaning |
|------|---------|
| **Must** | Blocker for inviting paying pilot users |
| **Should** | Strongly recommended before / during week 1 of pilot |
| **Nice** | Valuable; can wait if documented |
| **Out** | Not in pilot scope (do not fail the pilot on these) |

---

## 2. Environments — what differs

| Topic | Local (`pnpm dev`) | Staging (if any) | Production (`sellnearby.ie`) |
|-------|--------------------|------------------|------------------------------|
| Hosting | Docker infra + local API/web | Optional | OVH VPS + Docker Compose |
| Money | Stripe **test** keys + `stripe listen` | Stripe **test** | Stripe **live** (real cards) |
| Email | Often console / Brevo sandbox | Real transactional | Brevo + verified domain |
| Phone OTP | `OTP_PILOT_MODE=true` → codes in API logs | Same until SMS wired | Same until SMS wired |
| Media | Local disk or R2 | R2 staging bucket | R2 prod (`R2_PUBLIC_URL`) |
| Seed users | `pnpm seed:rbac` OK | Prefer real invites | **Do not** leave `RBAC_SEED_ENABLED=true` |
| Smoke script | `.\scripts\smoke-pilot.ps1` | `-BaseUrl https://api.staging…` | `-BaseUrl https://api.sellnearby.ie` |
| Risk if wrong | Low | Medium | High — refunds, reputation, legal |

**Pilot-relevant options (pick deliberately)**

| Option | Choices | Pilot recommendation |
|--------|---------|----------------------|
| Deploy path | Compose VPS · K8s · PaaS | **Compose on OVH** (current) |
| OTP | Pilot log codes · Real SMS (Twilio etc.) | **Pilot mode OK** for internal; wire SMS before wide invite |
| Stripe | Test · Live | **Test** until Connect + webhook proven; then **live** + tiny real purchase |
| Email | Brevo · SendGrid · none | **Brevo** (current runbook) |
| Images | Local uploads · R2 public · R2 custom domain | **R2** with public URL before image-heavy sellers |
| Keyword filters | `keywordFilters.enabled` true/false | **true** on prod for Ireland-safe catalog |
| Invite model | Open register · Manual approval · Invite link | **Invite / known cohort** for closed pilot |
| Observability | Logs only · + Grafana/Loki | Logs + health endpoints OK for small pilot |

---

## 3. Before you start (prep checklist)

### 3.1 Accounts & access

Prepare at least:

| Persona | Purpose |
|---------|---------|
| **Buyer A** | Browse, chat, purchase, refund request, dispute, favorites |
| **Seller B** | Storefront, listings, Connect, earnings, verification |
| **Admin** | Moderation, listing review, refunds, users |
| **Super-admin** | Platform settings, monetization, operators (as needed) |

Local bootstrap (dev only): see [dev-credentials.md](../dev-credentials.md).  
Prod: use real emails you control; never share seed passwords outside the team.

### 3.2 Tools

- [ ] Two browsers or one normal + one incognito (buyer vs seller)
- [ ] Access to VPS logs: `docker compose … logs api --tail=200`
- [ ] Stripe Dashboard (test and/or live)
- [ ] Email inbox for activation / notifications
- [ ] Phone for OTP (or API log grep in pilot mode)
- [ ] Smoke script from repo root

### 3.3 Health gate (always first)

```powershell
.\scripts\smoke-pilot.ps1 -BaseUrl "https://api.sellnearby.ie"
```

```bash
curl -s https://api.sellnearby.ie/api/health/ready
curl -s https://api.sellnearby.ie/api/health/queues
```

**Expect:** ready dependencies green; queues not stuck growing unbounded.  
**If fail:** stop feature testing; fix deploy / DB / Redis / Meili first ([troubleshooting](../troubleshooting.md), [ovh-vps-deploy](./ovh-vps-deploy.md)).

---

## 4. Test order (recommended)

Run in this order so later cases have data:

1. Health + smoke script  
2. Auth / registration / OTP  
3. Seller storefront + listing create (+ images)  
4. Admin listing approval / search visibility  
5. Prohibited content (hard/soft keywords)  
6. Chat  
7. Stripe Connect + purchase (+ webhook)  
8. Refund request + admin approve/reject  
9. Dispute path (manual or Stripe)  
10. Seller verification + fee behaviour  
11. Monetization add-ons (boost / featured) if enabling for pilot  
12. Admin trust actions (ban, report, categories)  
13. Ops spot-checks (backup note, support inbox)  
14. Feedback channels live  

---

## 5. Automated smoke (API)

| Step | Action | Expect | If differ / fail |
|------|--------|--------|------------------|
| 1 | `.\scripts\smoke-pilot.ps1 -BaseUrl "https://api.sellnearby.ie"` | Non-optional checks **PASS** | Inspect failing path; check Traefik, API container, Meili |
| 2 | Optional login: `-LoginEmail` / `-LoginPassword` | Auth endpoints succeed | Wrong password, OTP, or JWT/cookie config |
| 3 | Re-run after every prod deploy | Same green baseline | Treat as regression until green |

**Scope note:** Smoke covers health / browse / search / feeds — **not** full payments, refunds, or UI.

---

## 6. Authentication & accounts

| ID | What to test | Steps | Expect | Must/Should |
|----|--------------|-------|--------|-------------|
| A1 | Register | `/auth/register` → email + phone OTP | Account created; pilot banner if OTP pilot mode | Must |
| A2 | OTP delivery | Request code | **Pilot:** code in API logs (`dev code:`). **Live SMS:** SMS arrives | Must |
| A3 | Activation email | Complete register | Email from Brevo; link activates | Must (if email configured) |
| A4 | Login password | `/auth/login` | Session / JWT; land on account | Must |
| A5 | Login OTP (if used) | OTP challenge | Accepts valid code; rejects bad | Should |
| A6 | Profile | Update name, location, avatar | Saves; avatar URL from R2 | Should |
| A7 | Unified account | `/account` vs legacy `/seller`, `/buyer` | Legacy routes redirect; one account can buy & sell | Must |
| A8 | Logout / idle | Logout; wait past idle if testing | Session cleared | Nice |

**Options**

| Situation | What to do |
|-----------|------------|
| No SMS provider yet | Keep `OTP_PILOT_MODE=true` + `NEXT_PUBLIC_OTP_PILOT_MODE=true`; document log retrieval for testers |
| External users without log access | Wire SMS or share a support process to paste codes (not ideal) |
| Email not arriving | Check Brevo domain DNS, spam, `EMAIL_FROM`, API logs |

---

## 7. Seller: storefront & listings

| ID | What to test | Steps | Expect | Must/Should |
|----|--------------|-------|--------|-------------|
| L1 | Storefront required | Seller → Storefront: name, slug, location, contact | Public `/store/{slug}` loads | Must |
| L2 | Create draft | Create listing: category, title, price EUR, condition, collection | Saves as draft | Must |
| L3 | Images | Upload 1–10 photos (≤5 MB) | Thumbnails on detail; URLs on `R2_PUBLIC_URL` | Must |
| L4 | Submit / publish | Submit for review or activate per product rules | Status moves; appears after approval if gated | Must |
| L5 | Edit active | Change price/description | Updates; search eventually reflects | Must |
| L6 | Pause / end / sold | Mark sold or end | Removed from active browse appropriately | Should |
| L7 | Seller limits | Unverified seller creates many listings | Hits seller listing limit (default often 5) | Should |
| L8 | Renew / expiry | If listing near expiry | Renew works; expiry job doesn’t break catalog | Nice |

**Admin path (listing moderation)**

| ID | What to test | Expect |
|----|--------------|--------|
| L9 | Approve listing | Status `active`; visible logged-out |
| L10 | Reject listing | Seller sees rejected; not in public browse |

**Search / browse**

| ID | What to test | Expect |
|----|--------------|--------|
| L11 | Homepage / listings page | Active listing appears (allow short Meili lag) |
| L12 | Search by title keyword | Hit in results |
| L13 | Category filter | Correct subset |
| L14 | Geo / nearest (if used) | Sensible order or distance filter |

---

## 8. Prohibited content (haram / keyword filters)

Requires `keywordFilters.enabled = true` on prod (see [haram-enforcement-roadmap.md](../product/haram-enforcement-roadmap.md)).

| ID | What to test | Steps | Expect | Must/Should |
|----|--------------|-------|--------|-------------|
| H1 | Hard block | Create/save listing titled e.g. “Beer” / alcohol term | **400** with `PROHIBITED_*`; policy link; not saved | Must |
| H2 | Soft queue | Soft-term listing (e.g. perfume-related per config) | Goes to `pending_review` / review queue | Must |
| H3 | Restricted category | Category with `requiresReview` | Listing needs review before public | Should |
| H4 | Hidden category | Category `isHidden` | Not in public category picker | Should |
| H5 | Policy page | Open `/policies/prohibited-items` | Page loads; linked from create errors | Must |
| H6 | Image filename | Upload/source name with weapon heuristic | `IMAGE_FLAG_*` block or flag | Should |

**Vision (Phase E):** Out for pilot — do not expect image content AI detection.

---

## 9. Messaging

| ID | What to test | Steps | Expect | Must/Should |
|----|--------------|-------|--------|-------------|
| M1 | Open chat | Buyer on listing → message seller | Thread opens | Must |
| M2 | Real-time | Two browsers; send message | Appears without full refresh | Should |
| M3 | History | Reopen thread | Messages persist; read state OK | Must |
| M4 | Mobile reconnect | Mobile browser background/resume | Reconnects or recovers gracefully | Should |
| M5 | Push (FCM) | Background notification | **Out / Nice** — in-app is enough for pilot |

---

## 10. Payments, Connect, purchases

### 10.1 Seller Connect

| ID | What to test | Expect | Must/Should |
|----|--------------|--------|-------------|
| P1 | Start Connect | Seller → earnings / Connect onboarding | Stripe Express flow opens | Must |
| P2 | Complete onboarding | Finish Stripe requirements (test or live) | Seller payout-eligible | Must |
| P3 | Incomplete seller | Buyer tries to buy | Clear error / blocked checkout | Should |

### 10.2 Checkout

| ID | What to test | Steps | Expect | Must/Should |
|----|--------------|-------|--------|-------------|
| P4 | Test purchase | Buyer pays with `4242…` (test mode) | Payment `succeeded`; webhook processed | Must (staging/test) |
| P5 | Live micro purchase | Real €1–€5 card on prod | Same; then refund if desired | Must before wide invite |
| P6 | Buyer purchases UI | Account → Purchases | Payment listed | Must |
| P7 | Seller earnings | Seller earnings / ledger | Gross, fee, net visible | Must |
| P8 | Platform fee | Unverified vs verified seller | Default ~10% vs ~8% when verified | Should |
| P9 | Self-purchase | Seller buys own listing | Blocked | Must |
| P10 | Daily payment cap | Many buys same day | Cap error when exceeded | Nice |
| P11 | Failed card | Decline test card (Stripe docs) | `failed`; no false success | Should |

**Webhook events to confirm in Stripe Dashboard**

- Your account: `checkout.session.completed`, `payment_intent.succeeded`, `payment_intent.payment_failed`, `refund.created`, `charge.dispute.created`, `account.updated`, `transfer.created`  
- Connected: `payout.paid`, `payout.failed`  
- Endpoint: `https://api.sellnearby.ie/api/payments/webhooks/stripe`

**What differs**

| Mode | Card | Money | Refund |
|------|------|-------|--------|
| Stripe test | `4242…` | Fake | Instant via Dashboard / admin approve |
| Stripe live | Real card | Real EUR | Real bank timing after Stripe refund |

---

## 11. Refunds (implemented)

Refunds are **buyer request → admin approve/reject → Stripe full refund**. Not self-serve auto-refund; not partial.

| ID | What to test | Steps | Expect | Must/Should |
|----|--------------|-------|--------|-------------|
| R1 | Request | Buyer → Purchases → **Request refund** + reason | `PaymentRefund` `pending`; admin notified | Must |
| R2 | Duplicate request | Request again on same payment | Error: already exists | Should |
| R3 | Admin approve | Admin → Payments → Refunds → Approve | Stripe refund (or `re_dev_` in non-prod fallback); payment `refunded`; refund `processed`; ledger entries | Must |
| R4 | Admin reject | Reject with reason | Refund `rejected`; payment stays `succeeded` | Must |
| R5 | Non-buyer | Another user tries API refund | Forbidden | Nice |
| R6 | Notifications | Buyer/seller inboxes | Refund requested / processed messages | Should |

**Ops note:** Document who monitors pending refunds daily during pilot.

---

## 12. Disputes & trust

| ID | What to test | Steps | Expect | Must/Should |
|----|--------------|-------|--------|-------------|
| D1 | Report listing | Report from listing | Appears in admin moderation | Must |
| D2 | Buyer dispute UI | Account → Disputes create (if payment exists) | Dispute record; admin can open | Should |
| D3 | Stripe dispute webhook | (Optional) Stripe Dashboard dispute in test | Admin disputes list updates | Nice |
| D4 | Seller verification | Seller submits ID → admin approve | Verified badge / lower fee path | Should |
| D5 | Ban user | Admin bans buyer | Cannot pay / restricted | Must |
| D6 | Fraud / daily limits | Admin fraud views (if used) | Loads; no 500 | Nice |

---

## 13. Monetization (optional for early pilot)

Only test if you are selling these SKUs to pilot sellers.

| ID | What to test | Expect | Must/Should |
|----|--------------|--------|-------------|
| Z1 | Boost | Purchase boost → badge / ranking bump | Should if offered |
| Z2 | Featured | Homepage featured section | Should if offered |
| Z3 | Fast-track verification | Priority in admin queue | Nice |
| Z4 | Credits / wallet | Wallet page; earn/spend rules | Nice — listing GMV credit-split may still be limited |
| Z5 | Cashback grant | After purchase | Grant appears; cooling days noted | Nice |

**Out for pilot (do not block):** Apple/Google Pay, bank transfer, buyer-protection SKU automation, vision AI.

---

## 14. Admin & super-admin surfaces

| Area | What to test | Expect |
|------|--------------|--------|
| Dashboard | Stats load | No blank/error shell |
| Users | Search user, suspend/activate | Status enforced |
| Listing moderation | Queue actions | Status transitions |
| Seller verification | Pending / under review / rejected | Approve/reject works |
| Categories | `requiresReview` / `isHidden` flags | Public picker respects flags |
| Payments / refunds | Pending refunds tab | Approve/reject as §11 |
| Disputes | List + detail | Usable |
| Monetization settings | Save fee / SKU toggles | Persists |
| Governance | Support email, maintenance OFF | Saved |
| Search admin | Reindex if available | Completes without killing API |

---

## 15. Infrastructure & ops checks

| ID | What to test | Expect | Must/Should |
|----|--------------|--------|-------------|
| O1 | TLS | `https://sellnearby.ie` and API | Valid cert | Must |
| O2 | Ready probe | `/api/health/ready` | Dependencies OK | Must |
| O3 | Queues | `/api/health/queues` | Stable backlog | Must |
| O4 | After deploy | `vps-update.sh` + smoke | Green | Must |
| O5 | Support inbox | `support@sellnearby.ie` / `/contact` | Monitored | Must |
| O6 | Feedback form | Google Form linked | Submissions arrive | Should |
| O7 | Backup awareness | Know restore runbook | Documented owner | Should |
| O8 | Rollback awareness | Know Compose rollback | Documented | Should |

**Capacity (pilot):** comfortable ~1–2k members, ~50–150 concurrent, ~5–15k active listings on current Compose limits. See capacity canvas / scaling runbook if approaching those.

---

## 16. Pilot cohort testing (external users)

After internal matrix is green:

| Step | Action | Expect |
|------|--------|--------|
| 1 | Invite 10–20 known sellers + buyers (one area e.g. Dublin) | They can register and list |
| 2 | Share: site URL, support email, feedback form, OTP instructions if pilot mode | Clear onboarding |
| 3 | Day 3 check-in | At least one successful list or purchase attempt per active tester |
| 4 | Day 14 review | Feedback themes → product decisions ([pilot-feedback.md](./pilot-feedback.md)) |
| 5 | Daily admin | Moderation, verification, refunds queues empty or SLA’d | |

**Tell testers explicitly**

- Real money only when Stripe **live** is on  
- Refunds need admin approval  
- Prohibited items policy applies  
- How to get OTP codes if SMS not live  

---

## 17. Pass / fail & what to do

| Result | Meaning | Next action |
|--------|---------|-------------|
| **Pass** | Expectation met | Tick case; move on |
| **Fail — infra** | 5xx, health red, images 404, webhooks unsigned | Fix env/deploy; re-run smoke |
| **Fail — product** | Wrong status, missing UI, fee wrong | File bug with steps + screenshot + user role |
| **Fail — config** | Email/OTP/Stripe keys | Fix `.env.prod`, recreate containers, retest |
| **Waive** | Known gap (e.g. FCM) | Write waiver in pilot notes; must not be a Must case |

**Minimum green before first external paying user**

- [ ] Smoke script green on prod  
- [ ] Register + login + OTP path understood  
- [ ] Listing with images live publicly  
- [ ] Connect + one succeeded payment + webhook  
- [ ] Refund approve path tested once  
- [ ] Hard keyword block works  
- [ ] Support + feedback channels live  
- [ ] Beta Terms / Privacy available (legal pack as far as solicitor requires)  

---

## 18. Sign-off sheet (copy per release)

| Field | Value |
|-------|-------|
| Date | |
| Environment | local / staging / **prod** |
| Build / commit | |
| Tester | |
| Stripe mode | test / live |
| OTP mode | pilot / SMS |
| Must cases failed | none / list IDs |
| Waivers | |
| Ready to invite users? | Yes / No |

---

## 19. Quick reference — URLs & commands

| Item | Value |
|------|-------|
| Web | https://sellnearby.ie |
| API health | https://api.sellnearby.ie/api/health/ready |
| Admin | https://sellnearby.ie/admin/dashboard |
| Super-admin | https://sellnearby.ie/super-admin/dashboard |
| Account | https://sellnearby.ie/account |
| Prohibited policy | https://sellnearby.ie/policies/prohibited-items |
| Stripe webhook | `https://api.sellnearby.ie/api/payments/webhooks/stripe` |

```powershell
# Smoke
.\scripts\smoke-pilot.ps1 -BaseUrl "https://api.sellnearby.ie"

# OTP code from VPS (pilot mode)
docker compose -f docker-compose.prod.yml --env-file .env.prod logs api --tail=200 | grep "dev code"
```

---

## 20. Related documents

| Doc | When to open it |
|-----|-----------------|
| [pilot-vps-day-by-day.md](./pilot-vps-day-by-day.md) | Setting up R2, email, Stripe on VPS |
| [pilot-kickoff.md](./pilot-kickoff.md) | Week-by-week pilot launch order |
| [pilot-feedback.md](./pilot-feedback.md) | Form questions, invite email, check-ins |
| [launch-checklist.md](../product/launch-checklist.md) | Pilot vs public readiness inventory |
| [docs/api/payments.md](../api/payments.md) | Refund / webhook API detail |
| [haram-enforcement-roadmap.md](../product/haram-enforcement-roadmap.md) | Keyword / category safety |
| [TESTING.md](../TESTING.md) | Automated Vitest / seed |
| [scaling.md](./scaling.md) | When load grows past pilot |

---

## Changelog

| Date | Change |
|------|--------|
| 2026-07-30 | Initial comprehensive pilot testing guide (manual matrix + env differences + refunds/haram) |
