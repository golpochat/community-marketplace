# SellNearby AI Marketing Hub — Product Plan

**Status:** Phases 0–3 implemented (API + listing editor Marketing Hub widgets)  
**Date:** 2026-07-16  
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

1. Listing editor (goods + vehicles) → per-step **Marketing hub** shell (`ListingMarketingHub`): shared quota chrome; widgets for copy/social + posting time (details), price suggestion (pricing), photos/banners + campaign pack/boost (photos)
2. Seller dashboard → “AI Marketing Hub” (later)
3. Storefront settings → “Promote your shop” (later)
4. Post-publish success screen → “Share this listing” (later)

**Non-goals (v1–v2)**

- Running paid Meta / TikTok / Google campaigns on behalf of sellers
- Guaranteeing ROAS
- Replacing Canva / professional agencies for brand-heavy work
- Deep white-label of Zeely or similar SaaS

---

## 4. Phased feature roadmap

Complexity key: **S** = small · **M** = medium · **L** = large · **XL** = very large  
Cost key: relative AI/API cost per use (Low / Med / High)

### Phase 0 — Foundations (prerequisite)

| Item | Complexity | Notes |
|------|------------|-------|
| AI provider abstraction layer | M | Single internal API; swap models without rewriting features |
| Credit / usage metering | M | Align with SellNearby Credit / wallet concepts |
| Prompt + safety policy layer | M | Block prohibited categories, PII leakage, misleading claims |
| Listing context assembler | S–M | Pass listing + storefront + category + location into prompts |
| Audit log of generations | S | Support moderation and abuse review |
| Rate limits + abuse controls | S | Per seller / per listing / per day |

**Exit criteria:** Can generate one safe text asset from a listing with metered usage and logging.

---

### Phase 1 — Text marketing (ship first)

Highest seller value, lowest cost, fastest build.

| Feature | Complexity | AI cost | Priority | Seller outcome |
|---------|------------|---------|----------|----------------|
| AI Product Description | S | Low | P0 | Better listing copy |
| AI SEO Title | S | Low | P0 | Clearer, searchable titles |
| AI Keywords / tags | S | Low | P0 | Better discovery |
| AI Instagram Caption | S | Low | P0 | Ready-to-post social |
| AI Facebook Ad / post copy | S | Low | P0 | Ready-to-post social |
| AI TikTok Script | S | Low | P1 | Short-form talking points |
| AI Seasonal Promotions | S–M | Low | P1 | Christmas / Back-to-school / local events |
| AI Email Campaign draft | S–M | Low | P1 | Store / buyer follow-up drafts |
| AI WhatsApp Campaign message | S | Low | P1 | Local seller outreach templates |
| Tone / length / locale controls | S | Low | P1 | Irish English, short/long, friendly/pro |

**Suggested UX**

- Side panel on listing form: generate → preview → accept / edit / regenerate
- One-click copy for social / WhatsApp / email
- “Irish English” default; optional Gaeilge later

**Exit criteria:** ≥3 text tools live; sellers can apply description + title + one social caption in under 2 minutes.

---

### Phase 2 — Image enhancement & banners

| Feature | Complexity | AI cost | Priority | Seller outcome |
|---------|------------|---------|----------|----------------|
| AI Background Removal | M | Med | P0 | Cleaner product photos |
| AI Image Enhancement | M | Med | P0 | Sharper, brighter listing images |
| AI Banner Creator | M–L | Med | P0 | Story / feed / marketplace banner sizes |
| AI Logo Placement | M | Low–Med | P1 | Brand consistency on creatives |
| AI Watermarking | S–M | Low | P1 | Protect seller photos |
| Template pack (local marketplace) | M | Low | P1 | “For sale near you”, “Collection only”, etc. |

**Suggested UX**

- From listing images: enhance / remove background / create share card
- Export PNG/WebP at Instagram, Facebook, WhatsApp, and SellNearby card sizes
- Always keep original image; AI variants are separate assets

**Exit criteria:** Seller can produce one shareable listing card and one enhanced product image from existing photos.

---

### Phase 3 — Video & advanced growth intelligence

| Feature | Complexity | AI cost | Priority | Seller outcome |
|---------|------------|---------|----------|----------------|
| AI Video Generator (short) | XL | High | P1 | 15–30s listing promo |
| AI Talking-head / avatar video | XL | High | P2 | Optional; quality-sensitive |
| AI Best Posting Time | M | Low | P1 | Based on category + local engagement patterns |
| AI Price Suggestions | M–L | Low | P0 | Comparable listings + demand signals |
| AI Sales Forecast | L | Low–Med | P2 | Directional only; never a guarantee |
| Campaign pack export (zip + captions) | M | Low | P1 | Offline posting kit |
| Optional “open in Zeely / Canva” deep link | S | — | P3 | Non-core convenience only |

**Exit criteria:** Optional short video from listing images + captions; price suggestion live for major categories.

---

### Phase 4 — Platform-native promotion loop

Connect AI Hub to existing SellNearby monetization (boosts / featured / storefront).

| Feature | Complexity | Priority |
|---------|------------|----------|
| “Generate creative → Boost listing” flow | M | P0 |
| “Generate shop banner → Feature storefront” | M | P1 |
| Seller growth packs (credits + boost discount) | M | P0 |
| Admin analytics: hub usage → boost conversion | M | P1 |
| Partner / sponsor creatives into display slots later | L | Later |

**Exit criteria:** Measurable uplift from Hub users buying boosts vs non-users.

---

## 5. Recommended build order (summary)

```text
Month 0–1   Phase 0 foundations + AI Product Description + SEO Title
Month 1–2   Captions, keywords, WhatsApp, seasonal prompts
Month 2–4   Background removal, enhancement, banner creator
Month 4–6   Price suggestions + best posting time + boost handoff
Month 6+    Short video generator + forecast + advanced packs
```

Do **not** start with video. Video is expensive, quality-variable, and slower to ship. Text + image enhancement will cover most sellers first.

---

## 6. Build complexity matrix

| Capability | Eng effort | Ops / compliance | Dependency risk | Notes |
|------------|------------|------------------|-----------------|-------|
| Text generation suite | Low–Med | Med (claims, prohibited items) | Low | Highest ROI |
| Image enhance / bg remove | Med | Med (photo rights) | Low–Med | Need reliable image pipeline |
| Banner templates | Med | Low | Low | Mostly layout + LLM copy |
| Price suggestions | Med–High | High (must be advisory) | Low | Needs marketplace data quality |
| Best posting time | Med | Low | Low | Needs engagement telemetry |
| Sales forecast | High | High | Low | Easy to overpromise — label carefully |
| Short video | Very High | Med–High | Med | Highest unit cost |
| Avatar UGC video | Very High | High | High | Brand/trust risk if uncanny |
| Paid ad account automation | Very High | Very High | Very High | Out of scope for near term |

---

## 7. Recommended AI / service providers (by feature)

Prefer an **abstraction layer** so providers can be swapped. Use EU-friendly data handling where practical (GDPR).

### Text (descriptions, SEO, captions, scripts, email, WhatsApp)

| Option | Role | Notes |
|--------|------|-------|
| **OpenAI GPT-4.1 / GPT-4o-mini** | Primary / fallback | Strong quality; use mini for cheap drafts |
| **Anthropic Claude** | Primary alternative | Good for long copy and safer tone |
| **Google Gemini Flash** | Cost-efficient batch | Good for keywords / variants |
| **Self-hosted open model (later)** | Cost control at scale | Only after volume justifies ops |

**Recommendation:** Start with **one primary LLM + one fallback**. Use cheaper models for regenerate / bulk; premium model for “best” generation.

### Image enhancement & background removal

| Option | Best for | Notes |
|--------|----------|-------|
| **remove.bg / Photoroom API** | Background removal | Proven, fast |
| **Cloudinary AI / imgproxy + AI add-ons** | Enhance, crop, watermark | Fits media CDN workflows |
| **Replicate (BRIA / rembg / GFPGAN-class models)** | Flexible enhance / rembg | Pay-per-use; good for experiments |
| **Sharp + local pipeline** | Watermark, resize, format | Keep deterministic transforms in-house |

**Recommendation:** In-house for watermark/resize; managed API for rembg/enhance initially.

### Banner / static ad layouts

| Option | Best for | Notes |
|--------|----------|-------|
| **In-house template engine** (HTML/Canvas/SVG → image) | Brand control, cost | Preferred long-term |
| **Canva Connect API** (optional) | Power users | Optional export, not core |
| **Bannerbear / Placid** | Quick template rendering | Useful MVP shortcut |

**Recommendation:** Start with **in-house templates + LLM copy**. Avoid depending on Canva for core UX.

### Short video generation

| Option | Best for | Notes |
|--------|----------|-------|
| **Runway / Luma / Kling-class APIs** | Generative video clips | Costly; quality varies |
| **Shotstack / Creatomate / JSON2Video** | Template video from images + captions | Better cost/control for marketplace |
| **HeyGen / Arcads** | Avatar talking head | Optional later; higher cost |

**Recommendation:** Prefer **template video from listing images + voiceover/captions** before generative avatar video.

### Price suggestion & forecast

| Option | Best for | Notes |
|--------|----------|-------|
| **Internal stats + rules + LLM explanation** | Primary | Own comps from SellNearby data |
| LLM alone | Do not use as sole price source | Hallucination risk |

**Recommendation:** Pricing = **marketplace comps first**, LLM only to explain the suggestion.

### Optional external tools (non-core)

| Tool | Use |
|------|-----|
| Zeely | Optional “advanced Meta ads” deep link for power sellers |
| Canva | Optional design export |
| Meta Ads Manager | Seller-owned ad accounts only |

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

---

## 9. Monetization model

Align with SellNearby’s free-to-start, micro-priced philosophy (see master blueprint).

### 9.1 Live pricing (canonical — what sellers see today)

| Rule | Live value |
|------|------------|
| Free monthly quota | **10 credit units / calendar month** for **verified** sellers only |
| Unverified | **No free units**; wallet debit allowed if balance covers cost |
| Paid overage | **€0.05 per credit unit** from SellNearby Credit wallet |
| Daily generation cap | **30** jobs / seller / day (abuse control) |
| Free tools (0 units) | Price suggestion · best posting time · campaign pack download |
| Seller visibility | Hub chrome shows free units + wallet € + €/unit; each paid button shows **units · ≈€** |

Unit costs match §14 tables and `AI_MARKETING_TASK_UNIT_COSTS` in `@community-marketplace/types`.

### 9.2 Future packaging options (not live SKUs)

| Package | What sellers get | Suggested price band (IE) | Notes |
|---------|------------------|---------------------------|-------|
| Free starter | Limited AI generations / month (live: 10 text-equivalent units) | €0 | Already live for verified |
| AI Credits packs | Pay-as-you-go top-ups | Micro packs e.g. €1.99 / €4.99 / €9.99 | **Not shipped** — sellers top up SellNearby Credit today |
| Seller Growth Pack | Credits + 1 boost discount | e.g. €6.99–€14.99 | Phase 4 |
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
| 1 | Free monthly AI quota | **Verified sellers only.** Unverified sellers get no free quota (can still buy AI credits later). Suggested starting free allowance for verified: **10 text generations / calendar month** (tunable in platform settings). |
| 2 | Wallet | **Same wallet as SellNearby Credit** (`BuyerWallet`). Debit AI usage from that balance; add ledger types for AI spend / free quota. |
| 3 | Locale | **Irish English only** at launch. No Gaeilge prompts in Phase 1. |
| 4 | AI images as listing primary photos | **Recommended hybrid (adopted):** (a) **Seller-photo edits** (enhance / background remove) **may** become listing primary photos — they remain the seller’s real item. (b) **Fully AI-generated creatives** (banners, lifestyle scenes, video frames) are **marketing-only exports** — never auto-set as primary listing photos. Prevents misrepresentation and trust risk. |
| 5 | Zeely / Canva deep links | **Defer.** Do not show until Phase 1–2 native tools are live and usage proves demand. Revisit as optional “power tools” links in Phase 3+ only — never as core UX. |

---

## 14. Implementation status — Phase 1–3 wrapped

**Phases 1–3 core seller tools are complete** (text, images, price, posting time, campaign pack, boost handoff, admin publish).

**Credit rules**

- Verified sellers: up to **10 free credit units / month**
- Unverified: no free quota; wallet debit allowed if balance covers cost
- Never auto-save AI output — Accept (listing fields) or Copy/Download (marketing)
- Paid overage: **€0.05 per credit unit** from SellNearby Credit wallet
- **Seller UI:** each paid action shows units + ≈€ before generate; hub chrome shows free remaining + wallet + €/unit rate
- **Price suggestions are free** (comparable listing stats; not LLM-metered)
- **Admin publish required:** platform setting `aiMarketingEnabled` (admin / super-admin → Monetization → Advertising). Env `AI_MARKETING_ENABLED=false` remains a hard kill switch.

**Text tasks (Phase 1)**

| Task | Units | Apply |
|------|-------|-------|
| SEO title | 1 | Listing form |
| Description | 2 | Listing form / vehicle seller notes |
| Keywords | 1 | Copy |
| Instagram caption | 1 | Copy |
| Facebook post | 1 | Copy |
| TikTok script | 2 | Copy |
| WhatsApp message | 1 | Copy |
| Email campaign | 2 | Copy |
| Seasonal promo | 1 | Copy |

**Image tasks (Phase 2)**

| Task | Units | Notes |
|------|-------|-------|
| Image enhance | 3 | Sharp · may re-upload as listing photo |
| Background remove | 5 | remove.bg when `REMOVE_BG_API_KEY` set; Sharp studio fallback in non-prod |
| Share banner | 4 | Sharp composite · marketing-only (feed / story / card) · optional watermark + store logo |

**Price & timing (Phase 3)**

| Feature | Cost | Notes |
|---------|------|-------|
| Price suggestion | Free | Median / p25–p75 from visible active comps by category (+ area, condition, vehicle attrs when present) |
| Best posting time | Free | Europe/Dublin windows; Irish category heuristics + chat/favourite hour buckets when sample ≥ 25 |
| Campaign pack | Free | Zip of latest captions + share banners for the listing (assembly only; no new generation) |
| Boost handoff | — | CTA on Photos step opens existing listing boost checkout |

**Surfaces**

- Generic listing create/edit → **form fields first**, then collapsed Marketing Hub:
  - Details: Improve this listing (Accept) · Share off SellNearby (Copy, locked until title ≥ 10 chars) · Best posting time (free)
  - Pricing: price fields first · Suggest price (free, collapsed)
  - Photos: upload first · photo tools / campaign pack (collapsed)
- Vehicle listing create/edit → same pattern on Condition / Price & delivery / Photos steps

**Seller UX rules (2026-07-17)**

1. Title & description (or vehicle notes) come **above** the hub.
2. Hub sections are **collapsed by default** so the form stays primary.
3. Social/outreach tools stay **locked** until the listing title has at least 10 characters.
4. Accept fills form fields; Copy is for off-platform paste only.
5. Free units first; then €0.05/unit from SellNearby Credit (no in-hub checkout).

**Engineering**

| Area | Status |
|------|--------|
| `POST /seller/marketing-hub/image` | Done |
| `POST /seller/marketing-hub/image/apply` | Done |
| `POST /seller/marketing-hub/price-suggest` | Done |
| `POST /seller/marketing-hub/best-posting-time` | Done |
| `POST /seller/marketing-hub/campaign-pack` | Done (zip download) |
| Admin publish toggle `aiMarketingEnabled` | Done (Monetization → Advertising) |
| Migrations through `20260716200000_ai_marketing_publish_toggle` | Apply via migrate deploy |
| Marketing exports under `system-assets/{userId}/marketing/` | Done |

**Still deferred (later)**

- Video generator / avatar video
- Sales forecast
- Zeely / Canva deep links

**Phase 2 P1 (done)**

- One-click **Apply to listing** for enhance / bg-remove
- Banner templates: classic · for sale near you · collection only · priced to sell
- Optional **SellNearby watermark** on share banners

**Phase 3 wrap (done)**

- Stats-first **price suggestions** on Pricing / Price & delivery steps
- Optional **store logo** on share banners (uses listing store `logoUrl` when present)
- **Admin / super-admin publish toggle** for the hub (`aiMarketingEnabled`)
- **Best posting time** (Europe/Dublin heuristics + chat/favourite signals when sample ≥ 25)
- **Campaign pack export** (zip of latest captions + banners)
- **Boost handoff** (“Boost this listing” from Photos step → existing boost checkout)

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
