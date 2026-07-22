# SellNearby.ie — Comprehensive SEO Audit & Enterprise Roadmap

**Scope:** Full platform audit (web app, API, infra, live site)  
**Date:** July 2026 (audit) · **Implementation completed:** July 2026  
**Verdict:** **Search-ready for pilot.** Phases 0–4 are implemented in code; production deploy + Search Console/GA4 setup remain manual.

---

## Executive summary

| Dimension | Grade (audit) | Grade (post-implementation) | Enterprise target |
|-----------|---------------|----------------------------|-------------------|
| **Technical SEO** | D+ | **B+** | A |
| **On-page SEO** | C+ (listings only) | **A−** | A |
| **Content SEO** | C | **B+** | A |
| **Local SEO** | B− (positioning) | **B+** | A |
| **Structured data** | C− | **B+** | A |
| **Performance (Core Web Vitals)** | B (estimated) | **B** (monitoring wired) | A |
| **Off-page / authority** | Not started | Not started | Required |
| **Measurement** | F | **C** (hooks ready) | A |

**Post-implementation assessment:** Crawl infrastructure (`robots.txt`, sitemap, `metadataBase`, canonicals, noindex), SSR browse/store pages, category and location landing pages, JSON-LD (Product, Organization, WebSite, FAQ, LocalBusiness, BreadcrumbList), content hub (guides, counties, success stories), listing slug URLs, `llms.txt`, and `next/image` for listings are **in code**. Live production at `sellnearby.ie` still needs a **web container rebuild** to pick up changes, plus manual Search Console / GA4 registration.

**Still manual:** Google Search Console, Bing Webmaster Tools, GA4 property + env vars, Google Business Profile, link building, log-file analysis at scale. **Operations:** [seo-operations.md](./seo-operations.md) (keyword matrix + monthly checklist).

---

## Part 1 — What exists today (strengths)

### 1. Listing detail pages — best SEO surface

This is genuinely good work for a marketplace at pilot stage:

- **Server-rendered metadata** via `generateMetadata` on `/listings/[id]`
- **Rich social previews**: price, sale badges, delivery hints, custom 1200×630 OG images (`/api/og/listing/[id]`)
- **Product JSON-LD** (`schema.org/Product` + `Offer` + optional `Brand`)
- **Server-side initial fetch** so crawlers get real title/description in HTML
- **On-demand cache revalidation** when listings update
- **Short links** (`/l/{code}`) for sharing, with redirect to canonical listing URL

**Justification:** Google can index individual products if it discovers them. Social shares (WhatsApp, Facebook, iMessage) will look professional — important for a community marketplace that grows through word-of-mouth.

**Key files:**

- `apps/web/src/app/(site)/listings/[id]/page.tsx`
- `apps/web/src/lib/listing-og-metadata.ts`
- `apps/web/src/components/listings/listing-json-ld.tsx`
- `apps/web/src/app/api/og/listing/[id]/route.ts`
- `apps/web/src/app/api/revalidate/listing/[id]/route.ts`

### 2. Brand & locale foundations

- `<html lang="en-IE">` — correct for Ireland
- Global title template: `%s | SellNearby.ie`
- Root description: *"Buy and sell within your community in Ireland"*
- PWA manifest with proper name, icons, theme colors
- Ireland-focused copy on homepage (local, trusted, no commission)

**Justification:** Signals geographic relevance to Google for Irish local queries like "buy sell near me Ireland" or "local marketplace Dublin".

**Key files:**

- `apps/web/src/app/layout.tsx`
- `apps/web/src/app/manifest.ts`
- `packages/config/src/platform.ts`

### 3. Content pages (trust & E-E-A-T)

Static pages exist and are linked from footer:

`/about`, `/help`, `/safety`, `/community-rules`, `/terms`, `/privacy`, `/contact`, `/success-stories`

**Justification:** These support **E-E-A-T** (Experience, Expertise, Authoritativeness, Trustworthiness) — especially important for a marketplace where Google evaluates trust heavily. The founder story on `/about` is a real asset.

### 4. Internal linking (basic but present)

- Footer links to key pages
- Category shortcuts → `/listings?categoryId=...`
- Listing breadcrumbs (UI)
- Seller cards → `/store/{sellerSlug}`
- Similar listings on detail pages

### 5. Search infrastructure (product, not SEO)

Meilisearch indexes listings with title, description, geo, category slug. This powers in-app search, not Google crawl — but it means the data pipeline already exists to generate sitemaps later.

**Key files:**

- `apps/api/src/modules/search/services/search-indexing.service.ts`
- `apps/api/src/modules/search/listeners/listing-index.listener.ts`

### 6. Performance-conscious PWA config

Document navigations use `NetworkOnly` in the service worker — HTML is not stale-cached. Good for SEO freshness.

**Key file:** `apps/web/next.config.ts`

---

## Part 2 — Critical gaps (historical audit findings)

> **Historical:** Findings below describe the platform **before** the July 2026 SEO implementation. They are kept for audit trail. For live status, use [Part 5](#part-5--implementation-status) / production checklist (Part 11) and [seo-operations.md](./seo-operations.md).

### P0 — Blocking issues for ranking (pre-fix)

#### 1. No `robots.txt` (confirmed live 404)

**Impact:** Crawlers get no instructions. Private routes (`/admin`, `/seller`, `/auth`) are not disallowed. Sitemap is not referenced.

**Enterprise standard:** Dynamic `robots.ts` with disallow rules for dashboards, auth, chat, API routes; allow listings, stores, content pages; sitemap URL.

#### 2. No XML sitemap

**Impact:** Google must discover listings by following links. With client-rendered browse/store pages, discovery is very slow. A marketplace with thousands of listings needs programmatic sitemaps (listings, stores, categories, static pages).

**Enterprise standard:** Split sitemaps (listings, stores, categories, pages), auto-updated on listing create/update, submitted to Search Console.

#### 3. Browse & store pages are client-rendered

| Page | Crawler sees |
|------|----------------|
| `/listings` | Skeleton shell; results load via JavaScript |
| `/store/{slug}` | Empty shell; data loads in `useEffect` |
| `/listings/[id]` | Full content (SSR) ✓ |

**Impact:** The two highest-traffic indexable page types (category browse, seller storefronts) may appear **empty to Googlebot**. This is the single biggest technical SEO risk after missing sitemap.

**Justification:** Google can render JS, but it is slower, less reliable, and consumes crawl budget. Enterprise marketplaces (eBay, DoneDeal, Facebook Marketplace public pages) serve listing grids server-side.

**Key files:**

- `apps/web/src/app/(site)/listings/page.tsx` — client browse
- `apps/web/src/app/(site)/store/[sellerSlug]/page.tsx` — client storefront

#### 4. No `metadataBase` or canonical URLs

`NEXT_PUBLIC_APP_URL` defaults to `http://localhost:3000` and is **not baked into the production Docker build** (`Dockerfile.web` only sets `NEXT_PUBLIC_API_URL`).

**Impact:**

- OG tags on social shares may point to `localhost`
- No `<link rel="canonical">` anywhere
- Duplicate URL risk: `/l/{code}` vs `/listings/{uuid}` vs query-param filters

**This may already be hurting share previews in production** unless the env is set at build time manually.

**Key files:**

- `apps/web/src/lib/site-url.ts`
- `infra/docker/Dockerfile.web`

#### 5. Dashboard & auth pages are indexable

`/seller/*`, `/buyer/*`, `/admin/*`, `/auth/*`, `/chat` have **no `noindex`** metadata and no robots disallow.

**Impact:** Thin/duplicate content in Google index, potential leakage of URL structure, wasted crawl budget. Enterprise apps always noindex authenticated areas.

---

### P1 — High impact for growth

#### 6. URL structure is not keyword-friendly

| Entity | Current URL | SEO-friendly alternative |
|--------|-------------|--------------------------|
| Listing | `/listings/a1b2c3d4-...` (UUID) | `/listings/vintage-bike-dublin-a1b2c3d4` |
| Category | `/listings?categoryId=uuid` | `/categories/electronics` or `/listings/electronics` |
| Store | `/store/{sellerSlug}` ✓ | Good — but needs dynamic metadata |

**Justification:** URLs are a ranking signal. "vintage-bike-dublin" in the path helps long-tail queries. DoneDeal, Adverts.ie, Gumtree all use slug-based URLs. UUID-only URLs are a competitive disadvantage.

#### 7. Store pages have static metadata

Every store shows title **"Store | SellNearby.ie"** regardless of seller name. No description, no OG image, no `LocalBusiness` schema.

**Impact:** Store pages — key for seller-branded searches ("John's shop SellNearby") — won't rank.

#### 8. No analytics or Search Console integration

No GA4, GTM, Plausible, or `google-site-verification` in codebase.

**Impact:** Organic traffic, index coverage, Core Web Vitals in search, and keyword performance cannot be measured. **You cannot improve what you don't measure.** Enterprise SEO is data-driven.

#### 9. Static pages have title-only metadata

`/about`, `/help`, `/safety`, etc. inherit the root description but have no unique descriptions, OG images, or structured data. `/help` has FAQ content but no `FAQPage` schema (missed rich result opportunity).

#### 10. API exposes more than SEO needs

Public `GET /api/listings/:id` returns non-active listings and seller email. Crawlers that hit the API directly (or SSR that doesn't filter) may index sold/expired listings and PII.

**Impact:** Index pollution, trust signals, potential GDPR concern — not classic SEO but affects quality.

---

### P2 — Enterprise polish

| Gap | Why it matters |
|-----|----------------|
| No `WebSite` + `SearchAction` schema | Sitelinks search box in Google |
| No `Organization` schema | Brand knowledge panel |
| No `BreadcrumbList` JSON-LD | Rich breadcrumb snippets |
| No `FAQPage` on `/help` | FAQ rich results |
| No `AggregateRating` on listings/stores | Star ratings in search (when review volume supports it) |
| No custom `not-found.tsx` | Poor 404 UX, wasted crawl budget |
| Listing images use `<img>` not `next/image` | CLS risk, slower LCP |
| No `images.remotePatterns` in Next config | Can't optimize CDN images |
| No blog/content hub | No long-tail keyword capture |
| No `hreflang` | Fine for IE-only launch; needed if expanding |
| No `llms.txt` | Emerging AI discoverability standard |
| Redis `allkeys-lru` eviction | Unrelated to SEO directly, but job failures could delay indexing updates |

---

## Part 3 — Page-by-page SEO status

| Page / route | Indexable? | SSR content? | Meta quality | Schema | Priority fix |
|--------------|------------|--------------|--------------|--------|--------------|
| `/` (homepage) | Yes | Partial (featured SSR, nearby client) | Title only | None | Add Organization + WebSite schema, unique description |
| `/listings` | Yes | **No** (client) | Title only | None | **SSR listing grid** |
| `/listings/[id]` | Yes | **Yes** | **Excellent** | Product | Add canonical, noindex when sold |
| `/store/[slug]` | Yes | **No** (client) | Static "Store" | None | **SSR + dynamic meta + LocalBusiness** |
| `/l/[code]` | Redirect | N/A | N/A | N/A | Ensure canonical points to listing URL |
| `/about`, `/help`, etc. | Yes | Yes | Title only | None | Unique descriptions + FAQ schema |
| `/auth/*` | Should be **no** | Client | Title only | None | **noindex** |
| `/seller/*`, `/admin/*` | Should be **no** | Client | None | None | **noindex + robots disallow** |
| `/chat` | Should be **no** | Client | None | None | **noindex** |

---

## Part 4 — Competitive context (Ireland)

Direct competitors for local classifieds/marketplace search:

| Competitor | SEO maturity | Your advantage | Their advantage |
|------------|--------------|----------------|-----------------|
| **DoneDeal.ie** | Very high — slug URLs, category pages, massive index, strong domain authority | No commission, community trust, modern UX | 20+ years of backlinks, millions of indexed pages |
| **Adverts.ie** | High | Same as above | Brand recognition, DA |
| **Facebook Marketplace** | Very high (facebook.com DA) | Independent, no FB dependency | Built-in audience |
| **Gumtree.ie** | Medium-high | Local focus | Established brand |

**Honest truth:** You will not outrank DoneDeal for "cars for sale Ireland" in year one. That is a domain authority game. SEO strategy should target:

1. **Long-tail local queries** — "sell furniture Lucan", "buy bike near Swords", "local marketplace [town]"
2. **Brand queries** — "SellNearby", "SellNearby.ie"
3. **Niche/community angles** — "no commission marketplace Ireland", "verified local sellers"
4. **Seller-branded** — "[seller name] store SellNearby"

---

## Part 5 — Enterprise-level enhancement roadmap

> **Implementation status:** Phases **0–4 coded** (July 2026). Items marked **Manual** require ops/marketing action after deploy.

### Phase 0 — Foundation (week 1–2) — ✅ Coded

| Action | Status | Notes |
|--------|--------|-------|
| Add `robots.txt` + XML sitemap | ✅ | `apps/web/src/app/robots.ts`, `sitemap.ts` |
| Set `NEXT_PUBLIC_APP_URL=https://sellnearby.ie` in prod Docker build | ✅ | `Dockerfile.web`, `docker-compose.prod.yml` |
| Add `metadataBase` in root layout | ✅ | `apps/web/src/app/layout.tsx` |
| `noindex` on auth + all dashboard route groups | ✅ | Seller, buyer, admin, super-admin, auth, chat |
| Register Google Search Console + Bing Webmaster Tools | **Manual** | Verify domain, submit sitemap |
| Add GA4 (or privacy-friendly Plausible) | ✅ hooks | `SiteAnalytics` — set env vars on deploy |

**Expected outcome:** Google starts discovering and indexing listing pages systematically.

### Phase 1 — Crawlability (week 3–6) — ✅ Coded

| Action | Status | Notes |
|--------|--------|-------|
| SSR `/listings` browse with filters | ✅ | Server fetch + `ListingsBrowseClient` initial data |
| SSR `/store/[slug]` with dynamic `generateMetadata` | ✅ | `server-storefront.ts`, `buildStoreMetadata` |
| Canonical URLs on all public pages | ✅ | `lib/seo/canonical.ts` |
| Category landing pages (`/categories/{slug}`) | ✅ | SSR browse per category |
| Custom 404 with helpful links | ✅ | `apps/web/src/app/not-found.tsx` |
| `noindex` sold/expired/removed listings | ✅ | `listing-indexability.ts` on detail metadata |

**Expected outcome:** Browse, category, and store pages enter the index; impressions begin in Search Console.

### Phase 2 — Rich results & on-page (week 7–10) — ✅ Coded

| Action | Status | Notes |
|--------|--------|-------|
| `WebSite` + `SearchAction` on homepage | ✅ | `HomepageJsonLd` |
| `Organization` schema | ✅ | Homepage JSON-LD |
| `LocalBusiness` on store pages | ✅ | `StoreJsonLd` |
| `BreadcrumbList` on listings | ✅ | `buildListingBreadcrumbSchema` |
| `FAQPage` on `/help` | ✅ | `FaqJsonLd` + shared FAQ data |
| Unique meta descriptions on all static pages | ✅ | `publicPageMetadata` on content pages |
| Default OG image for non-listing pages | ✅ | `lib/seo/og-default.ts` |
| Listing slug URLs (`/listings/{slug}-{id}`) | ✅ | `lib/listing-slug.ts`, 301 from bare UUID |

**Expected outcome:** Rich snippets appear; CTR improves even before ranking improves.

### Phase 3 — Content & authority (month 3–6) — ✅ Coded (content); Manual (authority)

| Action | Status | Notes |
|--------|--------|-------|
| Local SEO content hub — "How to sell safely in [county]" | ✅ | `/local`, `/local/[county]` (26 counties) |
| `/success-stories` expanded with real case studies | ✅ | 6 case studies + internal links |
| Blog/guides (even 2–4 posts/month) | ✅ (seed) | `/guides`, 4 articles — add more over time |
| Google Business Profile (if applicable) | **Manual** | Local pack for brand |
| Structured internal linking (hub → category → listing) | ✅ | Footer, `ContentHubLinks`, cross-links |
| `rel="next/prev"` on paginated browse | ✅ | `PaginationRelLinks` on `/listings` |

**Expected outcome:** Organic traffic from informational queries; domain authority begins building.

### Phase 4 — Enterprise scale (month 6+) — ✅ Mostly coded

| Action | Status | Notes |
|--------|--------|-------|
| Programmatic location pages — `/listings/dublin`, `/listings/cork` | ✅ | 10 cities via `listings/[id]` location slug |
| `AggregateRating` schema when review volume supports it | ✅ | Listings (seller reviews) + stores |
| Core Web Vitals monitoring + `next/image` for listings | ✅ | `WebVitalsReporter`, `OptimizedListingImage` |
| International hreflang (if expanding beyond IE) | ⏸ Deferred | IE-only launch — add when multi-market |
| `llms.txt` for AI search engines | ✅ | `/llms.txt` route |
| Link building / PR / community partnerships | **Manual** | Domain authority |
| A/B test title/meta CTR in Search Console | **Manual** | After GSC live |
| Log file analysis (bot crawl patterns) | **Manual** | Enterprise crawl budget — later |

---

## Part 6 — Off-page SEO (cannot be coded)

Technical SEO gets you **eligible** to rank. **Ranking** requires:

1. **Backlinks** — local press, community groups, Irish tech blogs, seller advocacy
2. **Brand mentions** — "SellNearby" appearing across the web
3. **User signals** — CTR, dwell time, return visits (indirect)
4. **Content velocity** — fresh listings = fresh crawl (UGC is an asset)
5. **Social proof** — shares, reviews, trust badges

**Recommendation:** For pilot, focus on getting 50–100 active sellers in one geographic area (e.g. Dublin west). Hyper-local density creates natural word-of-mouth links and branded searches — more valuable than broad SEO in year one.

---

## Part 7 — Measurement framework (enterprise)

Once GA4 + Search Console are live, track:

| KPI | Tool | Target (6 months) |
|-----|------|-------------------|
| Indexed pages | Search Console | 80%+ of active listings |
| Organic impressions | Search Console | Growth month-over-month |
| Organic clicks | Search Console | Baseline → +20% monthly |
| Average position (brand queries) | Search Console | Top 3 for "SellNearby" |
| Core Web Vitals | Search Console + PageSpeed | All "Good" |
| Crawl errors | Search Console | < 1% of pages |
| OG preview quality | Manual + Facebook Debugger | 100% listings |
| Bounce rate (organic) | GA4 | < 60% on listings |

---

## Part 8 — What NOT to do

| Temptation | Why avoid |
|------------|-----------|
| Buy backlinks | Google penalty risk |
| Keyword stuffing in listing titles | Hurts trust; moderation should prevent |
| Auto-generate thousands of thin location pages | Panda penalty risk |
| Block all JS rendering instead of fixing SSR | Breaks the app |
| Copy DoneDeal's content structure blindly | Different DA; won't work the same |
| Prioritize SEO over product-market fit in pilot | No listings = nothing to index |

---

## Part 9 — Priority matrix (summary)

```
                    HIGH IMPACT
                        │
    ┌───────────────────┼───────────────────┐
    │  Sitemap + robots │  SSR browse/store │
    │  metadataBase     │  Category pages   │
    │  noindex private  │  Listing slugs    │
    │  Search Console   │  Content hub/blog │
LOW ├───────────────────┼───────────────────┤ HIGH
EFFORT                  │                   EFFORT
    │  FAQ schema       │  Link building    │
    │  OG defaults      │  Location pages   │
    │  Custom 404       │  hreflang (later) │
    └───────────────────┼───────────────────┘
                        │
                    LOW IMPACT
```

**Start top-left quadrant first** — maximum impact, minimum effort.

---

## Part 10 — Codebase reference (audit inventory)

### SEO utilities & routes (implemented)

| File / route | Purpose |
|--------------|---------|
| `apps/web/src/app/robots.ts` | Crawl rules + sitemap reference |
| `apps/web/src/app/sitemap.ts` | Dynamic XML sitemap (listings, categories, guides, local, cities) |
| `apps/web/src/app/llms.txt/route.ts` | AI discoverability manifest |
| `apps/web/src/app/layout.tsx` | `metadataBase`, default OG, analytics |
| `apps/web/src/lib/site-url.ts` | Canonical URL helpers |
| `apps/web/src/lib/listing-slug.ts` | SEO slug URLs `{title}-{uuid}` |
| `apps/web/src/lib/seo/canonical.ts` | Canonical + `publicPageMetadata` |
| `apps/web/src/lib/seo/schema.ts` | Organization, WebSite, FAQ, Breadcrumb, LocalBusiness |
| `apps/web/src/lib/seo/sitemap-data.ts` | Sitemap entry builder |
| `apps/web/src/lib/server-browse.ts` | SSR browse fetch |
| `apps/web/src/lib/server-storefront.ts` | SSR store fetch |
| `apps/web/src/lib/seo/content/` | Counties, guides, locations, success stories |
| `apps/web/src/app/(site)/categories/[slug]/` | Category landing pages |
| `apps/web/src/app/(site)/guides/` | Selling guides hub + articles |
| `apps/web/src/app/(site)/local/` | County selling guides (26) |
| `apps/web/src/components/listings/location-browse-page.tsx` | City pages `/listings/{city}` |
| `apps/web/src/components/listings/optimized-listing-image.tsx` | `next/image` for listings |
| `apps/web/src/components/analytics/site-analytics.tsx` | GA4 / Plausible |
| `apps/web/src/components/analytics/web-vitals-reporter.tsx` | CWV → GA4 |

### Launch checklist cross-reference

`docs/product/launch-checklist.md`: **Marketing / SEO — ✅ Phases 0–4 coded** — deploy + GSC/GA4 manual steps in Part 11 below.

---

## Part 11 — Production deploy checklist (SEO)

Run after merging SEO work to the branch deployed on the VPS.

### 1. Build & deploy web

```bash
cd /opt/sellnearby/infra/docker
docker compose -f docker-compose.prod.yml --env-file .env.prod build web
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d web
```

Confirm `NEXT_PUBLIC_APP_URL=https://sellnearby.ie` is baked in at build time (see `docker-compose.prod.yml` web build args).

### 2. Smoke-test public SEO endpoints

| URL | Expected |
|-----|----------|
| `https://sellnearby.ie/robots.txt` | 200, Disallow dashboards, Sitemap line |
| `https://sellnearby.ie/sitemap.xml` | 200, listings + categories + guides |
| `https://sellnearby.ie/llms.txt` | 200, plain-text site map |
| `https://sellnearby.ie/listings` | 200, listing cards in HTML source |
| `https://sellnearby.ie/listings/dublin` | 200, city landing + listings |
| `https://sellnearby.ie/categories/electronics` | 200 (if category exists) |
| `https://sellnearby.ie/guides` | 200 |
| `https://sellnearby.ie/local/dublin` | 200 |

Optional: run `scripts/smoke-pilot.ps1` if it covers health checks.

### 3. Verify metadata (View Source or curl)

- Homepage has `og:image` and JSON-LD `WebSite` + `Organization`
- Listing detail has canonical slug URL, `Product` + `BreadcrumbList` JSON-LD
- `/seller/dashboard` has `noindex` (or blocked in robots.txt)

### 4. Google Search Console (manual)

1. Add property `https://sellnearby.ie`
2. Verify via DNS TXT **or** set `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` and rebuild web
3. Submit sitemap: `https://sellnearby.ie/sitemap.xml`
4. Request indexing for homepage + `/listings`

### 5. Analytics (manual)

Add to prod env before web rebuild (or set in `.env.prod` and rebuild):

```bash
# Pick one or both:
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXX
# NEXT_PUBLIC_PLAUSIBLE_DOMAIN=sellnearby.ie
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=your-verification-code
```

### 6. Rich Results validation (manual)

- [Google Rich Results Test](https://search.google.com/test/rich-results): test a listing URL, `/help`, a store page
- [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/): test homepage + listing OG

### 7. Post-deploy monitoring (first 2 weeks)

| Check | Tool | Action if failing |
|-------|------|-------------------|
| Indexed pages growing | Search Console → Pages | Fix crawl errors, resubmit sitemap |
| `/auth/login` not indexed | Search Console | Confirm noindex + robots disallow |
| CWV field data | Search Console → Experience | Tune LCP images, monitor GA4 Web Vitals events |
| 404 spikes | Search Console | Fix broken internal links |

### 8. Ongoing (not deploy-blocking)

- [ ] Google Business Profile for SellNearby brand
- [ ] Bing Webmaster Tools + sitemap
- [ ] Add 1–2 new `/guides` articles per month
- [ ] Replace seed success stories with real user stories as they arrive
- [ ] Local press / community group outreach (off-page)

---

## Final honest recommendation

**For pilot (now):** SEO infrastructure is **implemented**. Deploy to production, complete Search Console + GA4 setup, then focus on seller density in one geographic area (e.g. Dublin west). Organic discovery will compound as listings grow.

**For enterprise ranking:** Expect 6–12 months of consistent content + local authority building. Technical eligibility is largely done; **off-page links** and **measurement-driven iteration** are the remaining levers.

**Biggest risk if deploy skipped:** Production still serves pre-SEO build (`robots.txt` 404, wrong canonical host, client-only browse).

**Biggest opportunity:** Long-tail local queries (`/listings/dublin`, `/local/cork`, category pages) + seller-generated listing content can compound once GSC shows index coverage.

---

## Related docs

- [Launch checklist](./launch-checklist.md)
- [Public pages](../frontend/public-pages.md)
- [Storefront](../frontend/storefront.md)
- [Roadmap](./roadmap.md)
