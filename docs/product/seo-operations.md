# SellNearby.ie — SEO keyword priority & monthly operations

> **See also:** [SEO audit & technical roadmap](./seo-audit.md) · [Launch checklist](./launch-checklist.md)  
> **Audience:** Founder / ops · **Market:** Ireland (en-IE) · **Updated:** July 2026

This document is the **operational layer** on top of the technical SEO already implemented in `apps/web`. It does not use `<meta name="keywords">` (Google ignores it). Keywords are targeted via **titles, descriptions, H1 copy, URLs, and content pages**.

---

## Part 1 — Keyword priority matrix (30 queries)

Priority legend: **P1** = ship now (page exists) · **P2** = strengthen copy / internal links · **P3** = new content or listings needed · **P4** = long-term / competitive head terms

### Brand (protect and own)

| Priority | Target query | Canonical URL / surface | Action |
|----------|--------------|-------------------------|--------|
| P1 | sellnearby | `/` | Monitor GSC position; ensure homepage title includes brand |
| P1 | sellnearby.ie | `/` | Same; verify Organization schema |
| P1 | sell nearby ireland | `/` | Reinforce in homepage H1/subcopy (already present) |
| P2 | sellnearby contact | `/contact` | Correct support email live; request indexing |

### Core marketplace (homepage + browse)

| Priority | Target query | Canonical URL / surface | Action |
|----------|--------------|-------------------------|--------|
| P1 | buy and sell locally ireland | `/` | Default meta description + hero |
| P1 | community marketplace ireland | `/` | Hero badge + JSON-LD Organization |
| P2 | local marketplace ireland | `/listings` | Browse title/description in `browse-metadata.ts` |
| P2 | sell online ireland no fees | `/`, `/about` | Emphasise “no commission” on homepage + about |
| P2 | free marketplace ireland | `/` | Mention in about/help — avoid thin dedicated page |
| P3 | classifieds ireland | `/listings` | Needs listing volume + backlinks; no keyword-stuff page |
| P4 | donedeal alternative | *Future guide* | One honest comparison guide when ready — not a spam landing page |

### Local geo — cities (programmatic)

| Priority | Target query | Canonical URL / surface | Action |
|----------|--------------|-------------------------|--------|
| P1 | buy sell dublin | `/listings/dublin` | City intro copy + internal links from footer/hub |
| P1 | second hand furniture dublin | `/listings/dublin` + category filter | Cross-link from `/categories/furniture` |
| P1 | buy sell cork | `/listings/cork` | Same pattern |
| P1 | buy sell galway | `/listings/galway` | Same pattern |
| P2 | local listings limerick | `/listings/limerick` | Add 2–3 internal links from `/local/limerick` |
| P2 | used items waterford | `/listings/waterford` | Encourage sellers to tag area in listings |

### Local geo — counties (content hub)

| Priority | Target query | Canonical URL / surface | Action |
|----------|--------------|-------------------------|--------|
| P2 | how to sell safely in dublin | `/local/dublin` | County guide copy |
| P2 | sell second hand wicklow | `/local/wicklow` | County page + listings in Wicklow |
| P2 | local selling tips kerry | `/local/kerry` | County page |
| P3 | sell locally donegal | `/local/donegal` | Lower volume — maintain quality, not volume of pages |

### Category commercial (dynamic + category routes)

| Priority | Target query | Canonical URL / surface | Action |
|----------|--------------|-------------------------|--------|
| P1 | {category} for sale ireland | `/categories/{slug}` | Auto metadata: “{Category} for sale” |
| P2 | used furniture for sale ireland | `/categories/furniture` (or slug) | Category description + active listings |
| P2 | second hand bikes ireland | Category + `/listings/dublin` | Listing titles with natural keywords |
| P2 | baby items for sale near me | Category + geo browse | UGC listings drive long-tail |

### Informational / trust (guides & help)

| Priority | Target query | Canonical URL / surface | Action |
|----------|--------------|-------------------------|--------|
| P1 | how to price used furniture ireland | `/guides/how-to-price-used-furniture-ireland` | Live; share on social |
| P1 | best places to sell locally ireland | `/guides/best-places-to-sell-locally-ireland` | Mention SellNearby naturally in body |
| P1 | selling safely face to face ireland | `/guides/selling-safely-face-to-face-ireland` | Link from `/safety` |
| P2 | listing photos that sell | `/guides/listing-photos-that-sell` | Internal link from seller onboarding |
| P2 | is it safe to buy on marketplace ireland | `/help`, `/safety` | FAQ schema on `/help` |

### Product long-tail (UGC — highest ROI at scale)

| Priority | Target query | Canonical URL / surface | Action |
|----------|--------------|-------------------------|--------|
| P1 | {item} {area} e.g. vintage bike rathmines | `/listings/{slug}-{id}` | Slug URLs + Product JSON-LD |
| P1 | {item} price ireland | Listing detail | Price in title/OG/schema Offer |
| P2 | {brand} {model} used ireland | Listing detail | Seller fills title well; moderation quality |

**Rule:** Never create empty location or category pages only for keywords. Each URL must have real listings or substantive copy (already how the codebase works).

---

## Part 2 — Page-type keyword playbook

| Page type | Title pattern | Description must include | Primary JSON-LD |
|-----------|---------------|--------------------------|-----------------|
| Homepage | `SellNearby — Buy and sell locally in Ireland` | community, local, Ireland, no commission | Organization, WebSite |
| Browse | `Browse listings` or `{Category} for sale` | Ireland, local sellers, trust | — |
| Category | `{Category} for sale` | category + Ireland + local | — |
| City | `{City} listings` (via location page) | second-hand, county, meet-up safety | — |
| County | `Sell safely in {County}` | local tips + link to browse | — |
| Listing | `{Title} — €{price}` | condition, delivery, area | Product, BreadcrumbList |
| Store | `{Seller name} on SellNearby` | location, verified | LocalBusiness |
| Guide | `{Guide title}` | Irish context, practical steps | Article |
| Help | `Help centre` | FAQ topics | FAQPage |

---

## Part 3 — Monthly SEO checklist

Use this every month after pilot launch. Tick in order; skip items already green in Search Console.

### Week 1 — Measurement & crawl health

- [ ] **Search Console** → Performance: note impressions, clicks, average position (brand vs non-brand)
- [ ] **Search Console** → Pages: indexed count vs active listings (target trending up)
- [ ] **Search Console** → Experience → Core Web Vitals: all “Good” on homepage + sample listing
- [ ] **Sitemap** `https://sellnearby.ie/sitemap.xml` — opens and includes new listings/stores
- [ ] **robots.txt** — dashboards/auth still disallowed
- [ ] Fix any new **Coverage** errors (404, redirect loops, soft 404)

### Week 2 — On-page & content

- [ ] Publish **1 new `/guides` article** (pick from P2/P3 queries above not yet covered)
- [ ] Add **1 real success story** to `/success-stories` when available
- [ ] Review top 10 landing pages in GSC — improve meta description if CTR &lt; 2%
- [ ] Confirm new listings use **slug URLs** (not bare UUID links in sitemap)
- [ ] Internal links: footer + `ContentHubLinks` point to new guide/county pages

### Week 3 — Local & off-page (manual)

- [ ] Encourage **10+ new listings** in focus area (e.g. Dublin west) — UGC &gt; meta tags
- [ ] Share 1 guide or listing on **local Facebook / community group** (natural link + brand mention)
- [ ] **Google Business Profile** — update if created; post one update/month
- [ ] **Bing Webmaster Tools** — submit sitemap if not done
- [ ] Outreach: 1 local blog, newsletter, or partnership mention (optional)

### Week 4 — Technical spot-check

- [ ] **Rich Results Test** on 1 listing, `/help`, 1 store page
- [ ] **Facebook Sharing Debugger** on homepage + 1 listing OG image
- [ ] **GA4** (when live): organic sessions, landing pages, bounce rate on `/listings/*`
- [ ] Production deploy includes latest `main` (contact email, SEO, auth fixes)
- [ ] Log top 5 **Queries** in GSC → adjust copy on matching pages (no stuffing)

### Quarterly (every 3 months)

- [ ] Re-read [seo-audit.md](./seo-audit.md) Part 8 (“What NOT to do”) — no bought links, no thin pages
- [ ] Audit duplicate titles/descriptions in GSC
- [ ] Review competitor SERPs for 5 P2 keywords — note content gaps for guides only
- [ ] Consider one **honest comparison** guide (e.g. community marketplace vs commission) if P4 query matters

---

## Part 4 — Launch checklist crosswalk

Maps to [launch-checklist.md](./launch-checklist.md) marketing/SEO row:

| Launch item | This doc section | Owner |
|-------------|------------------|-------|
| GSC property verified | Week 1 | Founder |
| Sitemap submitted | Week 1 | Founder |
| GA4 `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Week 4 | Dev + deploy |
| Contact/support email correct on `/contact` | Brand P1 | Dev + deploy |
| 50–100 listings in one geo | Week 3 monthly | Ops / growth |
| Guides content velocity | Week 2 monthly | Founder / content |
| Off-page links | Week 3 monthly | Founder |

---

## Part 5 — KPI targets (6-month pilot)

| KPI | Tool | Month 1 | Month 6 target |
|-----|------|---------|----------------|
| Indexed pages | Search Console | Baseline | 80%+ of active public URLs |
| Brand query position (“sellnearby”) | Search Console | Top 10 | Top 3 |
| Organic impressions | Search Console | Baseline | +20% MoM (months 3–6) |
| Organic clicks | Search Console | Baseline | Growth with impressions |
| Core Web Vitals | Search Console | All Good | Maintain |
| Active listing URLs in sitemap | Manual / API | Pilot set | Scales with sellers |

---

## Part 6 — What we deliberately do not do

- **Meta keywords tag** — unused; no SEO benefit
- **Thousands of thin “{item} in {town}” pages** — penalty risk
- **Keyword stuffing in listing titles** — moderation should prevent
- **Fake “DoneDeal alternative” doorway pages** — one honest guide later if needed

For technical implementation status, see [seo-audit.md](./seo-audit.md).
