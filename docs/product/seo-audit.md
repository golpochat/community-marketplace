# SellNearby.ie — Comprehensive SEO Audit & Enterprise Roadmap

**Scope:** Full platform audit (web app, API, infra, live site)  
**Date:** July 2026  
**Verdict:** **Pilot-ready for humans, not yet search-ready for scale.** Listing detail pages are the strongest asset; foundational crawl infrastructure is largely missing.

---

## Executive summary

| Dimension | Current grade | Enterprise target |
|-----------|---------------|-------------------|
| **Technical SEO** | D+ | A |
| **On-page SEO** | C+ (listings only) | A |
| **Content SEO** | C | A |
| **Local SEO** | B− (positioning) | A |
| **Structured data** | C− | A |
| **Performance (Core Web Vitals)** | B (estimated) | A |
| **Off-page / authority** | Not started | Required |
| **Measurement** | F | A |

**Honest assessment:** The platform was built product-first. Individual listing pages have thoughtful SEO (dynamic metadata, OG images, Product JSON-LD, cache revalidation). Everything around them — sitemap, robots, canonical URLs, category/store SSR, analytics, noindex on private areas — is still TBD. The launch checklist notes: *"Marketing / SEO — App exists; SEO/meta TBD."*

Live confirmation: `https://sellnearby.ie/robots.txt` returns **404**. That alone tells Google there is no crawl guidance.

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

## Part 2 — Critical gaps (honest)

### P0 — Blocking issues for ranking

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

### Phase 0 — Foundation (week 1–2) — do before marketing spend

| Action | Justification |
|--------|---------------|
| Add `robots.txt` + XML sitemap | Minimum crawl infrastructure; required for Search Console |
| Set `NEXT_PUBLIC_APP_URL=https://sellnearby.ie` in prod Docker build | Fixes OG URLs and canonical base |
| Add `metadataBase` in root layout | Next.js best practice; resolves relative OG URLs |
| `noindex` on auth + all dashboard route groups | Prevents index pollution |
| Register Google Search Console + Bing Webmaster Tools | Verify domain, submit sitemap, monitor index |
| Add GA4 (or privacy-friendly Plausible) | Measurement baseline |

**Expected outcome:** Google starts discovering and indexing listing pages systematically.

### Phase 1 — Crawlability (week 3–6)

| Action | Justification |
|--------|---------------|
| SSR `/listings` browse with filters | Core indexable content visible to bots |
| SSR `/store/[slug]` with dynamic `generateMetadata` | Seller pages become rankable |
| Canonical URLs on all public pages | Consolidates link equity, prevents duplicates |
| Category landing pages (`/categories/{slug}`) | Captures "electronics for sale Ireland" long-tail |
| Custom 404 with helpful links | Crawl budget recovery, UX |
| `noindex` sold/expired/removed listings | Index quality |

**Expected outcome:** Browse, category, and store pages enter the index; impressions begin in Search Console.

### Phase 2 — Rich results & on-page (week 7–10)

| Action | Justification |
|--------|---------------|
| `WebSite` + `SearchAction` on homepage | Sitelinks search box eligibility |
| `Organization` schema | Brand knowledge panel foundation |
| `LocalBusiness` on store pages | Local pack eligibility over time |
| `BreadcrumbList` on listings | Rich breadcrumb snippets |
| `FAQPage` on `/help` | FAQ rich results |
| Unique meta descriptions on all static pages | CTR improvement in SERPs |
| Default OG image for non-listing pages | Professional link previews |
| Listing slug URLs (`/listings/{slug}-{id}`) | Keyword URLs + better CTR |

**Expected outcome:** Rich snippets appear; CTR improves even before ranking improves.

### Phase 3 — Content & authority (month 3–6)

| Action | Justification |
|--------|---------------|
| Local SEO content hub — "How to sell safely in [county]" | Long-tail capture, E-E-A-T |
| `/success-stories` expanded with real case studies | Social proof + indexable content |
| Blog/guides (even 2–4 posts/month) | "How to price used furniture", "Best places to sell locally Ireland" |
| Google Business Profile (if applicable) | Local pack for brand |
| Structured internal linking (hub → category → listing) | Link equity flow |
| `rel="next/prev"` on paginated browse | Pagination signals |

**Expected outcome:** Organic traffic from informational queries; domain authority begins building.

### Phase 4 — Enterprise scale (month 6+)

| Action | Justification |
|--------|---------------|
| Programmatic location pages — `/listings/dublin`, `/listings/cork` | Geo-targeted landing (careful: avoid thin content) |
| `AggregateRating` schema when review volume supports it | Star ratings in SERPs |
| Core Web Vitals monitoring + `next/image` for listings | Ranking factor + UX |
| International hreflang (if expanding beyond IE) | Multi-market |
| `llms.txt` for AI search engines | Emerging channel (Perplexity, ChatGPT browse) |
| Link building / PR / community partnerships | Domain authority — the hardest part |
| A/B test title/meta CTR in Search Console | Data-driven optimization |
| Log file analysis (bot crawl patterns) | Enterprise crawl budget management |

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

### Metadata & SEO utilities

| File | Purpose |
|------|---------|
| `apps/web/src/app/layout.tsx` | Root metadata, `lang="en-IE"` |
| `apps/web/src/lib/site-url.ts` | Canonical URL helpers |
| `apps/web/src/lib/listing-og-metadata.ts` | Listing OG/Twitter builders |
| `apps/web/src/lib/og-image.ts` | OG image URL helper |
| `apps/web/src/components/listings/listing-json-ld.tsx` | Product JSON-LD |
| `apps/web/src/app/api/og/listing/[id]/route.ts` | Dynamic OG image generation |
| `apps/web/src/app/api/revalidate/listing/[id]/route.ts` | On-demand cache invalidation |
| `apps/web/src/lib/server-listings.ts` | Server fetch + cache tags |

### Missing infrastructure

| Item | Status |
|------|--------|
| `apps/web/src/app/robots.ts` | Missing |
| `apps/web/src/app/sitemap.ts` | Missing |
| `metadataBase` in root layout | Missing |
| `alternates.canonical` | Missing |
| Page-level `robots: noindex` | Missing |
| GA4 / Search Console | Missing |
| `llms.txt` | Missing |

### Launch checklist cross-reference

`docs/product/launch-checklist.md` line 492: **Marketing / SEO — ⚠️ App exists; SEO/meta TBD**

---

## Final honest recommendation

**For pilot (now):** The site is live and usable. SEO is not blocking user adoption. Focus on sellers, listings, and trust. But spend **1–2 weeks** on Phase 0 (robots, sitemap, `metadataBase`, noindex, Search Console) so the first 3 months of organic discovery are not wasted.

**For enterprise ranking:** Expect 6–12 months of consistent technical SEO + content + local authority building. Listing detail page architecture is a solid foundation — better than many early-stage marketplaces. The gaps are in **discovery infrastructure** (sitemap, SSR browse/store, category URLs) and **measurement** (analytics, Search Console).

**Biggest risk if ignored:** Google indexes `/auth/login` and `/seller/dashboard` while failing to index actual product pages — the worst possible outcome.

**Biggest opportunity:** Ireland has a clear local marketplace gap (commission-free, verified, community-first). Long-tail local SEO + seller-generated content (listings) can compound over time if the technical foundation is fixed now.

---

## Related docs

- [Launch checklist](./launch-checklist.md)
- [Public pages](../frontend/public-pages.md)
- [Storefront](../frontend/storefront.md)
- [Roadmap](./roadmap.md)
