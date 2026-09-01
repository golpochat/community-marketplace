# Product Roadmap

> **Status:** Living roadmap · **Last updated:** 2026-07-24  
> **Canonical monetization detail:** [master-blueprint-v1.md](./master-blueprint-v1.md) (§4 · §12 bootstrap execution · Appendix D)  
> **Launch readiness:** [launch-checklist.md](./launch-checklist.md)

Timeline below reflects **what is shipped in code** vs **what remains planned**. Calendar quarters are indicative, not commitments.

**Canonical growth stance:** **Bootstrap** — solo · **€30–€50/month** marketing · Year-1 revenue **€3k–€15k** · **ops cash BEP ~3–8 months** then reinvest ([§12.13](./master-blueprint-v1.md#1213-break-even--reinvest-rules)) · €95k ~**24–36 months**. Execute: [§12](./master-blueprint-v1.md#12-year-1-execution-plan).
## Shipped foundation (2026)

- [x] Monorepo (pnpm) · NestJS API · Next.js `apps/web` (marketplace + `/admin` + `/super-admin`)
- [x] Prisma + migrations · Docker Compose (local + OVH pilot) · Traefik / optional K8s scaffolding
- [x] Auth: phone OTP register, email activate (+ password), JWT sessions, password reset
- [x] Listings CRUD + moderation lifecycle · Meilisearch · chat (REST + WebSocket)
- [x] Stripe Connect + card checkout · notifications (in-app / push / email)
- [x] Unified `/account` hub (MEMBER / BUYER / SELLER); legacy `/buyer/*` · `/seller/*` still present
- [x] Storefront model · listing reserve · SEO Phases 0–4 in web · AI Marketing Hub Phases 0–4
- [x] Monetization Growth Phases 1 / 1.5 / 2 / 3 (boosts, featured, wallet spend, fast-track)
- [x] Buyer SKUs (partial): early cashback unlock · paid buyer statement
- [x] Seller ARPU: Growth Pack · AI credit packs · paid store slots · featured storefront
- [x] Admin display-ad campaigns (homepage + browse sidebar + search inline)
- [x] Haram enforcement Phases A–D + F (vision E deferred) — see [haram-enforcement-roadmap.md](./haram-enforcement-roadmap.md)

> **Note:** `apps/admin` is **deprecated** — do not treat it as a delivery target.

## Near-term (pilot → public)

| Area | Focus |
|------|--------|
| Ops / legal | Prod deploy checklist, Stripe live, SendGrid, lawyer-reviewed legal pack |
| GTM / liquidity | Bootstrap §12: solo, €30–50/mo, sellers-first onboarding ([§12.14](./master-blueprint-v1.md#1214-first-customer-onboarding-free--cheapest)), ops BEP ([§12.13](./master-blueprint-v1.md#1213-break-even--reinvest-rules)) |
| Monetization | Buyer protection (legal); optional extra package merchandising; priority message ✅ |
| AI Hub | Video / forecast only after pilot demand |
| Ads | Self-serve brand portal remains **Enterprise** (admin MVP already live) |
| Account UX | Continue consolidating on `/account/*`; retire parallel buyer/seller trees when ready |

## Later (Enterprise+)

| Area | Deliverables |
|------|-------------|
| Multi-tenancy | Community / neighborhood scopes |
| Analytics | Deeper seller insights, platform metrics polish |
| Compliance | GDPR tooling, data export automation |
| Integrations | Public webhooks / partner SDK |
| Advertising | Advertiser self-serve into display slots |

## Milestone overview

```mermaid
gantt
    title SellNearby roadmap (actual vs planned)
    dateFormat YYYY-MM
    section Shipped
    Foundation + MVP + transactions   :done, 2026-06, 2026-07
    Growth monetization 1-3 + AI hub  :done, 2026-07, 2026-07
    SEO + display ads MVP             :done, 2026-07, 2026-07
    section Next
    Pilot ops + public launch gate    :2026-07, 2026-09
    Monetization 4-6+ (demand)        :2026-09, 2027-03
    section Later
    Enterprise self-serve ads         :2027-01, 2027-06
```

## Decision log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-06 | pnpm monorepo | Workspace sharing, fast installs |
| 2026-06 | NestJS modular API | Clean architecture per domain |
| 2026-06 | Meilisearch | Fast full-text search, simple ops |
| 2026-06 | Stripe Connect | Marketplace payment splits |
| 2026-06 | Prisma ORM | Type-safe DB access (live in `apps/api`) |
| 2026-06-29 | Account vs storefront model | See [storefront-model.md](./storefront-model.md) |
| 2026-07 | Admin UI in `apps/web` | Single frontend; `apps/admin` retired |
| 2026-07 | Unified `/account` hub | MEMBER default role; buyer/seller namespaces legacy |
| 2026-07-22 | Roadmap rewritten to match shipped code | Prior placeholder timeline was obsolete |
| 2026-07-23 | Monetization status corrected | Buyer/seller SKUs beyond Phase 3 marked live where coded |
| 2026-07-23 | Revenue sanity + competitive GTM in blueprint | Operating €95–120k vs stretch ~€165–175k; multi-home wedge vs DoneDeal/FB |
| 2026-07-23 | §12 Year-1 execution plan added | Operating-first GMV phases, Month-6 gate, 14-day checklist |
| 2026-07-23 | Marketing & CAC budget in blueprint | Organic €35–80k vs paid €120–250k; contribution after marketing |
| 2026-07-24 | Bootstrap default locked | Solo + €30–50/mo; Year-1 €3–15k revenue; €95k ~24–36 mo |
| 2026-07-24 | §12.13 BEP + reinvest | Ops cash BEP ~3–8 mo; pocket €0 after stable BEP; reinvest surplus |
| 2026-07-24 | §12.14 first onboarding | Sellers-first concierge + listing URLs; free channels |
