# Path A → ops cash BEP checklist

Executable week-0 checklist before inviting paying sellers. Goal after this: **first live card fee**, then [concierge GTM](./pilot-concierge-gtm.md) until ops cash BEP (~€550–€1,100 card GMV/mo).

**Related:** [launch-checklist Path A](../product/launch-checklist.md#path-a--closed-pilot-target-2-3-weeks) · [ovh-vps-deploy.md](./ovh-vps-deploy.md) · [pilot-vps-day-by-day.md](./pilot-vps-day-by-day.md) · [pilot-kickoff.md](./pilot-kickoff.md)

---

## BEP definition (do not redefine)

| Level | Meaning |
|-------|---------|
| **Ops cash BEP** | Monthly platform **fee** ≥ lean burn (~€50–€100/mo) |
| **Not BEP** | Living wage, €95k/year, or featured SKU revenue |

---

## 1. Deploy latest main

```bash
cd /opt/sellnearby
./infra/scripts/vps-update.sh
```

Confirm commit includes Card pay unavailable / commerce-trust work.

- [ ] Deploy finished without compose errors
- [ ] `https://sellnearby.ie` and `https://api.sellnearby.ie/health` (or project health route) respond

---

## 2. Stripe live + webhooks

In `infra/docker/.env.prod` (or compose env):

- [ ] `STRIPE_SECRET_KEY` = **live** `sk_live_…` (not test)
- [ ] `STRIPE_PUBLISHABLE_KEY` = **live** `pk_live_…`
- [ ] `STRIPE_WEBHOOK_SECRET` matches endpoint on **https://api.sellnearby.ie/...** (payments webhook path from [payments API](../api/payments.md))
- [ ] Stripe Connect platform onboarding complete in **live** mode
- [ ] Restart API after env change

---

## 3. SendGrid + domain

- [ ] `SENDGRID_API_KEY` set in prod
- [ ] Domain auth (SPF/DKIM) for transactional From address
- [ ] Test: register or resend activation → inbox (not spam)
- [ ] Test: payment success email after smoke purchase (if wired)

---

## 4. R2 / images

- [ ] Prod R2 bucket + keys in env
- [ ] Seller can upload a listing photo on prod (no 403)
- [ ] Public image URL loads on listing detail

---

## 5. Secrets & safety flags

- [ ] `RBAC_SEED_ENABLED=false`
- [ ] JWT / DB / Meili secrets rotated from defaults
- [ ] TLS live on web + api hostnames

---

## 6. Smoke matrix

From a Windows PC:

```powershell
.\scripts\smoke-pilot.ps1 -BaseUrl "https://api.sellnearby.ie"
```

- [ ] Public smoke green
- [ ] Manual: login as seller → Connect status loads on `/account/earnings`
- [ ] Manual: Earnings shows **first successful card sale: 0% fee** for a seller with no prior card sales
- [ ] **Exit gate:** one **€1–€5 live card purchase** (expect **0%** platform fee on that first sale), then refund via [dispute-refund-playbook](./dispute-refund-playbook.md) if needed

---

## 7. Legal for closed pilot

- [ ] `/terms` and `/privacy` show solicitor-ready drafts (not “coming soon”)
- [ ] Invite only people you know until solicitor sign-off
- [ ] Full Ireland legal pack stays on Path B

---

## When Path A is done

1. Start [pilot-concierge-gtm.md](./pilot-concierge-gtm.md) — 3–5 sellers/week in one Dublin wedge.
2. Track Friday sale-close mix + fee vs burn.
3. Do **not** build new SKUs or cut sitewide fees until card habit exists.
