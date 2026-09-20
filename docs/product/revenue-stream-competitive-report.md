# SellNearby revenue streams — competitive report

**Product:** SellNearby (Community Marketplace)  
**Audience:** founder, product, ops, investors  
**Date:** 19 September 2026  
**Status:** Analysis of live code + product docs vs public competitor models  
**Companion spec:** [master-blueprint-v1.md](./master-blueprint-v1.md)

---

## How to read this document

This is a **business-model report**, not an engineering spec. Numbers for SellNearby come from shipped defaults in code (`DEFAULT_PLATFORM_PRICING`, `platform_settings`) and the canonical blueprint. Competitor prices are **public, approximate, and category-dependent**; classifieds sites change them often and many dealer rates are quote-only.

**“Advaart”** is treated as **[Adverts.ie](https://www.adverts.ie)**. There is no Irish classifieds competitor of that name. Adverts.ie is the peer-to-peer sister of DoneDeal inside the Distilled group, and it is the brand this product already positions against.

---

## 1. Executive summary

SellNearby is a **hybrid**: a free-to-list community classifieds surface **plus** a Stripe Connect checkout that takes an **8–10% seller fee** on card sales. That is a different business than DoneDeal, Adverts, Gumtree, or Facebook Marketplace in Ireland.

| | SellNearby | DoneDeal / Adverts / Gumtree.ie | Facebook Marketplace (Ireland) |
|---|---|---|---|
| **Primary money** | Take-rate on card GMV (~80%+ of Year-1 revenue by plan) | Paid listings, bumps, spotlights, dealer subscriptions, display ads | Meta ads graph; Marketplace itself is a traffic product |
| **Sale commission** | **Yes** on card checkout (10% default, 8% verified) | **No** — seller keeps the sale price | **No** for local pickup in Ireland |
| **List for free?** | Yes (5 live listings until ID verify, then unlimited) | Often yes for general goods; motors/jobs/shops often paid | Yes |
| **Pay for visibility?** | Micro SKUs (€0.49–€9.99) | Bundles, bumps, spotlights, dealer packages | Boost listing via Meta ads auction |
| **In-app payments** | Live (card-only GMV) | Generally no (chat → cash / bank / meetup) | Checkout+delivery **not available in Ireland** |
| **Scale today** | Bootstrap (€3k–€15k Year-1 target) | Distilled group **€47m** revenue (2024) | Meta ads **hundreds of billions** USD globally |

**The strategic fork:** Irish users are trained that classifieds are **free (or a few euro to advertise) and zero commission**. SellNearby’s moat is **trust + card + verification + seller tools**. Its risk is that sellers **list here, close off-platform**, and the 10% fee never fires. Incumbents monetise **attention**. SellNearby monetises **completed card trades**, then layers classifieds-style visibility SKUs on top.

**Honest positioning (vs current SEO copy):** listing, messaging, browsing, standard ID verification, and cash/collection arranged in chat carry **no platform commission**. **Card checkout does.** Public metadata that says “no commission marketplace Ireland” is **not accurate** for Buy Now and should be tightened (see §10.3).

---

## 2. What kind of marketplace this is

Three archetypes matter:

1. **Attention classifieds** — DoneDeal, Adverts, Gumtree, Facebook Marketplace (Ireland). The platform sells *eyeballs*. The sale happens in the real world. Revenue is listing fees, promotions, dealer SaaS, and brand ads.
2. **Transactional marketplaces** — eBay, Etsy, Vinted (in paid markets), Facebook Checkout (US shipped). The platform sells *completed trades*. Revenue is a take-rate plus optional ads.
3. **SellNearby** — **transactional core, classifieds shell**. Free list/message like (1); 8–10% Connect fee like (2); micro upgrades for visibility, speed, and convenience.

Year-1 plan is explicit: **do not displace** DoneDeal / Adverts / Facebook nationally. Users **multi-home**. Win the job “I want a safer card sale with a verified counterparty and a proper shop,” not “I want every sofa in Ireland.”

---

## 3. SellNearby revenue architecture

### 3.1 Two books of money (how finance actually reports)

Admin **platform revenue reports** (`PlatformRevenueReportService`) split income into:

| Book | Source table | What it is | User-facing |
|------|----------------|------------|-------------|
| **Marketplace fees** | `Payment.platformFee` on `status = succeeded` | Stripe Connect `application_fee` on listing checkout | Seller fee; buyer pays the listed price |
| **Platform services** | `PlatformPurchase` (`succeeded`) | Direct invoices for boosts, featured, verification, credits, etc. | SKU checkout / SellNearby Credit |

**Not platform income (informational only):** buyer GMV and seller sales volume. GMV is the *tax base* for fees, not revenue.

**Not in those tables today:** brand display ads (sold offline; admin campaigns). Treat ads as a third, ops-invoiced book until self-serve exists.

**Not revenue:** buyer cashback. It is a **platform-funded cost / wallet liability** (1.5% of eligible card GMV).

### 3.2 Principles (live policy)

| Principle | Rule in product |
|-----------|-----------------|
| Free core | List, message, browse, standard ID verification, Stripe Connect onboarding |
| Pay for upside | Visibility, speed, convenience — not access |
| No buyer platform fee | Buyer pays listing price only |
| Card-only GMV | No bank-transfer checkout in growth phases |
| Micro-pricing | Impulse band roughly **€0.49–€4.99** (packs up to €9.99) |
| No subscriptions in v1 | One-shot SKUs; Starter/Pro/Premium ledgers still planned |
| EUR / Ireland | All catalog prices in euro |

### 3.3 Who pays whom

```text
Buyer  --card-->  Stripe  --gross listing price-->  seller Connect account
                              |
                              +-- application_fee (8–10%) --> SellNearby
                              +-- Stripe processing (typical EEA card ~1.4% + €0.25)
                                  usually deducted on the Connect charge

Seller  --card or credits-->  SellNearby  (boosts, featured, packs, …)

Buyer   --card or credits-->  SellNearby  (statement, early unlock, priority message)

Brand   --offline invoice-->  SellNearby  (display slots; not in-app checkout)
```

Buyers **do not** see a “platform fee” line on the item price. The take-rate is a **seller deduction**, same pattern as eBay/Etsy, unlike Gumtree Buyer Protection (UK) which is added **on top for the buyer**.

Cash, Revolut, or meetup arranged in chat: **€0 platform fee**. That path is still first-class (Chat + Reserve). It is also the main **revenue leak**.

---

## 4. Stream-by-stream inventory (this system)

Defaults below are code defaults as of this report. Admins can change fees and SKU amounts in **Admin → Monetization**. Feature flags: `boostsEnabled`, `featuredEnabled`, `displayAdsEnabled`, `aiMarketingEnabled`.

### 4.1 Platform fee on card GMV — **primary**

| | |
|---|---|
| **Status** | Live (Foundation) |
| **Default** | **10%** of listing price |
| **Verified sellers** | **8%**, auto-applied on `user.verification_approved` via `customPlatformFeePercent` (skipped if an admin override already exists) |
| **Admin overrides** | Per-seller custom % (UI range 3–15%) |
| **When it fires** | Succeeded card checkout only |
| **When it does not fire** | Chat-only deals, unpaid reserves, expired listings, refunds/disputes as configured |
| **Collection** | Stripe Connect `application_fee_amount` |

**Economics (blueprint):**

- Weighted gross fee after verification mix ≈ **9.2%** of card GMV  
- Cashback cost ≈ **1.5%** of eligible GMV  
- Contribution ≈ **~7.7%** of GMV **before** Stripe processing, hosting, AI COGS, and refunds  

**Worked example** — €80 listing, unverified seller:

| Line | Amount |
|------|--------|
| Buyer pays | €80.00 |
| Platform fee 10% | €8.00 → SellNearby |
| Seller gross after fee | €72.00 |
| Illustrative Stripe (EEA) | ~€1.37 (1.4% + €0.25) from the charge |
| Cashback grant (if eligible) | €1.20 liability to buyer wallet (not deducted from this seller) |

**Why this is the business:** bootstrap Year-1 mix is “almost entirely platform fee on small GMV.” Visibility SKUs are incidental until inventory is thick. Hitting **€3k–€15k** platform revenue implies roughly **€40k–€160k** Year-1 **card** GMV, not classifieds volume.

**Pros**

- Scales with successful trades, not with ad-spend competition.
- Aligns revenue with the product story (safer card, verified payouts).
- 2-point verified discount is a real incentive to complete KYC (trust + take-rate).
- Buyers are not nickeled at checkout (unlike some protection add-ons).

**Cons**

- **8–10% is high vs Irish classifieds culture** (zero commission). Serious sellers will compare to DoneDeal “I paid €15 to list and kept 100%.”
- Fee only exists if checkout is used. Density without card habit = hobby site.
- Stripe cost sits **on top** of the take-rate from the seller’s point of view.
- Cashback reduces net take. Report **gross fee** and **cashback cost** separately (the finance export already does).
- No buyer protection product yet, so the fee is “for the rails,” not for insurance — a conversion objection.

### 4.2 Listing boosts — **highest-ROI SKU**

| SKU | Price | Duration |
|-----|-------|----------|
| 7-day boost (`PAID_7D`) | **€1.99** | 7 days |
| 30-day boost (`PAID_30D`) | **€4.99** | 30 days |

- Ranking bump + **Boosted** badge; time stacks if already boosted.  
- Card, full SellNearby Credit, or hybrid.  
- Launch promo: **first boost 50% off** (`first_boost_discount_percent`).  
- Growth Pack can add **25% off** a Marketing Hub boost (once).  
- **Not slot-capped** — unlike featured.

This is the DoneDeal **bump** analogue, priced in the impulse band rather than category-dynamic tens of euro.

**Pros:** low friction; works even with thin GMV; trains sellers to pay for attention; wallet loop (cashback → boost).  
**Cons:** without density, a boost is a paid bump into an empty room; 50% first-boost promo delays cash; credit-funded boosts are often **not new cash** (see §6).

### 4.3 Featured listing slots — **scarcity**

| Placement | Price | Duration | Cap / day |
|-----------|-------|----------|-----------|
| Homepage | **€2.99** | 24h | **8** |
| Category | **€1.99** | 24h | **4** |

- **Card-only** (no credit mix).  
- Scarcity is the point: fill rate, not unlimited inventory.

**Ceiling (homepage only, 100% fill):** 8 × €2.99 × 365 ≈ **€8,731 / year**. Category adds more but still small vs GMV fees. Featured is a **quality / merchandising** line, not a scale engine, until prices or slot counts rise.

**Pros:** homepage real-estate is easy to understand; caps protect UX.  
**Cons:** tiny TAM at these prices; card-only is inconsistent with boosts; empty slots look like a dead marketplace.

### 4.4 Featured storefront — **shop merchandising**

| | |
|---|---|
| Price | **€2.99** / 24h homepage |
| Cap | **6** store slots / day |
| Status | Live |

Same scarcity logic as featured listings, aimed at **multi-item sellers** who already have a store brand. Complements paid store slots.

### 4.5 Fast-track verification — **speed, not access**

| | |
|---|---|
| Price | **€2.99** |
| What you buy | Priority in the ID-review queue (standard verify stays **free**) |
| Pay with | Card, credits, or hybrid |
| Side effect | Approval still flips fee **10% → 8%** |

**Pros:** monetises impatience without paywalling safety (a principle incumbents often violate by charging for “trusted” badges).  
**Cons:** only works if the queue is slow enough that €2.99 feels worth it; if review is already instant, the SKU dies.

### 4.6 Paid store slots — **serious-seller ARPU**

| SKU | Price | Unlocks |
|-----|-------|---------|
| First store | **Free** (mandatory before first listing) | 1 storefront |
| Extra slot (`store_slot_2` / `_3`) | **€4.99** | +1 store |
| Bundle (`store_bundle_3`) | **€7.99** | up to 3 stores |

Verified accounts only. One-time unlock, not a subscription. Listings, reviews, and branding are per store.

This is closer to **Adverts Shops / DoneDeal dealer presence** than to a bump: you are selling **a second brand**, not a search bump.

**Pros:** high intent; expands catalog without a monthly billing stack.  
**Cons:** one-shot (no recurring); v1 cap and UX still “serious hobbyist,” not Distilled dealer CRM.

### 4.7 Seller Growth Pack — **bundle / prepaid**

| | |
|---|---|
| Price | **€6.99** |
| Includes | **€5.00** SellNearby Credit + **25%** off one Marketing Hub boost |
| Status | Live |

Cash in now, usage later. Face-value credit is **below** cash collected (€6.99 vs €5.00), so this is healthier than AI packs on a cash basis **if** the credit is spent on SKUs that would otherwise be discounted anyway.

### 4.8 AI credit packs — **tooling ARPU + COGS**

| SKU | Cash price | Wallet credit | Approx. generation units (@ €0.05) |
|-----|------------|---------------|-------------------------------------|
| `ai_credit_2` | **€1.99** | €2 | ~40 |
| `ai_credit_5` | **€4.99** | €5 | ~100 |
| `ai_credit_10` | **€9.99** | €10 | ~200 |

Verified sellers also get **10 free AI units / month** (admin-overridable). Hub is gated by `aiMarketingEnabled`.

This stream is **not** a Distilled analogue. It is closer to **Canva / copy tools bundled into the marketplace**, with an upsell into boosts (“generate copy → boost this listing”).

**Pros:** differentiates vs empty classifieds; improves listing quality (SEO + conversion); prepaid cash.  
**Cons:** LLM API is real COGS; €1.99 for €2 credit is ~break-even **before** model cost — packs can be **loss-leaders**. Must be merchandised as “better listings → more card sales / boosts,” not as a profit centre on day one.

### 4.9 Buyer micro-SKUs

| SKU | Price | Status |
|-----|-------|--------|
| Purchase history statement (PDF) | **€0.99** | Live, card |
| Early cashback unlock | **€0.99** | Live; card / credits / hybrid |
| Priority message (pin in seller inbox, 24h) | **€0.49** | Live purchase type + chat fulfillment |

**Pros:** tiny, optional, doesn’t tax the purchase.  
**Cons:** will never move the P&L; priority message can annoy sellers if overused; statement PDF is a trust/compliance nicety more than a business.

### 4.10 Wallet / cashback — **retention loop, not a stream**

| Rule | Default |
|------|---------|
| Earn | **1.5%** of eligible **card** orders |
| Min order | **€5** |
| Caps | **€10 / order**, **€20 / month** |
| Unlock | **14 days** cooling |
| Expiry | **6 months** after unlock |
| Spend live on | Boosts, fast-track, early unlock |
| **Cannot** spend on | GMV checkout, featured slots, most other SKUs |

Credits never cash out. Top-ups exist via AI packs and Growth Pack.

**Accounting**

- Cashback grant = **cost** (and a liability until expiry).  
- Spending cashback on a boost = **SKU revenue in the purchase table** but **little or no new cash**.  
- Spending **top-up** credit = cash was already recognised at pack purchase; spend is fulfillment.

Do not add wallet spend to GMV fee and call it “revenue growth” without splitting **cash vs credit**.

### 4.11 Brand display ads — **third book, offline**

| | |
|---|---|
| Status | Admin campaign MVP live (homepage leaderboard, category sidebar, search inline) |
| Payment | **Offline** (invoice / bank / Payment Link) |
| Self-serve / CPM auction | **Not built** |
| Default flag | `displayAdsEnabled: **false**` until ops turns it on |

This is the **DoneDeal Media Sales** play, years earlier: sell brand inventory when traffic exists. Until then, empty ad shells harm trust.

Suggested (not coded) rate card: homepage highest weekly flat; sidebar mid; search inline lower.

### 4.12 Planned / not live (do not count)

| Item | Intent | Gate |
|------|--------|------|
| Buyer protection (€0.49 / €1.99) | Optional coverage | Legal |
| Starter / Pro / Premium seller packages | Recurring-ish bundles | After à la carte works |
| Urgent badge / auto-refresh | Extra visibility SKUs | Product |
| Wanted ads / buyer alerts (€1.99/mo) | First subscription | Volume |
| GMV wallet + card mix | Pay listings with Credit | Product |
| Advertiser self-serve ads | Scale the third book | Traffic |
| Bank transfer checkout | Irish habit | Ops / fraud |

---

## 5. Unit economics and Year-1 mix

### 5.1 Planned mix

Blueprint: **~80–85% platform fee** in Year 1; featured ~7%; boosts 2–7%; buyer SKUs ~3%; packages ~1%+. Year 2+ might shift toward 65–75% fee if visibility SKUs mature. **Bootstrap default ignores the stretch table.**

| Planning label | Horizon | Platform revenue | Marketing cash |
|----------------|---------|------------------|----------------|
| **Bootstrap (canonical)** | Year 1 | **€3,000 – €15,000** (stretch ~€25k) | **€30–€50 / month** |
| Ops cash BEP | ~3–8 months | Fee covers ~€50–€100/mo infra+marketing | ~€550–€1,100 GMV / month |
| Later operating | 24–36 months | €95k–€120k | Still micro until fees fund growth |
| Capital stretch (reference only) | Funded Year 1 | ~€165k–€175k | €120k–€250k ads |

Stretch fee line (€144k @ 9.2%) needs ~**€1.55M** Year-1 **card** GMV. That is a different company than bootstrap.

### 5.2 Illustrative contribution on €1,000 card GMV

Assume 50/50 unverified/verified sellers (9% blended), 1.5% cashback, ignore Stripe for a moment:

| | |
|---|---|
| Gross fee | €90 |
| Cashback cost | €15 |
| **Net fee contribution** | **€75 (7.5%)** |
| Plus incidental SKUs | Highly variable; treat as upside |

If **half of “sales” close in chat**, effective take on *true* merchandise volume is ~**3.8%**, and the P&L looks like a classifieds site **without** listing-fee volume.

### 5.3 SKU vs GMV sensitivity

Featured homepage at 50% fill: 8 × 0.5 × €2.99 × 30 ≈ **€359 / month**.  
That is one moderately busy weekend of card GMV at 10% (~€3,590 GMV). **Checkout conversion is the lever.** Boost/featured merchandising is the lever only after listings exist.

---

## 6. Cost of revenue and leakage (what the take-rate must cover)

| Cost | Nature |
|------|--------|
| **Stripe processing** | ~1.4% + €0.25 EEA cards (illustrative; Connect model dependent) |
| **Cashback** | 1.5% eligible GMV, capped |
| **AI generation** | Provider invoices; free monthly units are fully platform-funded |
| **Credit discounts** | First-boost 50%, Growth Pack 25% |
| **Refunds / disputes** | No escrow; buyer protection not live — dispute ops is cost without a SKU |
| **Fraud / moderation** | Human review queues (listings, messages, verification) |
| **Infra** | Hosting, email, storage |
| **Off-platform close** | Largest *opportunity* cost |

**Leakage map**

1. Buyer messages → meetup cash → mark sold (or don’t) → **0%**.  
2. Seller dual-lists on DoneDeal/FB and closes there.  
3. Seller never finishes Stripe Connect → Buy Now blocked → chat-only.  
4. Featured paid but search is empty.  
5. AI packs sold below model cost.

Reserve (free hold for ID-verified buyers) **helps GMV** by reducing “sold while chatting” without being a fee. It is an enabler, not a stream.

---

## 7. Competitor revenue models

### 7.1 Distilled group — one owner, three of your “competitors”

**Distilled Ltd** operates **DoneDeal.ie, Adverts.ie, Gumtree.ie, and Daft.ie**.

| Fact | Figure | Source (public) |
|------|--------|-----------------|
| Group revenue 2024 | **€47m** (was €41.38m in 2023) | Distilled accounts / Irish press, 2025 |
| Pre-tax profit 2024 | **€7.55m** (down 38% on costs) | same |
| Implied 2024 margin | ~16% EBIT-ish on those figures | derived |
| Group valuation (Nov 2024) | **€624m** (Adevinta sold 50% to Blacksheep for €312m) | RTÉ / filings |
| DoneDeal traffic (group claim) | **~6.4m monthly visitors** | Distilled |
| Adverts.ie | **~2m monthly users**, **200k+ new listings / month** | Distilled |

Comparing SellNearby to “DoneDeal vs Adverts vs Gumtree.ie” as if they were independent is misleading. **Listing-fee + dealer + display** is one portfolio P&L. They can keep Adverts cheap/free for P2P goods while DoneDeal extracts motors and dealers.

**Gumtree UK (gumtree.com)** is a **different** asset (Adevinta / UK classifieds), not Gumtree.ie. Both use the same *model family*. Ireland GTM should treat **Gumtree.ie as Distilled**, and **Gumtree UK as the classic free+promotions template**.

### 7.2 DoneDeal.ie — attention monopoly (especially motors)

**Job to be done:** “Put my ad where Irish buyers already search.”

**How they make money**

1. **Private listing bundles** — Lite / Standard / Premium; duration often 30 or **72 days**; prices **vary by category** (and, for cars, reportedly by asking price). Motors examples in 2026 user reports: on the order of **€10–€60** for a standard car ad, with Premium higher (one public complaint: ~€56 basic / ~€90 premium on a €25k car). General goods can be cheaper or free depending on section — always shown on Place Ad.  
2. **Bumps** — refresh to top of recency search (after a delay). Extra bumps sold à la carte.  
3. **Spotlight** — rotated premium slot at top of listings (often **5 days**), bundled in Premium / Super Booster.  
4. **Dealer subscriptions** — Cruise / Accelerator / Ultimate (prices via account managers, not public). DealerHub: stock upload, bump scheduler, history checks, price insights, financed-by-BOI lead share.  
5. **Display / media** — homepage takeovers, targeted display, section/keyword sponsorship (DoneDeal Media Sales).  
6. **Adjacencies** — dealer websites, finance partnerships (Bank of Ireland Finance). Dealers still earn **their** finance commission; DoneDeal sells the pipe.

**What they do *not* do:** take a % of the car or sofa price. No SellNearby-style Connect checkout as the core P&L.

**Pros (for Distilled)**

- Matches Irish habit: pay a bit to advertise, keep 100% of the sale.  
- Motors is a **high-WTP** category (dealers + private).  
- SEO + 20 years of backlinks = demand capture without Meta tax.  
- Recurring dealer ARPU is the real business; private ads are fill + brand.  
- Zero payment-fraud/payout ops on the trade itself.

**Cons**

- Private-seller backlash as prices rise (dynamic motors pricing).  
- No structured trust/payments → scams, no-shows, “is this available.”  
- Revenue is **decoupled from whether the item sold**.  
- Weak for low-ticket furniture if listing fee > expected margin.  
- Facebook siphoned casual inventory.

### 7.3 Adverts.ie (“Advaart”) — P2P volume, cheaper attention

**Job:** “Buy/sell stuff with neighbours; cars if DoneDeal feels dear.”

**How they make money**

1. **Most private goods ads free**, with a **60 listings / calendar month** allowance; extra ads **€1** each (T&Cs, 2025).  
2. **Always paid:** motors, shops, services, jobs, farming.  
3. **Private vehicles** (published table):

   | Asking price | Basic | Priority | Premium |
   |--------------|-------|----------|---------|
   | &lt; €2,000 | €3 | €6 | €7 |
   | €2,000–€3,999 | €4 | €7 | €9 |
   | ≥ €4,000 | €5 | €8 | €10 |

   Far below DoneDeal car packages — Adverts is the **pressure valve**.  
4. **Bumps:** each ad gets **€1 credit / 30 days** (basic bump). Paid **Priority bump €2–€4 / 3 days**; **Premium bump €3–€6 / 7 days** (category-dependent; A/B tests). Chronological listing + bump is the ranking system.  
5. **Adverts Shops** — business storefronts; fees via sales, not a public self-serve card like SellNearby’s €4.99 slot.

**Pros:** huge listing volume; low friction; sister SEO; cheap motors alternative.  
**Cons:** same zero-commission / zero-checkout limits; shop fees opaque; monetisation per listing is tiny so they need **industrial volume** (they have it). SellNearby cannot copy “€1 bump economics” without that volume.

### 7.4 Gumtree

#### Gumtree.ie

Distilled-owned Irish classifieds (jobs/services/trade heritage). Same **family** as Adverts: paid categories + promotions + business packages. Do not model it as a separate strategic enemy; it is **coverage** in the Distilled net.

#### Gumtree UK (gumtree.com) — the textbook free+upsell classifieds

**How they make money**

1. **Free private ads** in most categories (cars and kettles).  
2. **Promotions** (prices vary by category/location; examples published Jul 2023): **Bump Up ~£1.49**; **Featured 14-day ~£3.99**. Also Spotlight (homepage rotation, 7 days), Urgent (7 days), URL add-on.  
3. **Business / Pro** — listing fees, credit bundles, account managers. Motors dealer entry from **£9.99 inc. VAT / 30 days**.  
4. **Gumtree Payments / Buyer Protection** (when used): **no seller commission**; **buyer** pays **£0.70 + 5–10%** of item price, plus delivery. Optional.  
5. Display ads / partner referrals.

**Contrast with SellNearby:** Gumtree’s *optional* payments product charges the **buyer** a protection fee. SellNearby charges the **seller** a take-rate and keeps the buyer’s sticker price clean. Gumtree boosts are **the same product idea** as SellNearby boosts/featured, at similar micro prices, backed by **UK-scale liquidity**.

### 7.5 Facebook Marketplace — the social-graph free tier

**Ireland (relevant market)**

- List **free**.  
- Local pickup + Messenger + cash/Revolut: **€0 to Meta**.  
- **Checkout with delivery is not offered** in Ireland (Meta Help). So the US **10% selling fee** is **not** the Irish P&L.

**United States (for model comparison only)**

- Shipped Marketplace Checkout: **10% of transaction** (item + shipping + tax), **min $0.80**, plus payment-processor fees. Local pickup still free.

**Always-on Meta money**

- Marketplace is an **inventory hook** inside Facebook/Instagram.  
- Monetisation is **ads** (boost listing, Advantage+ , feed ads). Auction, not a price list. Meta ads revenue **$196bn (2025)** with **~$240bn** 2026 forecasts — Marketplace is a feature, not a company.

**Pros:** infinite distribution; zero listing fee; boosting is a native habit; local density in every parish.  
**Cons (Ireland):** scams, flaky buyers, no ID-verify rails, no structured payout, algorithm opacity, policy risk, you **do not own the customer**. Boosting costs can exceed SellNearby’s entire SKU catalog in a weekend.

---

## 8. Comparison matrices

### 8.1 What each platform actually sells

| Revenue ingredient | SellNearby | DoneDeal | Adverts.ie | Gumtree UK | FB Marketplace IE |
|---|---|---|---|---|---|
| Take-rate on sale | **8–10% card** | No | No | No (buyer protection is extra) | No (local) |
| Insertion / listing fee | No (verify gate instead) | Yes (esp. motors) | Motors/shops/jobs; €1 over 60 ads | Some business cats | No |
| Bump / refresh | **€1.99 / €4.99** | Paid / bundled | €1 credit + €2–€6 | ~£1.49+ | Organic recency + ads |
| Featured / spotlight | **€1.99–€2.99 / 24h** slots | Spotlight 5d in bundles | Priority/Premium ads | Featured 3/7/14d | Paid boost placements |
| Dealer / shop SaaS | One-time store slots | **Core P&L** | Shops | Pro credits | Facebook Shops / ads |
| Brand display | Admin offline MVP | **Mature media sales** | Group media | Yes | Core Meta ads |
| Payments product | **Core** | No | No | Optional buyer-paid | US only |
| Native AI tools | **Credit packs** | No | No | No | Meta AI is ads-side |
| Cashback wallet | **1.5%** | No | No | No | No |
| Subscriptions | Not in v1 | Dealer monthly | Shop deals | Pro | Ads budgets |

### 8.2 Who is charged

| | Seller | Buyer | Advertiser / dealer |
|---|---|---|---|
| **SellNearby** | Take-rate + SKUs | Optional €0.49–€0.99 conveniences | Offline banners |
| **DoneDeal** | Listing + bump + spotlight | Free to browse/contact | Dealers + brands |
| **Adverts.ie** | Sometimes listing + bumps | Free | Shops + group ads |
| **Gumtree UK** | Promos; business fees | Optional protection % | Dealers + brands |
| **FB Marketplace IE** | Optional boost ads | Free | All of Meta’s advertisers |

### 8.3 Unit of value

| Platform | You pay for | You get | If the item never sells |
|---|---|---|---|
| SellNearby card sale | % of price | Payout rails, receipts, fee | You pay **nothing** to the platform |
| SellNearby boost | Fixed euro | Rank + badge for N days | You already paid |
| DoneDeal Premium | Fixed euro | 72 days + bumps + spotlight | You already paid |
| Adverts bump | €2–€6 | 3–7 days in a higher rail | You already paid |
| FB boost | Auction budget | Impressions / messages | You already paid |

SellNearby’s **fee is success-based**; its **SKUs are not**. That is closer to eBay (final value + optional promo) than to DoneDeal (promo only).

### 8.4 Take-rate vs insertion-fee (same €500 sofa)

Assume the sofa sells.

| Path | Seller’s platform cost | Buyer extra | Platform revenue |
|---|---|---|---|
| SellNearby **chat + cash** | €0 | €0 | **€0** |
| SellNearby **card**, unverified | **€50** (10%) + Stripe | €0 (+ 1.5% credit later) | **€50** gross fee |
| SellNearby **card**, verified | **€40** (8%) + Stripe | €0 | **€40** |
| SellNearby + 7-day boost | fee + **€1.99** | €0 | fee + €1.99 |
| DoneDeal Lite (illustrative cheap goods) | ~€0–€15 insert | €0 | insert only |
| Adverts free + 1 premium bump | **€3–€6** | €0 | bump |
| Facebook IE pickup | **€0** or boost ads | €0 | ads if boosted |

**Read this twice:** on a €500 card sale, SellNearby charges **more than a typical Adverts promotion year**. On a **chat sale**, SellNearby charges **less than DoneDeal motors**. The model **only wins** if card + trust is the reason they chose you — or if SKU volume is huge at tiny prices (it will not be, in Year 1).

### 8.5 Liquidity vs monetisation (the real competitive gap)

| | Liquidity today | Monetisation sophistication | Trust / payments |
|---|---|---|---|
| DoneDeal | National, motors king | High (dealers + media) | Low-structure |
| Adverts | High P2P volume | Medium (cheap ads) | Low-structure |
| Gumtree.ie | Distilled spillover | Medium | Low-structure |
| FB Marketplace IE | Highest casual local | Ads machine | Low-structure |
| **SellNearby** | **Wedge / bootstrap** | **High for its size** (fee + 14 SKUs + ads MVP + AI) | **Highest by design** |

You are **over-built on monetisation relative to liquidity**. That is correct for a solo bootstrap (fee exists the day the first card clears). It is fatal if SKU UI is louder than “there are buyers here.”

---

## 9. Pros and cons — SellNearby vs each rival

### 9.1 vs DoneDeal.ie

**SellNearby advantages**

- Success-based fee: no €50 insert on a car that never sells (if they even list cars — catalog policy is community/family-safe, **not** a motors assault).  
- ID verification **free**; fast-track optional. DoneDeal’s “trust” is mostly reputation-by-volume.  
- Card + receipts + payouts + statements — a different job.  
- Storefronts, reserves, cashback loop, AI hub: seller **software**, not just an ad form.  
- Micro SKUs cheaper than DoneDeal motors packages.  
- Curated / haram-free catalog (values niche incumbents will not brand).

**SellNearby disadvantages**

- No 6.4m monthly visitors. SEO will not beat DoneDeal on “cars Ireland.”  
- 8–10% feels expensive vs “I already pay DoneDeal to advertise.”  
- No dealer CRM, finance attach, or media sales force.  
- Card-only GMV fights Irish cash-on-collection habit.  
- Multi-home is required; DoneDeal remains the demand default.

**Verdict:** Do **not** compete on motors insertion fees. Compete on **non-motor, trust-sensitive, card-willing** trades and serious community sellers who already waste hours on FB flakes.

### 9.2 vs Adverts.ie

**SellNearby advantages**

- Checkout and KYC; Adverts is bump-and-hope.  
- Store slots are **self-serve and cheap** vs shop sales process.  
- Quality/moderation story (review queues, keyword filters).  
- Buyer cashback is a reason to **pay on-platform**.

**SellNearby disadvantages**

- Adverts can afford free ads because **200k listings/month** already exist.  
- €1 extra-ad fee and €2–€6 bumps are psychologically “classifieds money”; 10% is “marketplace money.”  
- Sister DoneDeal SEO halo.

**Verdict:** Closest **P2P** rival. Steal **serious** sellers (verify + shop + card), not casual €5 listings. Casual volume will stay on Adverts/FB.

### 9.3 vs Gumtree (IE and UK)

**SellNearby advantages vs UK template**

- Seller-side fee + free buyer sticker vs Gumtree charging **buyers** 5–10%+£0.70 for protection. Easier buyer conversion **if** they trust the 10% is the seller’s problem.  
- Ireland-local product, verification, family-safe policy.  
- Credits spend into **your** SKUs, not a generic ads wallet.

**Disadvantages**

- Gumtree UK has national liquidity and a 25-year promotions catalog (Urgent, URL, Spotlight…).  
- Gumtree.ie is another Distilled surface — same holding company as DoneDeal/Adverts.  
- Your €1.99 boost without search traffic is worse value than Gumtree’s £1.49 bump **in London**.

**Verdict:** Copy **promotions UX** (bump / featured / urgent) — you already did. Do not copy **UK pricing power** until you have UK-like traffic.

### 9.4 vs Facebook Marketplace

**SellNearby advantages**

- You **own** the listing URL, SEO, reviews, and payout relationship.  
- Safer payments in a market where Meta **does not** run checkout.  
- Rules, reserves, and moderation vs “is this still available.”  
- Predictable SKU prices vs ads auction.  
- No algorithm eviction of the shop.

**Disadvantages**

- FB is installed on every phone; CAC is ~zero for listers.  
- Local density is default.  
- Boosting on Meta can **outspend** your catalog and still win messages.  
- Dual-listing: FB for reach, SellNearby for “the careful buyer” — they may still pay cash on FB.

**Verdict:** Facebook is the **distribution** competitor, not the **monetisation** competitor. Year-1 GTM already says: recruit sellers **from** FB/DoneDeal and ask them to **add the SellNearby link**. Revenue happens when the **careful** buyer prefers card here.

### 9.5 Composite: where SellNearby is structurally strong / weak

**Structurally strong**

1. Diversified **SKU surface** for a tiny marketplace (most startups only have ads or only have a fee).  
2. **Verified 8%** is a clean behavioural lever.  
3. Wallet creates a **closed loop** classifieds lack.  
4. Finance reporting already separates GMV fees vs platform invoices.  
5. Free core is ethically and competitively right for Ireland.

**Structurally weak**

1. **Take-rate without buyer protection** is a hard sell.  
2. **SEO “no commission”** contradicts the live 10% fee.  
3. **Chat bypass** is first-class UX and anti-revenue.  
4. Featured TAM is capped in the low four figures per year at current prices.  
5. Display ads and AI packs need **traffic and COGS discipline** respectively.  
6. Distilled is one company with **€47m** and a **€624m** valuation — they can subsidise Adverts to block you.

---

## 10. Strategic implications

### 10.1 Guardrails (already in the blueprint — keep them)

- Do not paywall listing, chat, or verification.  
- Do not add a **buyer** checkout tax (stay unlike Gumtree Protection).  
- Do not launch Starter/Pro **subscriptions** before à la carte SKUs convert.  
- Do not turn on display ads on empty pages.  
- Do not plan Year-1 as Distilled-scale media revenue.

### 10.2 What to emphasise in GTM (money follows the job)

Lead with **job**, not fee:

> Free to list and message. Optional card checkout with seller payouts. Verified people. You pay extra only to stand out.

Avoid “DoneDeal but newer.” Avoid “no commission” unless you mean **no insertion fee / no fee on cash collection**.

### 10.3 Messaging fix (product integrity)

Current public metadata (`browse-metadata`, `llms.txt`, SEO ops) still pushes **“no commission.”** Code charges **10%/8%** on card. That gap will get you compared in bad faith (forums, competitors, future ads regulator).

Recommended split language:

- **Free classifieds path:** no listing fee, no commission on meetup/cash.  
- **Card path:** seller service fee 8–10%, shown in seller earnings UI (already on earnings page).

### 10.4 Revenue-quality ranking (focus)

| Priority | Stream | Why |
|----------|--------|-----|
| P0 | **Card GMV fee** | 80%+ of plan; everything else is decoration until this works |
| P0 | Stripe Connect completion | Unlocks P0 |
| P1 | Verification → 8% | Trust + slightly lower take still beats 0% chat |
| P1 | Boost merchandising | Only after there is a search results page with competition |
| P2 | Featured (listings + stores) | Scarcity merchandising |
| P2 | Growth Pack / AI | ARPU + listing quality; watch AI COGS |
| P3 | Buyer SKUs | Nice, not a plan |
| P3 | Offline display | When you can screenshot real traffic |
| Later | Protection, subscriptions, self-serve ads | Legal / volume gated |

### 10.5 If card adoption stays low

You accidentally become **Adverts without 2m users**. Options then (product decisions, not implemented):

- Insertion fees on some categories (DoneDeal path) — **conflicts** with free-core principle.  
- Stronger nudge: reserve + Buy Now as default, chat still allowed.  
- Lower take-rate (e.g. 5%) to make card the obvious choice vs cash.  
- Accept bootstrap €3–15k and treat SKUs as learning, not P&L.

Do not raise boost prices to “make up” for missing GMV — that is the Distilled private-ad play without Distilled demand.

### 10.6 Competitive opportunity (narrow)

The Irish market’s hole is **not another bump**. It is:

**Verified local trade with card, receipts, a real shop, and adult moderation** — for people who are tired of Facebook flakes and not selling a €25k car.

That hole supports a **take-rate**. It does not support Distilled-style **€47m** on advertising until you have Distilled-style **attention**.

---

## 11. Source map

### This product (code & docs)

- `docs/product/master-blueprint-v1.md` — §§1–4, 11–12, Appendix A & D  
- `docs/product/monetization.md`, `storefront-model.md`, `display-ads-admin-campaigns.md`, `ai-marketing-hub.md`  
- `apps/api/src/modules/monetization/lib/boost.lib.ts` — `DEFAULT_PLATFORM_PRICING`  
- `apps/api/src/modules/monetization/mappers/monetization.mapper.ts` — fee/cashback defaults  
- `apps/api/src/modules/monetization/services/platform-fee.service.ts`  
- `apps/api/src/modules/payments/lib/stripe-charge.lib.ts`  
- `apps/api/src/modules/statements/services/platform-revenue-report.service.ts`  
- `packages/types/src/monetization.ts`

### Competitors (public, check live Place Ad screens before quoting prices externally)

- DoneDeal Help: Place ad, bundles, Spotlight, bump/renew; [sales.donedeal.ie](https://www.sales.donedeal.ie/) dealer/media  
- Adverts Help: [Where do fees apply?](https://help.adverts.ie/hc/en-us/articles/360001337049-Where-do-fees-apply), [Private vehicle listing fees](https://help.adverts.ie/hc/en-us/articles/360001337129-Private-Vehicle-Listing-Fees), [Bumps](https://help.adverts.ie/hc/en-us/articles/360001336969-How-they-work), T&Cs (60 ads / €1)  
- Gumtree Help: [Ad charges](https://www.gumtree.com/info/safety/p/advice-guides/buying-and-selling-on-gumtree/ad-charges-on-gumtree/), [Promoting an ad](https://www.gumtree.com/info/safety/p/selling/gumtree-ad-promotion-costs/), [How fees are charged](https://www.gumtree.com/info/safety/p/payments/how-fees-and-selling-costs-are-charged/)  
- Meta: Onsite Checkout terms (US 10%); Help Centre “checkout with delivery isn’t available in your location” for Ireland  
- Distilled financials: RTÉ / Irish Examiner / Independent coverage of 2022–2024 accounts and the 2024 Blacksheep/Adevinta transaction  

Competitor **prices move**. Treat §7 tables as **model**, not a live rate card.

---

## 12. One-page takeaway

SellNearby makes money like a **small eBay** (take-rate + optional promos + future ads) while Irish incumbents make money like **newspapers** (charge to publish, keep the reader-to-seller transaction off the books). Facebook in Ireland is a **free newspaper with a world-class ads engine attached**.

Until card GMV is real, the 14 live SKUs are a **toolkit**, not a business. Until verification and Connect are habitual, the 10% fee is a **PDF**. The competitive win is not matching DoneDeal’s insertion prices or Meta’s CPM — it is being the **only local place** where a careful buyer can pay a verified seller and both get a receipt, without pretending that is free.
