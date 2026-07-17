# SellNearby AI Marketing Hub — Product Plan

**Status:** **Pilot-ready** (Phases 0–4 + Marketing Hub home + shop banner apply + AI credit packs + featured storefront). Publish in admin and smoke. Deferred: video, forecast.  
**Last reviewed:** 2026-07-17  
**Related:** [master-blueprint-v1.md](./master-blueprint-v1.md), [monetization.md](./monetization.md), [roadmap.md](./roadmap.md)  
**External reference:** [Zeely.ai](https://zeely.ai/) (inspiration only — not a core dependency)

---

## 1. Executive summary

SellNearby should **not** integrate Zeely (or any single ad SaaS) as a core product dependency.

Instead, build a **native AI Marketing Hub** inside SellNearby that turns listing data into marketing assets sellers can use on and off the platform.

| Decision | Choice |
|----------|--------|
| Core approach | Build native AI Marketing Hub |
| Zeely / similar tools | Inspiration + optional external link only |
| Primary goal | Help Irish community sellers promote listings faster, cheaper, and inside our UX |
| Cost principle | Cost-effective, credit-based, aligned with existing micro-pricing |
| Ownership | SellNearby owns seller workflow, data, and monetization |

**Why this wins**

- Listing-native context (title, photos, price, category, location, storefront)
- Lower long-term cost than per-seller SaaS + ad-spend fees
- Defensible product differentiation
- Upsell path into boosts, featured, storefronts, and credits
- No billing surprises or third-party brand risk tied to our name

---

## 2. Problem and opportunity

### Seller problem

Most SellNearby sellers are not marketers. They struggle with:

- Writing clear product descriptions and SEO titles
- Creating social captions and ad copy
- Making listing images look professional
- Knowing what to post, when, and at what price
- Paying agencies or tools they do not understand

### Platform opportunity

If SellNearby helps sellers market listings, we get:

- Higher listing quality and conversion
- More off-platform traffic returning to SellNearby
- Stronger seller retention and willingness to pay for boosts
- A new monetization surface (AI credits / seller growth packs)
- Differentiation vs generic classifieds

### What Zeely teaches us (keep)

- Product URL / product data → ad creative in minutes
- Templates + bulk variants for testing
- Beginner-friendly guided flow
- Static + short video as complementary formats

### What Zeely does not solve for us (avoid as core)

- Weak marketplace-native integration
- Meta-heavy campaign dependency
- Subscription + % of ad spend cost model
- Platform dependency and billing friction risk
- Limited control over Irish local / community messaging

---

## 3. Product vision

**One sentence**

> From any listing, a seller can generate descriptions, social posts, banners, and later videos — then promote with SellNearby boosts — without leaving the platform.

**Hub entry points**

| # | Entry point | Status |
|---|-------------|--------|
| 1 | Listing editor (goods + vehicles) → per-step **Marketing hub** shell | **Live** — `ListingMarketingHub` on details / pricing / photos (vehicles: condition / price / photos) |
| 2 | Seller dashboard → “AI Marketing Hub” | **Live** — `/account/marketing` (`SellerMarketingHubPage`) |
| 3 | Storefront settings → “Promote your shop” | **Live** — `StoreMarketingHub` on `/account/storefront` |
| 4 | Post-create success → “Share this listing” | **Live** — after Save draft on create; `ListingShareSuccessPanel` + hub `step="share"` |

**Non-goals (v1–v2)**

- Running paid Meta / TikTok / Google campaigns on behalf of sellers
- Guaranteeing ROAS
- Replacing Canva / professional agencies for brand-heavy work
- Deep white-label of Zeely or similar SaaS

---

## 4. Phased feature roadmap

Complexity key: **S** = small · **M** = medium · **L** = large · **XL** = very large  
Cost key: relative AI/API cost per use (Low / Med / High)  
Status key: **Done** · **Partial** · **Deferred** · **Not started**

### Phase 0 — Foundations (prerequisite) — **Done (minimal viable)**

| Item | Complexity | Status | Notes |
|------|------------|--------|-------|
| AI provider abstraction layer | M | **Done** | OpenAI primary + Anthropic fallback; non-prod stub |
| Credit / usage metering | M | **Done** | Free units + `BuyerWallet` debit + `ai_generation` ledger |
| Prompt + safety policy layer | M | **Done (v1)** | Expanded prohibited patterns + PII scrub before provider/audit |
| Listing context assembler | S–M | **Done** | Listing id or draft fields + store name |
| Audit log of generations | S | **Done** | `AiGenerationLog` |
| Rate limits + abuse controls | S | **Done** | 30 jobs / seller / day · **15 / listing / day** when `listingId` present |

**Exit criteria:** Can generate one safe text asset from a listing with metered usage and logging. ✅

---

### Phase 1 — Text marketing (ship first) — **Done**

Highest seller value, lowest cost, fastest build.

| Feature | Complexity | AI cost | Priority | Status | Seller outcome |
|---------|------------|---------|----------|--------|----------------|
| AI Product Description | S | Low | P0 | **Done** | Better listing copy |
| AI SEO Title | S | Low | P0 | **Done** | Clearer, searchable titles |
| AI Keywords / tags | S | Low | P0 | **Done** | Copy-only |
| AI Instagram Caption | S | Low | P0 | **Done** | Ready-to-post social |
| AI Facebook Ad / post copy | S | Low | P0 | **Done** | Ready-to-post social |
| AI TikTok Script | S | Low | P1 | **Done** | Short-form talking points |
| AI Seasonal Promotions | S–M | Low | P1 | **Done** | Seasonal / local promo drafts |
| AI Email Campaign draft | S–M | Low | P1 | **Done** | Follow-up drafts |
| AI WhatsApp Campaign message | S | Low | P1 | **Done** | Outreach templates |
| Tone / length / locale controls | S | Low | P1 | **Partial** | Irish English fixed in prompts; no seller tone/length UI |

**Suggested UX (live)**

- Form fields first; Marketing Hub below, sections **collapsed by default**
- Improve listing → Accept into form; Share off SellNearby → Copy (locked until title meets min length)
- Irish English default; Gaeilge still later

**Exit criteria:** ≥3 text tools live; sellers can apply description + title + one social caption in under 2 minutes. ✅

---

### Phase 2 — Image enhancement & banners — **Done (core)**

| Feature | Complexity | AI cost | Priority | Status | Seller outcome |
|---------|------------|---------|----------|--------|----------------|
| AI Background Removal | M | Med | P0 | **Done** | remove.bg when keyed; Sharp studio fallback non-prod |
| AI Image Enhancement | M | Med | P0 | **Done** | Sharp pipeline; may apply to listing |
| AI Banner Creator | M–L | Med | P0 | **Done** | Feed / story / marketplace card · marketing-only |
| AI Logo Placement | M | Low–Med | P1 | **Partial** | Optional store logo on banners only |
| AI Watermarking | S–M | Low | P1 | **Partial** | Optional SellNearby watermark on banners only |
| Template pack (local marketplace) | M | Low | P1 | **Done** | classic · for sale near you · collection only · priced to sell |

**Exit criteria:** Seller can produce one shareable listing card and one enhanced product image from existing photos. ✅

---

### Phase 3 — Growth intelligence (+ video later) — **Core Done · Video Deferred**

| Feature | Complexity | AI cost | Priority | Status | Seller outcome |
|---------|------------|---------|----------|--------|----------------|
| AI Video Generator (short) | XL | High | P1 | **Deferred** | 15–30s listing promo |
| AI Talking-head / avatar video | XL | High | P2 | **Deferred** | Quality-sensitive |
| AI Best Posting Time | M | Low | P1 | **Done** | Europe/Dublin · free |
| AI Price Suggestions | M–L | Low | P0 | **Done** | Comps-first · free · advisory |
| AI Sales Forecast | L | Low–Med | P2 | **Deferred** | Directional only |
| Campaign pack export (zip + captions) | M | Low | P1 | **Done** | Assembles prior generations |
| Optional “open in Zeely / Canva” deep link | S | — | P3 | **Deferred** | Non-core convenience |

**Exit criteria (adjusted):** Price suggestion + posting time + campaign pack + boost CTA live. Short video remains later. ✅ (adjusted)

---

### Phase 4 — Platform-native promotion loop — **Core shipped**

Connect AI Hub to existing SellNearby monetization (boosts / featured / storefront).

| Feature | Complexity | Priority | Status |
|---------|------------|----------|--------|
| “Generate creative → Boost listing” flow | M | P0 | **Done** — 3-step funnel in campaign panel + `source` on boost intent |
| “Generate shop banner → Feature storefront” | M | P1 | **Partial** — AI shop banner + apply live; dedicated featured-store SKU deferred (CTA → listings) |
| Seller growth packs (credits + boost discount) | M | P0 | **Done** — `seller_growth_pack` SKU (€6.99 · €5 credit · 25% hub boost) |
| Admin analytics: hub usage → boost conversion | M | P1 | **Done** — Monetization → Advertising analytics panel |
| Partner / sponsor creatives into display slots later | L | Later | **Not started** |

**Exit criteria:** Measurable uplift from Hub users buying boosts vs non-users. ✅ attribution + admin UI live; pilot conversion TBD.

---

## 5. Recommended build order (summary)

```text
Month 0–1   Phase 0 foundations + AI Product Description + SEO Title     ✅ shipped
Month 1–2   Captions, keywords, WhatsApp, seasonal prompts               ✅ shipped
Month 2–4   Background removal, enhancement, banner creator              ✅ shipped
Month 4–6   Price + posting time + boost funnel + Growth Pack + analytics ✅ shipped
Month 6+    Pilot → video · forecast ← demand-gated
```

Do **not** start with video. Video is expensive, quality-variable, and slower to ship. Text + image enhancement cover most sellers first. **Next product step is ops: publish the hub and pilot.** Dedicated Marketing Hub page is live at `/account/marketing`.

---

## 6. Build complexity matrix

| Capability | Eng effort | Ops / compliance | Dependency risk | Notes |
|------------|------------|------------------|-----------------|-------|
| Text generation suite | Low–Med | Med (claims, prohibited items) | Low | Highest ROI — **live** |
| Image enhance / bg remove | Med | Med (photo rights) | Low–Med | **live**; prod rembg needs API key |
| Banner templates | Med | Low | Low | **live** |
| Price suggestions | Med–High | High (must be advisory) | Low | **live** (comps-first) |
| Best posting time | Med | Low | Low | **live** |
| Sales forecast | High | High | Low | Deferred — easy to overpromise |
| Short video | Very High | Med–High | Med | Deferred |
| Avatar UGC video | Very High | High | High | Deferred |
| Paid ad account automation | Very High | Very High | Very High | Out of scope |

---

## 7. Recommended AI / service providers (by feature)

Prefer an **abstraction layer** so providers can be swapped. Use EU-friendly data handling where practical (GDPR).

### Text (descriptions, SEO, captions, scripts, email, WhatsApp)

| Option | Role | Notes |
|--------|------|-------|
| **OpenAI GPT-4.1 / GPT-4o-mini** | Primary (live: `OPENAI_CHAT_MODEL`, default `gpt-4o-mini`) | Dev stub when no live keys (non-prod) |
| **Anthropic Claude** | Fallback (live when `ANTHROPIC_API_KEY` set; default `claude-haiku-4-5`) | Used if OpenAI fails or is unset |
| **Google Gemini Flash** | Cost-efficient batch | **Not wired** |
| **Self-hosted open model (later)** | Cost control at scale | Only after volume justifies ops |

**Recommendation:** **one primary LLM + one fallback** — live: OpenAI → Anthropic.

### Image enhancement & background removal

| Option | Best for | Notes |
|--------|----------|-------|
| **remove.bg / Photoroom API** | Background removal | **remove.bg live** when `REMOVE_BG_API_KEY` set |
| **Cloudinary AI / imgproxy + AI add-ons** | Enhance, crop, watermark | Not used |
| **Replicate (BRIA / rembg / GFPGAN-class models)** | Flexible enhance / rembg | Not used |
| **Sharp + local pipeline** | Watermark, resize, enhance, banners | **Live** for enhance / banners / watermark |

**Recommendation:** In-house for watermark/resize; managed API for rembg — matches live stack.

### Banner / static ad layouts

| Option | Best for | Notes |
|--------|----------|-------|
| **In-house template engine** (Sharp composite) | Brand control, cost | **Live** |
| **Canva Connect API** (optional) | Power users | Deferred |
| **Bannerbear / Placid** | Quick template rendering | Not used |

### Short video generation

| Option | Best for | Notes |
|--------|----------|-------|
| **Runway / Luma / Kling-class APIs** | Generative video clips | Deferred |
| **Shotstack / Creatomate / JSON2Video** | Template video from images + captions | Preferred when video starts |
| **HeyGen / Arcads** | Avatar talking head | Optional later |

### Price suggestion & forecast

| Option | Best for | Notes |
|--------|----------|-------|
| **Internal stats + rules + LLM explanation** | Primary | **Live** (comps; explanation without metered LLM for price) |
| LLM alone | Do not use as sole price source | Hallucination risk |

### Optional external tools (non-core)

| Tool | Use | Status |
|------|-----|--------|
| Zeely | Optional “advanced Meta ads” deep link | Deferred |
| Canva | Optional design export | Deferred |
| Meta Ads Manager | Seller-owned ad accounts only | Out of scope |

---

## 8. Architecture principles (planning level)

```text
Listing / Storefront data
        │
        ▼
 AI Context Assembler ──► Safety / Policy Filter
        │
        ▼
 Provider Router (text / image / video)
        │
        ▼
 Generation Service ──► Credit Meter ──► Audit Log
        │
        ▼
 Preview → Seller edit → Save / Export / Boost handoff
```

**Rules**

1. Never send unnecessary PII to third-party AI providers.
2. Respect prohibited categories and Islamic marketplace constraints already defined in the blueprint.
3. Every generation is advisory; seller must confirm before publish.
4. Store provider, model, prompt version, and cost for each job.
5. Prefer EU region endpoints when available.

**Live gating order**

1. Env `AI_MARKETING_ENABLED` ≠ `false` (hard kill switch)
2. Admin publish `platform_settings.aiMarketingEnabled` (default **off**)
3. Provider ready (`OPENAI_API_KEY` and/or `ANTHROPIC_API_KEY`; non-prod stub if neither)
4. Seller RBAC + quota / wallet checks

---

## 9. Monetization model

Align with SellNearby’s free-to-start, micro-priced philosophy (see master blueprint).

### 9.1 Live pricing (canonical — what sellers see today)

| Rule | Live value |
|------|------------|
| Free monthly quota | **10 credit units / calendar month** for **verified** sellers only |
| Unverified | **No free units**; wallet debit allowed if balance covers cost |
| Paid overage | **€0.05 per credit unit** from SellNearby Credit wallet |
| Daily generation cap | **30** jobs / seller / day · **15** / listing / day (when listing id present) |
| Free tools (0 units) | Price suggestion · best posting time · campaign pack download |
| Seller visibility | Hub chrome shows free units + wallet € + €/unit; paid buttons show **units · ≈€** |

Unit costs match §14 tables and `AI_MARKETING_TASK_UNIT_COSTS` in `@community-marketplace/types`.

### 9.2 Future packaging options (not live SKUs)

| Package | What sellers get | Suggested price band (IE) | Notes |
|---------|------------------|---------------------------|-------|
| Free starter | Limited AI generations / month (live: 10 text-equivalent units) | €0 | Already live for verified |
| AI Credits packs | Pay-as-you-go top-ups | Micro packs e.g. €1.99 / €4.99 / €9.99 | **Not shipped** — use Growth Pack or cashback Credit |
| Seller Growth Pack | €5 Credit + 25% off one Marketing Hub boost | **€6.99** (default) | **Live** — campaign funnel step 2 |
| Pro Seller (optional later) | Higher monthly allowance + image tools | e.g. €9.99–€19.99 / mo | Only if usage proves sticky |
| Enterprise / agency (later) | Multi-storefront bulk | Custom | Phase 4+ |

### 9.3 Credit cost table (live)

| Action | Credit cost | Approx EUR if paid |
|--------|------------:|-------------------:|
| SEO title | 1 | €0.05 |
| Description | 2 | €0.10 |
| Social caption / keywords / WhatsApp / seasonal | 1 | €0.05 |
| TikTok script / email | 2 | €0.10 |
| Background removal | 5 | €0.25 |
| Banner creative | 4 | €0.20 |
| Image enhance | 3 | €0.15 |
| Short video (15–30s) | 20–40 | High — **not live** |

**Principle:** Gross margin on AI features should stay healthy after provider fees. Increase credit price or reduce free quota if COGS rises.

### 9.4 What not to copy from Zeely

- % fee on seller Meta ad spend as a core revenue line
- Aggressive trial → auto-upgrade billing patterns
- Forcing campaign management through a third party

### 9.5 Funnel into existing revenue

AI Hub should increase:

1. Listing completeness → more chat / sales
2. Boost / featured conversion (“promote this creative”)
3. Storefront upgrades
4. Credit wallet top-ups

**Primary KPI:** Hub users’ boost purchase rate vs control cohort.

---

## 10. Success metrics

| Metric | Target direction | Phase |
|--------|------------------|-------|
| % of new listings using AI description | ↑ | 1 |
| Time to publish complete listing | ↓ | 1 |
| Share / export actions from Hub | ↑ | 1–2 |
| Enhanced image adoption | ↑ | 2 |
| Boost conversion after Hub use | ↑ | 4 |
| AI COGS per active seller / month | Controlled | All |
| Seller NPS / support tickets about AI quality | Watch | All |
| Refund / complaint rate on AI packs | Low | All |

---

## 11. Risks and mitigations

| Risk | Mitigation |
|------|------------|
| Misleading AI claims (condition, authenticity) | Policy filter + seller confirmation + disclaimers |
| Prohibited item assistance | Category / keyword safety layer |
| High image/video COGS | Credit metering; start text-first; template video before generative |
| Provider lock-in | Abstraction + dual-provider capability |
| Seller expects guaranteed sales | Clear UX: “suggestions, not guarantees” |
| Brand damage from bad avatar video | Delay avatar video; prefer image slideshow + captions |
| GDPR / training data concerns | Prefer no-train / enterprise terms; minimize PII |
| Feature bloat | Strict phased roadmap; ship Phase 1 fully before video |

---

## 12. Competitive positioning

| Approach | Rating for SellNearby | Verdict |
|----------|----------------------|---------|
| Deep Zeely integration | ★★☆☆☆ | Reject as core |
| Zeely as optional seller link | ★★★★☆ | Acceptable later |
| Native AI Marketing Hub | ★★★★★ | Preferred |
| Do nothing | ★★☆☆☆ | Leaves seller growth to chance |

**Updated scorecard (Zeely as inspiration only)**

| Category | Rating |
|----------|--------|
| AI advertisement creation (as a capability we should offer) | ★★★★★ |
| Social media marketing assistance | ★★★★★ |
| Marketplace integration (native hub) | ★★★★★ |
| Cost efficiency at scale (native + credits) | ★★★★☆ |
| Long-term scalability | ★★★★★ |
| Seller value | ★★★★★ |
| Platform dependency risk (if native) | Low |
| **Recommendation** | **Build native hub; use Zeely only as optional external inspiration/tool** |

---

## 13. Product decisions (resolved 2026-07-16)

| # | Decision | Resolution |
|---|----------|------------|
| 1 | Free monthly AI quota | **Verified sellers only.** Unverified sellers get no free quota (can still buy AI credit packs / use wallet). Free allowance for verified: **10 units / calendar month** (tunable in platform settings). |
| 2 | Wallet | **Same wallet as SellNearby Credit** (`BuyerWallet`). Debit AI usage from that balance; add ledger types for AI spend / free quota. |
| 3 | Locale | **Irish English only** at launch. No Gaeilge prompts in Phase 1. |
| 4 | AI images as listing primary photos | **Recommended hybrid (adopted):** (a) **Seller-photo edits** (enhance / background remove) **may** become listing primary photos — they remain the seller’s real item. (b) **Fully AI-generated creatives** (banners, lifestyle scenes, video frames) are **marketing-only exports** — never auto-set as primary listing photos. Prevents misrepresentation and trust risk. |
| 5 | Zeely / Canva deep links | **Defer.** Do not show until Phase 1–2 native tools are live and usage proves demand. Revisit as optional “power tools” links in Phase 3+ only — never as core UX. |

---

## 14. Implementation status (as of 2026-07-17)

### 14.0 Summary — where we are

**Verdict:** Native AI Marketing Hub **core is complete**. Sellers can generate text/images, share off-platform, promote a shop, buy Growth Pack / boost from the hub, and admins can measure hub→boost conversion. Dual LLM (OpenAI → Anthropic) is wired.

| Area | State |
|------|--------|
| Listing Marketing Hub (goods + vehicles) | **Live** |
| Post-create “Share this listing” | **Live** |
| Storefront “Promote your shop” | **Live** |
| Credits, safety, rate limits, audit log | **Live** |
| Boost funnel + Growth Pack + publish gate | **Live** |
| Admin hub→boost analytics | **Live** |
| Dual LLM fallback | **Live** |
| Dedicated `/account/marketing` page | **Live** |
| Shop banner generate → apply to storefront | **Live** |
| Featured storefront (homepage, 24h) | **Live** |
| Dedicated AI credit micro-packs (€2 / €5 / €10) | **Live** |
| Template / avatar video · sales forecast | **Deferred** |

**Ops gate before sellers see anything:** Monetization → Advertising → publish **AI Marketing Hub**, plus `AI_MARKETING_ENABLED` not `false`, plus at least one of `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` in production.

### 14.1 What is live

**Surfaces**

- Goods listing create/edit → form fields first, then collapsed Marketing Hub:
  - **Details:** Improve this listing (Accept) · Share off SellNearby (Copy, locked until title ≥ min length) · Best posting time (free)
  - **Pricing:** price fields first · Suggest price (free, collapsed)
  - **Photos:** upload first · photo tools / campaign pack / boost CTA (needs saved `listingId`)
- Vehicle listing create/edit → same pattern on Condition / Price & delivery / Photos (SEO title task hidden; description → seller notes)
- Post-create success → `ListingShareSuccessPanel` + hub `step="share"`
- Storefront settings (`/account/storefront`) → **Promote your shop** (`StoreMarketingHub`: shop URL, AI copy Accept into name/bio, social/outreach, posting time, shop banner + **Feature this shop**)
- Seller Marketing Hub home (`/account/marketing`) → quota, **Top up credits** / Growth Pack, links into listings / create / storefront promote
- Homepage → **Featured shops** strip (`GET /stores/featured`) when sellers buy homepage featured storefront

**Admin / ops**

- Publish toggle: Monetization → Advertising → `aiMarketingEnabled` (DB default **off**)
- Env kill switch: `AI_MARKETING_ENABLED=false`
- Same gate hard-blocks Growth Pack and AI credit pack APIs (`/seller/monetization/growth-pack/*`, `/seller/monetization/ai-credit-packs/*`) via `assertEffective` — UI alone is not enough
- Analytics: Monetization → Advertising → “Marketing Hub → boost analytics” (`GET /admin/monetization/marketing-hub-analytics`)
- Text: `OPENAI_API_KEY` (primary) and/or `ANTHROPIC_API_KEY` (fallback) in production
- Real bg-remove needs `REMOVE_BG_API_KEY` in production

**API** (`/seller/marketing-hub`)

| Endpoint | Status |
|----------|--------|
| `GET /quota` | Done |
| `POST /generate` | Done (9 text tasks) |
| `POST /image` | Done (enhance · bg-remove · banner) |
| `POST /image/apply` | Done |
| `POST /store-banner` | Done (1600×400 shop hero) |
| `POST /store-banner/apply` | Done (sets `stores.banner_url`) |
| `POST /price-suggest` | Done (free) |
| `POST /best-posting-time` | Done (free; listing, category, or shop-level heuristic) |
| `POST /campaign-pack` | Done (zip download) |

**Credit rules (live)**

- Verified: up to **10 free units / month**
- Unverified: no free quota; wallet debit if balance covers cost
- Paid overage: **€0.05 / unit** from SellNearby Credit
- Never auto-save AI output — Accept / Copy / Download only
- Price suggestion · posting time · campaign pack = **free**

**Text tasks**

| Task | Units | Apply |
|------|-------|-------|
| SEO title | 1 | Listing form / store name |
| Description | 2 | Listing form / vehicle seller notes / store bio |
| Keywords | 1 | Copy |
| Instagram caption | 1 | Copy |
| Facebook post | 1 | Copy |
| TikTok script | 2 | Copy (spoken script — not rendered video) |
| WhatsApp message | 1 | Copy |
| Email campaign | 2 | Copy |
| Seasonal promo | 1 | Copy |

**Image tasks**

| Task | Units | Notes |
|------|-------|-------|
| Image enhance | 3 | Sharp · may re-upload as listing photo |
| Background remove | 5 | remove.bg when keyed; Sharp studio fallback in non-prod |
| Share banner | 4 | Marketing-only · optional watermark + store logo |
| Shop banner | 4 | 1600×400 storefront hero · may apply to store |

**Price, timing & monetization**

| Feature | Cost | Notes |
|---------|------|-------|
| Price suggestion | Free | Median / p25–p75 from visible active comps |
| Best posting time | Free | Europe/Dublin; heuristics + chat/favourite hours when sample ≥ 25 |
| Campaign pack | Free | Zip of **latest existing** captions + banners (no new generation) |
| Boost handoff | — | Guided funnel when listing is **active**; `source` = `marketing_hub` \| `listings_table` \| `listing_edit` |
| Seller Growth Pack | Paid SKU | Default €6.99 · €5 Credit · 25% off one hub boost |
| AI credit micro-packs | Paid SKUs | €1.99→€2 · €4.99→€5 · €9.99→€10 SellNearby Credit (~40 / ~100 / ~200 units) |
| Featured storefront | Paid SKU | Default €2.99 · 24h homepage · gated by `featuredEnabled` |

### 14.2 What still needs implementing

Ordered by recommended next value (not engineering size alone).

#### A. Hardening & quality

| Item | Status | Notes |
|------|--------|-------|
| Stronger safety (prohibited categories, PII scrub before provider calls) | **Done** | `AiSafetyFilterService` + `scrubPii` · text + image paths |
| Per-listing rate limits | **Done** | `AI_MARKETING_LISTING_DAILY_GENERATION_LIMIT = 15` |
| Automated tests (safety / PII / billing / provider chain) | **Done** | `apps/api/test/ai-marketing-safety.test.ts` |
| Dual LLM provider / fallback | **Done** | OpenAI → Anthropic; logs actual `provider`/`model` |
| Seller tone / length controls (optional) | Not started | Irish English fixed in prompts |
| Broader metering / apply-to-listing integration tests | Not started | Pure unit coverage shipped; Nest/DB e2e later |

#### B. Alternate hub entry points

| Item | Status | Effort |
|------|--------|--------|
| Seller dashboard → dedicated AI Marketing Hub page | **Done** | `/account/marketing` · sidebar + dashboard quick link |
| Post-create / post-draft success → “Share this listing” | **Done** | `ListingShareSuccessPanel` + hub `step="share"` |
| Storefront settings → “Promote your shop” | **Done** | `StoreMarketingHub` |

#### C. Phase 4 — monetization loop

| Item | Status | Effort |
|------|--------|--------|
| True “generate creative → boost” funnel (guided, tracked) | **Done** | Campaign panel steps + `source` metadata |
| Seller Growth Pack SKU (credits + boost discount) | **Done** | `seller_growth_pack` · hub publish gate |
| Dedicated AI credit top-up packs (optional vs general wallet) | **Done** | `ai_credit_2` / `_5` / `_10` · hub publish gate · `/account/marketing` Top up |
| Admin analytics: hub usage → boost conversion | **Done** | Advertising tab + API |
| Generate shop banner → feature storefront | **Done** | `store_banner` generate/apply + `featured_store` homepage SKU + Featured shops strip |

#### D. Deferred advanced creatives

| Item | Status | Effort |
|------|--------|--------|
| Short template video (images + captions) | Deferred | XL — use TikTok script text for now |
| Avatar / talking-head video | Deferred | XL |
| Sales forecast | Deferred | L |
| Zeely / Canva optional deep links | Deferred (by decision) | S |

#### E. Known product gaps (live but thin)

| Gap | Detail |
|-----|--------|
| Photos hub needs saved listing | Image tools + campaign pack unavailable on unsaved drafts |
| Campaign pack empty if nothing generated | Zip only assembles prior generations |
| Logo / watermark | Banner options only — not standalone photo tools |
| Hub off by default | Admin must publish + env must allow |

### 14.3 What’s next (recommended order)

**0. Pilot (ops — do this before more build)**  
Publish AI Marketing Hub in Monetization → Advertising. Smoke one listing: generate → share → Top up credits / Growth Pack / boost. Confirm credits, unpublished gate, and analytics numbers move.

**1. ~~Dedicated seller Marketing Hub page~~** (`/account/marketing`) ✅ (2026-07-17)

**2. ~~Generate shop banner → feature storefront~~** ✅ generate/apply + `featured_store` homepage SKU (2026-07-17)

**3. ~~Dedicated AI credit micro-packs~~** ✅ `ai_credit_2` / `_5` / `_10` (2026-07-17)

**4. Keep deferred until demand is proven**  
Template video · avatar video · sales forecast · Gemini · tone/length UI · Zeely/Canva links.

---

## 15. Document history

| Date | Change |
|------|--------|
| 2026-07-16 | Initial product plan from Zeely usefulness review; native hub recommended |
| 2026-07-16 | Resolved §13 decisions; kicked off Phase 0/1 implementation |
| 2026-07-16 | Added keywords + Instagram / Facebook / TikTok social text tasks |
| 2026-07-16 | Phase 1 wrap-up: WhatsApp, email, seasonal + vehicle form panel |
| 2026-07-16 | Phase 2 kickoff: enhance, bg-remove, share banners |
| 2026-07-16 | Phase 2 P1: apply-to-listing, watermark, banner templates |
| 2026-07-16 | Phase 3 kickoff: price suggestions + store logo on banners |
| 2026-07-16 | Admin publish/unpublish toggle for AI Marketing Hub |
| 2026-07-16 | Best posting time (free, Europe/Dublin) |
| 2026-07-16 | Phase 3 wrap: campaign pack zip + boost handoff |
| 2026-07-17 | Seller-facing pricing consistency: live §9.1, unit/€ on buttons, docs vs README aligned |
| 2026-07-17 | Hub UX: form-first, Assist vs Share, social locked until title, collapsed by default |
| 2026-07-17 | Full status refresh: phase tables marked Done/Partial/Deferred; §14 backlog of what remains |
| 2026-07-17 | Hardening: expanded policy blocklist, PII scrub, listing daily cap (15), Vitest safety/billing tests |
| 2026-07-17 | Post-create share: `ListingShareSuccessPanel` + Marketing Hub `step="share"` after Save draft |
| 2026-07-17 | Phase 4: guided creatives→share→boost funnel, boost `source` attribution, Seller Growth Pack SKU |
| 2026-07-17 | Growth Pack catalog/intent/confirm gated by `AiMarketingAccessService.assertEffective` |
| 2026-07-17 | Admin Marketing Hub → boost analytics (Advertising tab + `marketing-hub-analytics` API) |
| 2026-07-17 | Dual LLM: OpenAI primary + Anthropic Claude fallback (`ANTHROPIC_API_KEY`) |
| 2026-07-17 | Storefront Promote your shop (`StoreMarketingHub`); posting time allows shop-level heuristic |
| 2026-07-17 | §14.0 summary + §14.3 next-order refresh (core complete → pilot first) |
| 2026-07-17 | Dedicated seller Marketing Hub page `/account/marketing` + sidebar/quick link |
| 2026-07-17 | Shop banner: `store_banner` generate + apply to storefront; feature CTA via listings |
| 2026-07-17 | AI credit micro-packs (`ai_credit_2` / `_5` / `_10`) + Marketing Hub Top up; hub marked pilot-ready |
| 2026-07-17 | Featured storefront SKU (`featured_store`) · homepage strip · banner CTA |
