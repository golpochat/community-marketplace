# SellNearby.ie — VPS pilot day-by-day checklist

> **Domain:** `sellnearby.ie` · **API:** `https://api.sellnearby.ie` · **Web:** `https://sellnearby.ie`  
> **You already have:** VPS live, super-admin, one admin, one demo seller  
> **How to use:** Work top to bottom. Change `[ ]` to `[x]` when each step is done.

---

## Before you start (every deploy day)

Use this block whenever you pull new code from GitHub.

### On your Windows PC

- [x] Commit and push your local changes (if any):
  ```powershell
  cd "D:\Exclusive projects\Community Marketplace"
  git status
  git add -A
  git commit -m "Your message"
  git push origin main
  ```



### On the VPS (SSH)

```bash
ssh ubuntu@YOUR_VPS_IP
cd /opt/sellnearby
```

- [x] Pull latest code:
  ```bash
  git fetch origin main
  git pull --ff-only origin main
  ```
- [x] Deploy (build, migrate, restart):
  ```bash
  chmod +x infra/scripts/vps-update.sh
  ./infra/scripts/vps-update.sh
  ```
- [x] Confirm health:
  ```bash
  curl -s https://api.sellnearby.ie/api/health/ready
  ```

**Expected:** JSON with ready status. If migrate fails, see [ovh-vps-deploy.md](./ovh-vps-deploy.md#troubleshooting).

---



## Day 0 — Today: verify live stack + seller can list

**Goal:** Prove the site works end-to-end without payments yet.

### A. Automated smoke (Windows PC)

- [x] Run:
  ```powershell
  cd "D:\Exclusive projects\Community Marketplace"
  .\scripts\smoke-pilot.ps1 -BaseUrl "https://api.sellnearby.ie"
  ```
- [x] All non-optional tests **PASS** (health, listings browse/search/feeds).



### B. Browser checks

- [x] [https://sellnearby.ie](https://sellnearby.ie) loads (homepage)
- [x] [https://api.sellnearby.ie/api/health/ready](https://api.sellnearby.ie/api/health/ready) returns OK
- [x] Super-admin login → [https://sellnearby.ie/super-admin/dashboard](https://sellnearby.ie/super-admin/dashboard)
- [x] Admin login → [https://sellnearby.ie/admin/dashboard](https://sellnearby.ie/admin/dashboard)
- [x] Demo seller login → [https://sellnearby.ie/seller/dashboard](https://sellnearby.ie/seller/dashboard)



### B2. Registration & phone OTP (pilot mode)

**SMS is not wired yet.** The register page shows an amber **Pilot mode** banner. Codes are written to API logs — not sent by text.

**Ensure `OTP_PILOT_MODE=true` in `.env.prod`** (default in `.env.prod.example`) and **rebuild web** after changing it:

```bash
cd /opt/sellnearby/infra/docker
docker compose -f docker-compose.prod.yml --env-file .env.prod build web
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --force-recreate web
```

**Retrieve a code on the VPS** (replace phone digits as needed):

```bash
cd /opt/sellnearby/infra/docker
docker compose -f docker-compose.prod.yml --env-file .env.prod logs api --tail=200 | grep "dev code"
```

Example log line: `OTP sent to phone +353871234567 (dev code: 123456)`

- [ ] Open [https://sellnearby.ie/auth/register](https://sellnearby.ie/auth/register) — amber pilot banner visible on phone + code steps
- [ ] Complete registration using a code from API logs
- [ ] Activation email arrives (Brevo) and link works

**Before inviting external users:** wire a real SMS provider (e.g. Twilio) in `OtpService`, set `OTP_PILOT_MODE=false`, rebuild web, and smoke-test registration on a real handset.



### C. Demo seller — storefront (required before listings)

Log in as **demo seller**.

- [ ] Open **Seller → Storefront** (or storefront settings)
- [ ] Set store **name** and **slug** (e.g. `demo-seller`)
- [ ] Set **location** (e.g. Dublin, Ireland)
- [ ] Set **contact** phone/email (visible on store page)
- [ ] Add **policies** (returns, shipping — short text is fine)
- [ ] Save
- [ ] Open public store URL: `https://sellnearby.ie/store/demo-seller` (use your slug)



### D. Demo seller — first listing (no photos yet)

- [ ] **Seller → Listings → Create**
- [ ] Category: e.g. Electronics
- [ ] Title, description, price (EUR), condition, location
- [ ] Delivery: at least **Collection**
- [ ] Save as **draft**, then **submit for review** (or publish if your flow allows)



### E. Admin — approve listing

Log in as **admin**.

- [ ] **Admin → Listing moderation** (or Listings queue)
- [ ] Find demo seller listing → **Approve**
- [ ] Status becomes **active**



### F. Public visibility

- [ ] Homepage or browse shows the listing (may take a minute; search index updates via worker)
- [ ] Listing detail page loads when logged out



### G. Super-admin — platform basics

Log in as **super-admin**.

- [ ] **Platform settings → Governance:** platform name, support email (`support@sellnearby.ie`)
- [ ] **Maintenance mode:** OFF
- [ ] Save

**Day 0 done when:** Active listing visible on [https://sellnearby.ie](https://sellnearby.ie) without errors.

---



## Day 1 — Cloudflare R2 (images & uploads)

**Goal:** Listing photos, avatars, and verification docs upload to real storage.

### A. Create Cloudflare account & R2 bucket

- [ ] Go to [https://dash.cloudflare.com](https://dash.cloudflare.com) and sign in (or create account)
- [ ] Left menu → **R2 Object Storage**
- [ ] If prompted, enable R2 and add billing (R2 has a free tier)
- [ ] Click **Create bucket**
  - Name: `sellnearby-prod` (match `R2_BUCKET` in `.env.prod`)
  - Location: **Western Europe** (closest to Ireland)
- [ ] Bucket created



### B. R2 API token (S3-compatible keys)

- [ ] R2 → **Manage R2 API Tokens** (or Overview → API Tokens)
- [ ] **Create API token**
  - Permissions: **Object Read & Write**
  - Specify bucket: `sellnearby-prod` (recommended)
- [ ] Copy and save securely:
  - **Access Key ID** → `R2_ACCESS_KEY_ID`
  - **Secret Access Key** → `R2_SECRET_ACCESS_KEY`
- [ ] Copy **Account ID** from R2 overview → `R2_ACCOUNT_ID`



### C. Public URL for images

Choose **one** option:

**Option 1 — R2 custom domain (recommended for production)**

- [ ] R2 → bucket `sellnearby-prod` → **Settings** → **Public access** / **Custom Domains**
- [ ] Add domain e.g. `assets.sellnearby.ie`
- [ ] Cloudflare shows a CNAME target — add DNS record in Cloudflare DNS:
  - Type: `CNAME`
  - Name: `assets`
  - Target: (value Cloudflare gives you)
- [ ] Wait for SSL active
- [ ] `R2_PUBLIC_URL=https://assets.sellnearby.ie`

**Option 2 — R2.dev subdomain (quick test)**

- [ ] Bucket → enable **Public access** via `r2.dev` subdomain
- [ ] Copy public URL e.g. `https://pub-xxxxx.r2.dev`
- [ ] `R2_PUBLIC_URL=https://pub-xxxxx.r2.dev`



### D. Endpoint URL

- [ ] Set in `.env.prod`:
  ```env
  R2_ACCOUNT_ID=your_account_id
  R2_ACCESS_KEY_ID=your_access_key
  R2_SECRET_ACCESS_KEY=your_secret_key
  R2_BUCKET=sellnearby-prod
  R2_ENDPOINT=https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com
  R2_PUBLIC_URL=https://assets.sellnearby.ie
  ```



### E. Apply on VPS

```bash
ssh ubuntu@YOUR_VPS_IP
cd /opt/sellnearby/infra/docker
nano .env.prod   # paste R2_* values
cd /opt/sellnearby/infra/docker
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d api worker web
```

- [ ] API restarted
- [ ] Check API logs: `docker compose -f docker-compose.prod.yml --env-file .env.prod logs api --tail 30`



### F. Test uploads

- [ ] Demo seller → edit listing → **upload 1–2 photos** → save
- [ ] Images display on listing detail (not broken icon)
- [ ] Open image URL in new tab — loads from `R2_PUBLIC_URL` domain
- [ ] Optional: upload **profile avatar** and **store banner**

**Day 1 done when:** Listing images load on production from R2.

---



## Day 2 — Email (Brevo)

**Goal:** Registration, invitations, and notifications send real email.

### A. Create Brevo account

- [ ] Go to [https://www.brevo.com](https://www.brevo.com) and sign up (free tier OK for pilot)
- [ ] Complete account verification



### B. Add sender domain

- [ ] Brevo → **Senders, Domains & Dedicated IPs** → **Domains**
- [ ] Add domain: `sellnearby.ie`
- [ ] Brevo shows **DNS records** (DKIM, SPF, etc.)
- [ ] In **Cloudflare DNS** (or your DNS host), add each record Brevo lists
- [ ] Wait until Brevo shows domain **Verified** (can take up to 48h; often < 1h)



### C. Create sender address

- [ ] Brevo → **Senders** → add sender:
  - Email: `noreply@sellnearby.ie` (or `support@sellnearby.ie`)
  - Name: `SellNearby`
- [ ] Sender verified



### D. API key

- [ ] Brevo → **SMTP & API** → **API Keys**
- [ ] **Generate a new API key** (Transactional permission)
- [ ] Copy key → `BREVO_API_KEY=xkeysib-...`



### E. Update VPS `.env.prod`

```env
BREVO_API_KEY=xkeysib-your-key
EMAIL_FROM=noreply@sellnearby.ie
```

- [ ] Restart API:
  ```bash
  cd /opt/sellnearby/infra/docker
  docker compose -f docker-compose.prod.yml --env-file .env.prod up -d api worker
  ```



### F. Test email

**Option A — Super-admin test send (if UI available)**

- [ ] Super-admin → **Platform settings → Email** → send test email to your inbox

**Option B — Register new user**

- [ ] Open incognito → [https://sellnearby.ie/auth/register](https://sellnearby.ie/auth/register)
- [ ] Register with a **real email you control**
- [ ] Check inbox (and spam) for activation / welcome email

- [ ] Optional: Super-admin → **Invitations** → invite a test admin email

**Day 2 done when:** At least one transactional email arrives from `@sellnearby.ie`.

---



## Day 3 — Stripe (test mode first)

**Goal:** Seller Connect onboarding + buyer can pay with test card.

### A. Stripe account setup

- [ ] [https://dashboard.stripe.com](https://dashboard.stripe.com) — sign in or create account
- [ ] Stay in **Test mode** (toggle top-right) for first VPS test
- [ ] **Connect** → complete Connect setup for **Express** accounts (marketplace/platform)
  - If you see *"sign up for Connect"* — complete wizard first



### B. API keys (test)

- [ ] Developers → **API keys**
- [ ] Copy **Secret key** `sk_test_...` → `STRIPE_SECRET_KEY`
- [ ] Copy **Publishable key** `pk_test_...` → needed for web checkout (see below)



### C. Web publishable key (checkout UI)

The web Docker image bakes `NEXT_PUBLIC_*` at **build time**. Add publishable key before rebuilding web:

- [ ] On VPS, edit `infra/docker/docker-compose.prod.yml` web service `build.args`:
  ```yaml
  args:
    NEXT_PUBLIC_API_URL: https://api.${DOMAIN}/api
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: ${STRIPE_PUBLISHABLE_KEY:-}
  ```
- [ ] Add to `infra/docker/.env.prod`:
  ```env
  STRIPE_PUBLISHABLE_KEY=pk_test_...
  ```
- [ ] Rebuild web only:
  ```bash
  cd /opt/sellnearby/infra/docker
  docker compose -f docker-compose.prod.yml --env-file .env.prod build web
  docker compose -f docker-compose.prod.yml --env-file .env.prod up -d web api worker
  ```

> If you prefer not to edit compose yet, merge a repo change that adds this build arg, then `./infra/scripts/vps-update.sh`.



### D. Webhook — destination 1 (your platform account)

- [ ] Stripe Dashboard → **Developers → Webhooks** → **Add endpoint**
- [ ] Endpoint URL: `https://api.sellnearby.ie/api/payments/webhooks/stripe`
- [ ] **Listen to:** Events on **your account**
- [ ] Select events:
  - [ ] `checkout.session.completed`
  - [ ] `payment_intent.succeeded`
  - [ ] `payment_intent.payment_failed`
  - [ ] `refund.created`
  - [ ] `charge.dispute.created`
  - [ ] `account.updated`
  - [ ] `transfer.created`
- [ ] Add endpoint
- [ ] Click endpoint → **Signing secret** → `whsec_...` → `STRIPE_WEBHOOK_SECRET`



### E. Webhook — destination 2 (connected accounts)

- [ ] **Add another endpoint** (same URL)
- [ ] **Listen to:** Events on **Connected accounts**
- [ ] Select events:
  - [ ] `payout.paid`
  - [ ] `payout.failed`
- [ ] Save (each destination has its own signing secret — use the **platform account** secret for `STRIPE_WEBHOOK_SECRET`, or combine per Stripe docs if using one endpoint with both)



### F. Update VPS `.env.prod`

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

- [ ] Restart: `docker compose -f docker-compose.prod.yml --env-file .env.prod up -d api worker web`



### G. Seller Connect onboarding

- [ ] Log in as **demo seller**
- [ ] **Seller → Earnings** (or Payments)
- [ ] **Connect with Stripe** → complete Express onboarding (test data OK)
- [ ] Dashboard shows Connect **enabled**



### H. Buyer test purchase

- [ ] Create/register a **buyer** account (or use a second email)
- [ ] Admin: ensure listing is **active**
- [ ] Buyer → find listing → **Purchase** / checkout
- [ ] Card: `4242 4242 4242 4242`, any future expiry, any CVC
- [ ] Payment succeeds
- [ ] Listing status → **sold**
- [ ] Stripe Dashboard → Payments shows test payment
- [ ] Stripe → Webhooks → endpoint → recent deliveries **200 OK**

**Day 3 done when:** Test purchase completes and listing marks sold.

---



## Day 4 — Search, chat, admin queues

**Goal:** Confirm worker, Meilisearch, and moderation paths on prod.

### A. Search index

- [ ] Create a second active listing (different title)
- [ ] Wait 1–2 minutes OR admin → **Search tools** → **Reindex** (if available)
- [ ] Homepage search / browse finds new listing by keyword



### B. Chat

- [ ] Buyer opens **active** listing → **Message seller**
- [ ] Send message
- [ ] Seller → **Chat** → sees thread and can reply
- [ ] Real-time update works (refresh if WebSocket blocked)



### C. Admin operational queues

As **admin**, open each and confirm UI loads (empty OK):

- [ ] Listing moderation
- [ ] Reports / Moderation
- [ ] Seller verification (if seller submits)
- [ ] Payments
- [ ] Disputes (after a test dispute, optional)



### D. Super-admin

- [ ] Audit log shows recent actions
- [ ] Platform metrics / overview loads
- [ ] User management — can see admin + seller



### E. Re-run smoke with login

```powershell
.\scripts\smoke-pilot.ps1 -BaseUrl "https://api.sellnearby.ie" `
  -LoginEmail "YOUR_SUPER_ADMIN_EMAIL" `
  -LoginPassword (ConvertTo-SecureString "YOUR_PASSWORD" -AsPlainText -Force)
```

- [ ] Auth login **PASS**

**Day 4 done when:** Search, chat, and admin panels verified on production.

---



## Day 5+ — Pilot users & go-live prep



### A. Legal & support (before strangers)

- [ ] Terms of service page live (`/terms`)
- [ ] Privacy policy page live (`/privacy`)
- [ ] Contact / support email monitored daily
- [ ] Internal 1-page playbook: refunds, disputes, ban policy



### B. Optional staff personas (super-admin)

Create via **User management** or **Invitations**:

- [ ] `MODERATION_ADMIN` — for reports & disputes only
- [ ] `ACCOUNTS_ADMIN` — for verifications only
- [ ] `FINANCIAL_ADMIN` — for payments only



### C. Invite pilot cohort (10–20 people)

- [ ] Prepare list of trusted sellers (one city/region)
- [ ] Send invite link or manual account creation
- [ ] Walk 2 sellers through: storefront → listing → approval → Connect
- [ ] Daily admin check (15 min): moderation, verification, failed payments



### D. Switch Stripe to live (only when test flow is solid)

- [ ] Stripe Dashboard → **Live mode**
- [ ] New live keys: `sk_live_...`, `pk_live_...`
- [ ] New live webhook endpoints (same URL, live mode)
- [ ] Update `.env.prod` with live keys
- [ ] Rebuild **web** with live `STRIPE_PUBLISHABLE_KEY`
- [ ] One real small purchase (€1–€5) → refund if needed



### E. Ongoing deploy rhythm

After each feature fix on GitHub:

- [ ] `git pull` + `./infra/scripts/vps-update.sh` on VPS
- [ ] `.\scripts\smoke-pilot.ps1 -BaseUrl "https://api.sellnearby.ie"`
- [ ] Quick browser check on seller checkout if payments changed

---



## Quick reference — `.env.prod` integration variables


| Variable                                     | Service            | When        |
| -------------------------------------------- | ------------------ | ----------- |
| `R2_*`                                       | Cloudflare R2      | Day 1       |
| `BREVO_API_KEY`, `EMAIL_FROM`                | Brevo              | Day 2       |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Stripe API         | Day 3       |
| `STRIPE_PUBLISHABLE_KEY`                     | Stripe (web build) | Day 3       |
| `RBAC_SEED_ENABLED=false`                    | Always in prod     | Already set |


---



## Related docs

- [ovh-vps-deploy.md](./ovh-vps-deploy.md) — initial VPS setup
- [pilot-kickoff.md](./pilot-kickoff.md) — pilot strategy
- [launch-checklist.md](../product/launch-checklist.md) — full FR/NFR inventory
- [dev-credentials.md](../dev-credentials.md) — Stripe test flow details
- [payments API](../api/payments.md) — webhook event list

---



## Progress tracker (summary)


| Day | Focus                                      | Completed |
| --- | ------------------------------------------ | --------- |
| 0   | Verify + storefront + first active listing | [ ]       |
| 1   | Cloudflare R2 images                       | [ ]       |
| 2   | Brevo email                                | [ ]       |
| 3   | Stripe test payments                       | [ ]       |
| 4   | Search, chat, admin queues                 | [ ]       |
| 5+  | Legal, pilot users, Stripe live            | [ ]       |


