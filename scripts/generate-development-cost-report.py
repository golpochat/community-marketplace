#!/usr/bin/env python3
"""Generate Community Marketplace development cost & P&L report (Irish market)."""

from datetime import date
from pathlib import Path

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.shared import Inches, Pt, RGBColor
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

OUTPUT = Path(__file__).resolve().parent.parent / "docs" / "Community-Marketplace-Bootstrap-Financial-Projection.docx"

# ── Founder-built bootstrap model (actual costs) ──────────────────────────────
ACTUAL_DEV_COST = 9_600  # One-time cash (tools, hosting, legal) — excludes Cursor Pro
CURSOR_PRO_ANNUAL = 240  # €20/mo — ongoing OpEx, not sunk dev cost
ANNUAL_SERVICES_OPEX = 1_500  # VPS, domain, email, SMS, marketing
ANNUAL_FIXED_OPEX = ANNUAL_SERVICES_OPEX + CURSOR_PRO_ANNUAL  # €1,740/year (Years 1–2)
FOUNDER_BUILD_MONTHS = 18  # Approximate calendar months to build with AI assist

DEV_COST_BREAKDOWN = [
    ("AI / developer tool subscriptions (excl. Cursor)", 300),
    ("VPS & cloud during build + early launch", 800),
    ("Domain, SSL, email & SMS service credits", 600),
    ("Legal templates & compliance starter", 800),
    ("Company formation & accounting setup", 1_200),
    ("Design assets, fonts, misc licences", 400),
    ("Pre-launch marketing & community outreach", 500),
    ("Test devices, Stripe setup, contingency", 1_000),
    ("Remaining buffer / misc tooling", 4_000),
]

ANNUAL_OPEX_BREAKDOWN = [
    ("VPS hosting (OVH / single server)", 420, "API, PostgreSQL, Redis, Meilisearch on one VPS"),
    ("Domain + SSL renewal", 20, "Annual .ie or .com registration"),
    ("Email delivery (Resend / SendGrid)", 100, "Transactional email — activation, receipts"),
    ("SMS / OTP (Twilio or similar)", 300, "Phone verification & login OTPs"),
    ("Object storage (Cloudflare R2)", 60, "Listing images — pay-as-you-go"),
    ("Marketing (organic-first)", 400, "Canva, occasional boosts, flyers — no paid agency"),
    ("Cursor Pro subscription", 240, "€20/mo — ongoing AI-assisted dev & maintenance"),
    ("Monitoring & misc SaaS", 120, "Uptime checks, error tracking free tiers"),
    ("Contingency", 80, "Price increases, SMS overages"),
]

# Irish market rate scenarios (EUR/hour) — reference only, see Appendix E
RATES = {
    "lean_hybrid": {"label": "Lean Hybrid Team (remote + Irish lead)", "rate": 58, "desc": "Mid-level devs + 1 Irish senior lead"},
    "irish_sme_agency": {"label": "Irish SME Agency / Blended Team", "rate": 85, "desc": "Dublin-area agency or mixed in-house team"},
    "premium_dublin": {"label": "Premium Dublin Agency", "rate": 125, "desc": "Senior specialists, full-service delivery"},
}

# Feature inventory with estimated dev hours (based on codebase audit)
FEATURES = [
    ("1. Foundation & Shared Packages", [
        ("Monorepo scaffold (pnpm workspaces)", 40, 60),
        ("Shared types package (30+ modules)", 80, 120),
        ("Validation package (19 Zod schemas)", 60, 90),
        ("Utils, config, brand packages", 50, 80),
        ("UI component library", 120, 180),
        ("UI dashboard layout & guards", 80, 120),
        ("Documentation skeleton (89 docs)", 60, 100),
    ]),
    ("2. Authentication & Onboarding", [
        ("Email/password registration", 40, 60),
        ("OTP login (email + phone, 5 purposes)", 80, 120),
        ("JWT access + refresh token rotation", 60, 90),
        ("Email activation flow + templates", 40, 60),
        ("Device fingerprinting & login audit", 30, 50),
        ("Pending registration staging", 30, 45),
        ("Admin invitation onboarding", 50, 80),
        ("Profile completion gate", 20, 30),
        ("Account deletion request", 15, 25),
        ("Web: login, register, activate pages", 60, 90),
        ("Onboarding flow UI", 40, 60),
    ]),
    ("3. RBAC & User Roles", [
        ("4 system roles (super-admin, admin, seller, buyer)", 40, 60),
        ("Custom roles CRUD + templates", 80, 120),
        ("Per-user permission overrides (GRANT/DENY)", 60, 90),
        ("Scoped RBAC delegation (5 scopes)", 100, 150),
        ("Role-based dashboard routing", 30, 45),
        ("Seller status lifecycle", 40, 60),
        ("Business accounts & ambassador program", 50, 75),
        ("Seller limits & custom platform fees", 40, 60),
    ]),
    ("4. User Profiles & Settings", [
        ("Profile CRUD (bio, location, avatar)", 50, 75),
        ("R2 presigned upload (avatar, banner)", 60, 90),
        ("Phone verification & change OTP", 40, 60),
        ("Notification/privacy preferences", 40, 60),
        ("Settings pages (buyer/seller/admin)", 80, 120),
    ]),
    ("5. Listings & Marketplace Core", [
        ("Listing CRUD with 11 lifecycle states", 200, 300),
        ("Categories tree & community stats", 60, 90),
        ("Image upload, confirm, reorder (R2)", 100, 150),
        ("Listing packages (FREE, PAID 7/30/60/90D, PREMIUM)", 80, 120),
        ("Duplicate, renew, archive, mark sold", 60, 90),
        ("Status history & analytics", 50, 75),
        ("Admin review thread (seller ↔ admin)", 60, 90),
        ("Auto-moderation & fraud triggers", 80, 120),
        ("Listing expiry background job", 25, 40),
        ("Public browse, search, feeds, nearby areas", 120, 180),
        ("Reverse geocode & delivery options", 50, 75),
        ("Similar listings & view tracking", 40, 60),
        ("Vehicle listing schema & form (1000+ LOC)", 120, 180),
        ("Web: listing detail, browse, filters", 200, 300),
        ("Web: seller listing form & management", 250, 380),
    ]),
    ("6. Stores & Storefronts", [
        ("Multi-store CRUD & slug management", 80, 120),
        ("Store branding (logo, banner, policies)", 60, 90),
        ("Opening hours & contact settings", 40, 60),
        ("Public store page & listings", 80, 120),
        ("Store slot monetization integration", 50, 75),
        ("Web: storefront components (15+)", 120, 180),
    ]),
    ("7. Delivery & Pricing Workflows", [
        ("Delivery zones (COLLECTION, LOCAL, NATIONAL, CUSTOM)", 80, 120),
        ("Per-listing delivery options", 60, 90),
        ("Delivery change review workflow", 80, 120),
        ("Pricing preview/update with admin gate", 80, 120),
        ("Price change review workflow", 80, 120),
        ("Admin delivery & price review pages", 60, 90),
    ]),
    ("8. Search (Meilisearch)", [
        ("4 indexes (listings, users, categories, chat)", 80, 120),
        ("Full-text search with geo-radius filters", 80, 120),
        ("Autocomplete & global search", 50, 75),
        ("Auto-indexing event listeners", 60, 90),
        ("Admin reindex with job status", 40, 60),
        ("Search analytics & click tracking", 40, 60),
        ("Admin synonyms, stop-words, tuning", 60, 90),
    ]),
    ("9. Chat & Real-Time Messaging", [
        ("Thread CRUD (per listing + buyer + seller)", 80, 120),
        ("Message send/edit/delete/read receipts", 80, 120),
        ("Socket.IO gateway (typing, presence)", 100, 150),
        ("Image attachments (R2 presigned)", 50, 75),
        ("Thread archive & blocking", 40, 60),
        ("Legacy messages API compatibility", 30, 45),
        ("Chat notifications listener", 30, 45),
        ("Web: chat window, inbox, modals", 120, 180),
    ]),
    ("10. Payments & Stripe Connect", [
        ("Stripe Connect seller onboarding", 100, 150),
        ("PaymentIntent + Checkout Session flows", 120, 180),
        ("Platform fee calculation & splits", 60, 90),
        ("Webhook handler (idempotent events)", 80, 120),
        ("Payment completion & settlement", 80, 120),
        ("Buyer purchase history & seller sales", 60, 90),
        ("PDF receipt generation + email", 80, 120),
        ("Stripe dispute handling", 60, 90),
        ("Manual payouts & ledger", 60, 90),
        ("Web: buy-now, earnings, payments pages", 150, 220),
    ]),
    ("11. Monetization & Buyer Wallet", [
        ("Listing boosts (7D/30D) + expiry jobs", 80, 120),
        ("Featured homepage/category slots", 80, 120),
        ("Fast-track verification purchase", 60, 90),
        ("Store slot purchases (2, 3, bundle)", 60, 90),
        ("Buyer statement purchase unlock", 60, 90),
        ("Cashback grants + cooling period jobs", 80, 120),
        ("Buyer wallet & transaction history", 60, 90),
        ("Platform purchase invoices (PDF + email)", 60, 90),
        ("Admin monetization settings & audit", 60, 90),
        ("Web: boost/featured/package dialogs", 100, 150),
    ]),
    ("12. Seller Verification (KYC)", [
        ("Multi-step flow (phone, ID, selfie, address)", 150, 220),
        ("Document upload & admin review", 80, 120),
        ("Fast-track fulfillment integration", 40, 60),
        ("Listing gate for unverified sellers", 80, 120),
        ("Status history & admin sub-pages", 80, 120),
        ("Web: verification flow UI (470+ LOC)", 100, 150),
    ]),
    ("13. Trust & Reviews", [
        ("Buyer reviews seller + pending queue", 60, 90),
        ("Seller reviews buyer", 40, 60),
        ("Trust profiles (buyer + seller)", 50, 75),
        ("Trust cues on listings & storefront", 40, 60),
    ]),
    ("14. Disputes", [
        ("Buyer dispute creation + evidence upload", 80, 120),
        ("Dispute timeline & party responses", 60, 90),
        ("Admin resolution workflow", 60, 90),
        ("Web: buyer/seller/admin dispute pages", 80, 120),
    ]),
    ("15. Fraud Detection", [
        ("8 signal types + risk scoring", 100, 150),
        ("Keyword, location, duplication checks", 80, 120),
        ("Event-driven fraud listener", 40, 60),
        ("Admin fraud panel + escalation", 60, 90),
    ]),
    ("16. Moderation", [
        ("Report users/listings/messages", 60, 90),
        ("Appeals workflow", 50, 75),
        ("Action types (warn, suspend, ban, delete)", 80, 120),
        ("Content check service", 40, 60),
        ("Admin moderation analytics", 60, 90),
        ("Chat message moderation", 60, 90),
        ("Listing moderation queues", 80, 120),
    ]),
    ("17. Notifications", [
        ("30+ in-app notification types", 100, 150),
        ("FCM push + device registration", 80, 120),
        ("Email templates with versioning", 80, 120),
        ("Per-channel preferences", 50, 75),
        ("Admin broadcast & template CRUD", 80, 120),
        ("Provider health & delivery logs", 60, 90),
        ("Rate limiting service", 30, 45),
        ("Event listeners (14 total across modules)", 100, 150),
    ]),
    ("18. Admin Panel (46+ pages)", [
        ("Dashboard stats & audit log", 80, 120),
        ("User management (suspend, ban, verify)", 100, 150),
        ("Listing moderation (6 queues)", 120, 180),
        ("Seller verification admin (8 sub-pages)", 120, 180),
        ("Payments admin (ledger, refunds, disputes)", 100, 150),
        ("Finance / platform revenue reports", 80, 120),
        ("Search health & reindex admin", 60, 90),
        ("Notifications admin", 80, 120),
        ("RBAC manager UI (678 LOC)", 100, 150),
        ("Admin resource pages (1043 LOC)", 150, 220),
    ]),
    ("19. Super-Admin", [
        ("Platform settings CRUD", 60, 90),
        ("Full RBAC matrix & admin CRUD", 100, 150),
        ("Admin invitations system", 80, 120),
        ("Operations controller", 60, 90),
        ("Super-admin analytics & audit", 60, 90),
    ]),
    ("20. Finance & Statements", [
        ("Buyer account statements (paid unlock)", 100, 150),
        ("Seller free monthly statements", 80, 120),
        ("Platform revenue report service", 80, 120),
        ("PDF layouts (statement, revenue, receipts)", 150, 220),
        ("CSV/XLSX export utilities", 60, 90),
        ("Web: finance pages & export buttons", 60, 90),
    ]),
    ("21. Share & Social", [
        ("Short link creation & resolution", 40, 60),
        ("Share event tracking (8+ channels)", 40, 60),
        ("QR code generation", 20, 30),
        ("Seller share analytics page", 40, 60),
    ]),
    ("22. Public Web & PWA", [
        ("Homepage (hero, categories, featured)", 80, 120),
        ("Static pages (about, help, safety, terms)", 60, 90),
        ("Public layout, header, footer, nav", 80, 120),
        ("PWA offline fallback", 30, 45),
        ("Service worker recovery", 25, 40),
    ]),
    ("23. Infrastructure & DevOps", [
        ("Docker Compose (PostgreSQL, Redis, Meilisearch)", 40, 60),
        ("Kubernetes overlays & Traefik TLS", 80, 120),
        ("Health checks & Prometheus metrics", 30, 45),
        ("Job queue service", 40, 60),
        ("R2 cleanup background job", 25, 40),
        ("Deploy/rollback/backup runbooks", 60, 90),
        ("OVH VPS deployment guide", 30, 45),
    ]),
    ("24. Security & Compliance", [
        ("HTTP exception filter & interceptors", 20, 30),
        ("API security patterns & RBAC guards", 60, 90),
        ("Stripe webhook signature verification", 20, 30),
        ("GDPR-ready data structures", 40, 60),
        ("Security checklist documentation", 30, 45),
    ]),
    ("25. Testing & QA", [
        ("Unit & integration test coverage", 400, 600),
        ("E2E test scaffolding", 200, 300),
        ("Manual QA & UAT cycles", 200, 300),
    ]),
]

FUTURE_DEV = [
    ("Phase 4 — Multi-tenancy", "Community/neighborhood scopes, white-label", 1200, 1800, "Q2 2027"),
    ("Native mobile apps (iOS + Android)", "React Native or Flutter apps", 2400, 3600, "Q3 2027"),
    ("Advanced analytics dashboard", "Seller insights, cohort analysis, funnels", 600, 900, "Q4 2027"),
    ("GDPR data export & deletion tooling", "Automated compliance workflows", 400, 600, "Q1 2028"),
    ("Public API & partner webhooks", "Third-party integrations SDK", 800, 1200, "Q2 2028"),
    ("AI listing descriptions & moderation", "LLM-assisted content generation/review", 600, 1000, "Q3 2028"),
    ("Escrow & buyer protection fund", "Held funds until delivery confirmed", 1000, 1500, "Q4 2028"),
    ("Shipping integrations (An Post, DPD)", "Label generation & tracking", 800, 1200, "Q1 2029"),
    ("Auction/bidding system", "Timed auctions for high-value items", 1000, 1500, "Q2 2029"),
    ("B2B dealer portal", "Bulk listings, inventory sync, CRM", 1500, 2200, "Q3 2029"),
    ("International expansion (UK)", "Multi-currency, cross-border compliance", 2000, 3000, "Q4 2029"),
    ("Video listings & live selling", "Short-form video, live stream commerce", 1800, 2600, "2029–2030"),
]

# P&L assumptions — conservative bootstrap (no paid staff; lean fixed opex + variable Stripe)
PNL_YEARS = list(range(2026, 2036))
PNL = {
    2026: {"mau": 800, "gmv": 45000, "sku_rev": 600, "ads": 0, "fixed_opex": 1740},
    2027: {"mau": 3500, "gmv": 180000, "sku_rev": 3200, "ads": 0, "fixed_opex": 1740},
    2028: {"mau": 9000, "gmv": 520000, "sku_rev": 9000, "ads": 2000, "fixed_opex": 2440},
    2029: {"mau": 18000, "gmv": 1200000, "sku_rev": 22000, "ads": 6000, "fixed_opex": 3740},
    2030: {"mau": 32000, "gmv": 2400000, "sku_rev": 45000, "ads": 15000, "fixed_opex": 6240},
    2031: {"mau": 48000, "gmv": 3800000, "sku_rev": 72000, "ads": 28000, "fixed_opex": 9240},
    2032: {"mau": 65000, "gmv": 5200000, "sku_rev": 98000, "ads": 42000, "fixed_opex": 12240},
    2033: {"mau": 85000, "gmv": 6800000, "sku_rev": 125000, "ads": 58000, "fixed_opex": 15240},
    2034: {"mau": 105000, "gmv": 8500000, "sku_rev": 155000, "ads": 75000, "fixed_opex": 18240},
    2035: {"mau": 125000, "gmv": 10200000, "sku_rev": 185000, "ads": 95000, "fixed_opex": 22240},
}

PLATFORM_FEE = 0.10  # 10% default on in-platform transactions
IN_PLATFORM_GMV_SHARE = 0.25  # 25% of GMV uses platform payments initially, growing


def set_cell_shading(cell, color_hex: str):
    shading = OxmlElement("w:shd")
    shading.set(qn("w:fill"), color_hex)
    shading.set(qn("w:val"), "clear")
    cell._tc.get_or_add_tcPr().append(shading)


def add_table(doc, headers, rows, col_widths=None):
    table = doc.add_table(rows=1, cols=len(headers))
    table.style = "Table Grid"
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    hdr = table.rows[0].cells
    for i, h in enumerate(headers):
        hdr[i].text = h
        for p in hdr[i].paragraphs:
            for r in p.runs:
                r.bold = True
                r.font.size = Pt(9)
        set_cell_shading(hdr[i], "1F4E79")
        for p in hdr[i].paragraphs:
            for r in p.runs:
                r.font.color.rgb = RGBColor(255, 255, 255)
    for row_data in rows:
        row = table.add_row().cells
        for i, val in enumerate(row_data):
            row[i].text = str(val)
            for p in row[i].paragraphs:
                for r in p.runs:
                    r.font.size = Pt(9)
    if col_widths:
        for i, w in enumerate(col_widths):
            for row in table.rows:
                row.cells[i].width = Inches(w)
    return table


def fmt_eur(n, decimals=0):
    if decimals == 0:
        return f"€{n:,.0f}"
    return f"€{n:,.{decimals}f}"


def calc_revenue(d, year_idx):
    gmv_share = min(0.25 + year_idx * 0.03, 0.55)
    tx_rev = d["gmv"] * gmv_share * PLATFORM_FEE
    return tx_rev + d["sku_rev"] + d["ads"]


def calc_stripe_cost(revenue: float) -> float:
    """Stripe processing on platform revenue (~2.9% + small fixed per txn)."""
    return revenue * 0.029 + 120


def calc_opex(d, revenue: float = 0) -> float:
    return d["fixed_opex"] + calc_stripe_cost(revenue)


def total_hours():
    low = sum(sf[1] for _, subs in FEATURES for sf in subs)
    high = sum(sf[2] for _, subs in FEATURES for sf in subs)
    return low, high


def build_doc():
    doc = Document()
    style = doc.styles["Normal"]
    style.font.name = "Calibri"
    style.font.size = Pt(11)

    # Title page
    doc.add_paragraph()
    t = doc.add_paragraph()
    t.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = t.add_run("COMMUNITY MARKETPLACE\n")
    r.bold = True
    r.font.size = Pt(28)
    r.font.color.rgb = RGBColor(31, 78, 121)
    r2 = t.add_run("Bootstrap Financial Projection Report\n")
    r2.bold = True
    r2.font.size = Pt(18)
    r3 = t.add_run("Founder-Built Model — Irish Market — 2026\n\n")
    r3.font.size = Pt(14)
    r4 = t.add_run(f"Report Date: {date.today().strftime('%d %B %Y')}\n")
    r4.font.size = Pt(12)
    r5 = t.add_run("Founder-built with AI-assisted development (Cursor Pro)\n")
    r5.font.size = Pt(11)
    r5.italic = True
    doc.add_page_break()

    # Executive Summary
    doc.add_heading("Executive Summary", level=1)
    low_h, high_h = total_hours()
    mid_h = (low_h + high_h) // 2
    doc.add_paragraph(
        f"This report projects the financial performance of the Community Marketplace platform "
        f"under a bootstrap (founder-built) model. The platform was built by a senior software engineer "
        f"using AI-assisted development (Cursor Pro), not an external agency."
    )
    doc.add_paragraph(
        f"Codebase scale: ~239,000 lines of TypeScript, 67 API controllers, 134+ services, "
        f"122+ web routes, ~50 database models, and 20 domain modules — equivalent to "
        f"{low_h:,}–{high_h:,} hours ({mid_h:,} hrs midpoint) of agency effort, but delivered "
        f"at a fraction of market cost."
    )

    doc.add_heading("Key Financial Assumptions", level=2)
    bootstrap_summary = [
        ("One-time development cost (actual)", fmt_eur(ACTUAL_DEV_COST), "Tools, hosting during build — founder sweat equity; excludes Cursor Pro"),
        ("Cursor Pro (ongoing OpEx)", fmt_eur(CURSOR_PRO_ANNUAL) + "/year", "€20/mo — AI-assisted development & maintenance"),
        ("Other annual operating cost (Years 1–2)", fmt_eur(ANNUAL_SERVICES_OPEX), "VPS, domain, email, SMS, marketing — no paid staff"),
        ("Total annual fixed OpEx (Years 1–2)", fmt_eur(ANNUAL_FIXED_OPEX), "Services + Cursor Pro — excludes variable Stripe fees"),
        ("Paid employees", "€0", "Founder-operated; no salaries in base model"),
        ("Market replacement cost (reference)", "~€1.3M", "What an Irish agency would charge — see Appendix E"),
        ("Platform transaction fee", "10%", "Default on in-platform Stripe payments"),
        ("Projection period", "2026–2035", "10-year conservative growth scenario"),
    ]
    add_table(doc, ["Item", "Value", "Notes"], bootstrap_summary)

    doc.add_paragraph(
        "\nThe platform significantly exceeds a typical MVP — it includes enterprise-grade RBAC, "
        "Stripe Connect payments, real-time chat, fraud detection, monetization SKUs, PDF financial "
        "reporting, seller KYC, and a unified admin/super-admin panel with 46+ pages."
    )
    doc.add_page_break()

    # Actual development cost
    doc.add_heading("1. Actual Development Cost (Founder-Built)", level=1)
    doc.add_paragraph(
        f"Total cash spent to build the platform to its current state: approximately "
        f"{fmt_eur(ACTUAL_DEV_COST)}. This excludes the founder's own time (sweat equity), which "
        f"would equate to {mid_h:,}+ hours at market rates but was not paid out as cash."
    )
    doc.add_heading("1.1 Cost Breakdown", level=2)
    dev_rows = [[name, fmt_eur(amt)] for name, amt in DEV_COST_BREAKDOWN]
    dev_rows.append(["TOTAL", fmt_eur(ACTUAL_DEV_COST)])
    add_table(doc, ["Item", "Amount"], dev_rows)

    doc.add_heading("1.2 Build Timeline", level=2)
    doc.add_paragraph(
        f"Approximate build period: {FOUNDER_BUILD_MONTHS} months of part-time to full-time "
        f"founder effort, accelerated by Cursor Pro and AI pair-programming. "
        f"Equivalent agency timeline: 14–20 months with 5–6 FTE developers."
    )
    doc.add_heading("1.3 Development Cost — Time Breakdowns", level=2)
    add_table(doc, ["Metric", "Value"], [
        ("Total cash development cost", fmt_eur(ACTUAL_DEV_COST)),
        ("Monthly cash burn (dev phase)", fmt_eur(ACTUAL_DEV_COST / FOUNDER_BUILD_MONTHS, 2)),
        ("Weekly cash burn (dev phase)", fmt_eur(ACTUAL_DEV_COST / (FOUNDER_BUILD_MONTHS * 4.33), 2)),
        ("Daily cash burn (dev phase, 5-day week)", fmt_eur(ACTUAL_DEV_COST / (FOUNDER_BUILD_MONTHS * 22), 2)),
        ("Market replacement value", "~€1,316,000"),
        ("Cost saving vs agency build", "~€1,306,000 (99.2%)"),
    ])
    doc.add_page_break()
    # Codebase metrics
    doc.add_heading("2. Platform Overview & Codebase Metrics", level=1)
    doc.add_heading("2.1 Codebase Metrics", level=2)
    metrics = [
        ("Total TypeScript/TSX lines", "~239,201"),
        ("API controllers", "67"),
        ("Domain services", "134+"),
        ("Frontend routes", "122+"),
        ("Prisma database models", "~50"),
        ("API domain modules", "20"),
        ("Shared Zod schemas", "19"),
        ("Event listeners", "14"),
        ("Meilisearch indexes", "4"),
        ("Documentation files", "89"),
        ("Default platform transaction fee", "10%"),
        ("Verified seller fee", "8%"),
        ("Monetization SKUs configured", "10"),
    ]
    add_table(doc, ["Metric", "Value"], metrics)
    doc.add_page_break()

    # Feature inventory (no agency costs — complexity hours only)
    doc.add_heading("3. Complete Feature Inventory", level=1)
    doc.add_paragraph(
        "Every implemented feature and sub-feature in the platform. Hours indicate engineering "
        "complexity (for market comparison in Appendix E) — not cash cost under the founder-built model."
    )

    grand_low = 0
    grand_high = 0

    for domain, subs in FEATURES:
        doc.add_heading(domain, level=2)
        rows = []
        d_low = 0
        d_high = 0
        for name, lo, hi in subs:
            mid = (lo + hi) / 2
            rows.append([name, f"{lo}–{hi}", f"{mid:.0f}"])
            d_low += lo
            d_high += hi
        add_table(doc, ["Sub-Feature", "Hours (Low–High)", "Hours (Mid)"], rows)
        doc.add_paragraph(
            f"Domain subtotal: {d_low:,}–{d_high:,} hours | Mid: {(d_low+d_high)/2:,.0f} hrs"
        )
        grand_low += d_low
        grand_high += d_high

    doc.add_heading("3.1 Total Engineering Complexity", level=2)
    doc.add_paragraph(
        f"Total estimated engineering effort: {grand_low:,}–{grand_high:,} hours "
        f"(mid: {(grand_low+grand_high)/2:,.0f} hrs). Market replacement cost at Irish agency rates: "
        f"see Appendix E. Actual cash spent: {fmt_eur(ACTUAL_DEV_COST)}."
    )
    doc.add_page_break()

    # Marketing plan (within €1,500/year budget)
    doc.add_heading("4. Marketing Plan (€400/year within €1,500 services OpEx)", level=1)
    doc.add_paragraph(
        "Marketing is funded from the €1,500 annual services budget (€400 allocated). "
        "Cursor Pro (€240/year) is a separate ongoing OpEx line for AI-assisted development. "
        "Primary strategy: organic growth, community partnerships, and free LEO programmes. "
        "Founder time (~10 hrs/week) is the main investment."
    )

    doc.add_heading("4.1 Annual Marketing Budget (€400 cash)", level=2)
    mkt_rows = [
        ("Google Business Profile", "€0", "Free — essential for local SEO"),
        ("Organic social media", "€0", "Founder-led: Instagram, Facebook, TikTok, community groups"),
        ("Canva (free tier or Pro)", "€120", "€10/mo — social graphics & listing templates"),
        ("Occasional post boosts", "€120", "€10/mo — boost best organic posts only"),
        ("Community flyers / local events", "€100", "GAA clubs, community centres, markets"),
        ("Domain SEO basics", "€60", "Amortised keyword tools or one-off SEO audit"),
        ("TOTAL ANNUAL MARKETING", "€400", "Within €1,500 services envelope (excl. Cursor Pro)"),
    ]
    add_table(doc, ["Channel / Activity", "Annual Cost", "Notes"], mkt_rows)

    doc.add_heading("4.2 Free & Grant-Funded Activities (€0 cash)", level=2)
    grants = [
        ("Trading Online Voucher (LEO)", "Up to €2,500 grant", "50% co-funding — website, SEO, ads setup"),
        ("LEO subsidised training", "€50–€200 per course", "Social media, SEO, digital analytics programmes"),
        ("Local Enterprise Office mentoring", "Free", "1:1 business mentor for go-to-market"),
        ("Google Ad Grants (if registered charity)", "Up to €8,500/mo", "Not applicable unless community NFP structure"),
        ("Referral / ambassador programme", "€0 cash", "Built into platform — community ambassador feature"),
        ("PR & local media", "€0", "Press releases to Irish Times, RTE, local radio"),
        ("SEO content (blog, guides)", "€0", "Founder-written 'how to sell safely in Ireland' guides"),
    ]
    add_table(doc, ["Programme", "Value", "Notes"], grants)

    doc.add_heading("4.3 Year 1 Marketing Calendar", level=2)
    calendar = [
        ("Month 1–2", "Setup GBP, social profiles, LEO grant application, launch PR (free)"),
        ("Month 3–4", "Organic content push, 5 SEO blog posts, 2 community events"),
        ("Month 5–6", "Referral / ambassador programme (built into platform)"),
        ("Month 7–8", "County-by-county organic posts, local Facebook groups"),
        ("Month 9–10", "Seasonal seller campaigns (back-to-school, pre-Christmas)"),
        ("Month 11–12", "Holiday peak organic push, user success stories"),
    ]
    add_table(doc, ["Period", "Focus"], calendar)

    doc.add_paragraph(
        f"\nYear 1 marketing cash cost: €400 (from €1,500 services OpEx). "
        f"Cursor Pro: {fmt_eur(CURSOR_PRO_ANNUAL)}/year separately. "
        f"Optional LEO Trading Online Voucher (up to €2,500 grant) can supplement at zero extra cost "
        f"beyond 50% co-funding match."
    )
    doc.add_page_break()

    # Operating costs
    doc.add_heading("5. Annual Operating Costs (€1,740/year base)", level=1)
    doc.add_paragraph(
        f"Fixed annual operating cost: {fmt_eur(ANNUAL_FIXED_OPEX)} in Years 1–2 "
        f"({fmt_eur(ANNUAL_SERVICES_OPEX)} services + {fmt_eur(CURSOR_PRO_ANNUAL)} Cursor Pro), "
        f"scaling modestly as traffic grows. No paid staff — founder-operated. "
        f"Stripe processing fees are variable and calculated from revenue."
    )

    doc.add_heading("5.1 Annual Operating Cost Breakdown (€1,740)", level=2)
    opex_rows = [[name, fmt_eur(amt), note] for name, amt, note in ANNUAL_OPEX_BREAKDOWN]
    opex_rows.append(["TOTAL FIXED (annual)", fmt_eur(ANNUAL_FIXED_OPEX), "Excl. Stripe variable fees"])
    add_table(doc, ["Item", "Annual (€)", "Notes"], opex_rows)

    doc.add_heading("5.2 Weekly & Daily Breakdowns (Fixed OpEx)", level=2)
    weekly = ANNUAL_FIXED_OPEX / 52
    daily = ANNUAL_FIXED_OPEX / 365
    add_table(doc, ["Period", "Fixed Operating Cost"], [
        ("Daily", fmt_eur(daily, 2)),
        ("Weekly", fmt_eur(weekly, 2)),
        ("Monthly", fmt_eur(ANNUAL_FIXED_OPEX / 12, 2)),
        ("Quarterly", fmt_eur(ANNUAL_FIXED_OPEX / 4, 2)),
        ("Annual", fmt_eur(ANNUAL_FIXED_OPEX)),
    ])
    doc.add_paragraph(
        "Note: Stripe fees add ~2.9% of platform revenue plus ~€120/year base. "
        "Fixed OpEx increases in later years as VPS and SMS scale (see Section 7.3)."
    )
    doc.add_page_break()

    # Revenue model
    doc.add_heading("6. Revenue Model", level=1)
    doc.add_paragraph("Revenue streams implemented in the platform:")
    rev_streams = [
        ("Platform transaction fee", "10% default (8% verified sellers)", "On in-platform card payments via Stripe Connect"),
        ("Listing boost (7 days)", "€1.99", "Increased visibility for 7 days"),
        ("Listing boost (30 days)", "€4.99", "Increased visibility for 30 days"),
        ("Featured homepage slot", "€2.99/day", "8 slots/day maximum"),
        ("Featured category slot", "€1.99/day", "4 slots/day per category"),
        ("Fast-track verification", "€2.99", "Priority KYC review"),
        ("Store slot 2", "€4.99", "Additional storefront"),
        ("Store slot 3", "€4.99", "Third storefront"),
        ("Store bundle (3 slots)", "€7.99", "Discounted multi-slot"),
        ("Buyer account statement", "€0.99", "Monthly PDF/CSV/XLSX unlock"),
        ("Cashback programme", "Cost centre", "1.5% cashback — retention tool, not revenue"),
        ("Display advertising (future)", "CPM €5–€15", "Not yet implemented — Phase 4+"),
    ]
    add_table(doc, ["Stream", "Price", "Description"], rev_streams)

    doc.add_heading("6.1 Key Assumptions", level=2)
    assumptions = [
        ("Average transaction value", "€75", "Irish classifieds market average"),
        ("In-platform payment adoption", "25% → 55%", "Grows as trust builds (Years 1–10)"),
        ("Platform fee on GMV", "10%", "Configurable per seller"),
        ("Seller monetization conversion", "3–8% of active sellers", "Boosts, featured, store slots"),
        ("Annual fixed OpEx (Years 1–2)", fmt_eur(ANNUAL_FIXED_OPEX), f"€1,500 services + €240 Cursor Pro"),
        ("Paid staff", "€0", "Founder-operated bootstrap model"),
        ("Development cost (sunk, one-time)", fmt_eur(ACTUAL_DEV_COST), "Excludes Cursor Pro — that is ongoing OpEx"),
        ("Growth scenario", "Conservative", "~3–5× slower MAU ramp vs optimistic bootstrap"),
        ("Irish classifieds market", "DoneDeal: 6.4M monthly visitors", "Distilled Ltd 2024 results"),
    ]
    add_table(doc, ["Assumption", "Value", "Basis"], assumptions)
    doc.add_page_break()

    # P&L 10 year
    doc.add_heading("7. Profit & Loss Projection (2026–2035)", level=1)
    doc.add_paragraph(
        "Conservative bootstrap scenario: "
        f"{fmt_eur(ACTUAL_DEV_COST)} one-time sunk development cost, "
        f"{fmt_eur(ANNUAL_FIXED_OPEX)}/year fixed OpEx (Years 1–2), "
        "no paid staff, slower user-growth assumptions vs optimistic case, "
        "variable Stripe fees on revenue."
    )

    pnl_rows = []
    cumulative = -ACTUAL_DEV_COST  # start with sunk dev cost
    for i, year in enumerate(PNL_YEARS):
        d = PNL[year]
        rev = calc_revenue(d, i)
        opex = calc_opex(d, rev)
        net = rev - opex
        cumulative += net
        pnl_rows.append([
            str(year),
            f"{d['mau']:,}",
            fmt_eur(d["gmv"]),
            fmt_eur(rev),
            fmt_eur(opex),
            fmt_eur(net),
            fmt_eur(cumulative),
        ])

    add_table(doc,
              ["Year", "MAU", "GMV", "Revenue", "OpEx", "Net P/L", "Cumulative P/L*"],
              pnl_rows)
    doc.add_paragraph(
        f"*Cumulative P/L includes {fmt_eur(ACTUAL_DEV_COST)} initial development cost in Year 1 opening balance."
    )

    doc.add_heading("7.1 P&L Monthly / Weekly / Daily Breakdown by Year", level=2)
    monthly_pnl = []
    for i, year in enumerate(PNL_YEARS):
        d = PNL[year]
        rev = calc_revenue(d, i)
        opex = calc_opex(d, rev)
        net = rev - opex
        monthly_pnl.append([
            str(year),
            fmt_eur(rev / 12, 2),
            fmt_eur(opex / 12, 2),
            fmt_eur(net / 12, 2),
            fmt_eur(net / 52, 2),
            fmt_eur(net / 365, 2),
        ])
    add_table(doc,
              ["Year", "Rev/Month", "OpEx/Month", "Net/Month", "Net/Week", "Net/Day"],
              monthly_pnl)

    doc.add_heading("7.2 Revenue Breakdown by Source (Annual)", level=2)
    rev_detail = []
    for i, year in enumerate(PNL_YEARS):
        d = PNL[year]
        gmv_share = min(0.25 + i * 0.03, 0.55)
        tx_rev = d["gmv"] * gmv_share * PLATFORM_FEE
        rev_detail.append([
            str(year),
            fmt_eur(tx_rev),
            fmt_eur(d["sku_rev"]),
            fmt_eur(d["ads"]),
            fmt_eur(tx_rev + d["sku_rev"] + d["ads"]),
        ])
    add_table(doc, ["Year", "Transaction Fees", "SKU Sales", "Advertising", "Total Revenue"], rev_detail)

    doc.add_heading("7.3 Cost Breakdown by Category (Annual)", level=2)
    cost_detail = []
    for i, year in enumerate(PNL_YEARS):
        d = PNL[year]
        rev = calc_revenue(d, i)
        stripe = calc_stripe_cost(rev)
        cursor = CURSOR_PRO_ANNUAL
        services = d["fixed_opex"] - cursor
        cost_detail.append([
            str(year),
            fmt_eur(services),
            fmt_eur(cursor),
            fmt_eur(stripe),
            "€0",
            fmt_eur(calc_opex(d, rev)),
        ])
    add_table(doc, ["Year", "Services OpEx", "Cursor Pro", "Stripe Fees", "Staff", "Total OpEx"], cost_detail)

    breakeven_year = next(
        (y for i, y in enumerate(PNL_YEARS)
         if calc_revenue(PNL[y], i) > calc_opex(PNL[y], calc_revenue(PNL[y], i))),
        None,
    )
    cum = -ACTUAL_DEV_COST
    roi_year = None
    for i, y in enumerate(PNL_YEARS):
        rev_y = calc_revenue(PNL[y], i)
        cum += rev_y - calc_opex(PNL[y], rev_y)
        if cum >= 0 and roi_year is None:
            roi_year = y

    doc.add_paragraph(
        f"\nProjected operating break-even year: {breakeven_year or 'Beyond 2035'} "
        f"(annual revenue exceeds annual OpEx). "
        f"Full ROI (recovering {fmt_eur(ACTUAL_DEV_COST)} development + all operating losses): {roi_year or 'Beyond 2035'}."
    )
    doc.add_page_break()

    # 5-year focused view
    doc.add_heading("8. Five-Year Summary (2026–2030)", level=1)
    five_year = []
    for year in PNL_YEARS[:5]:
        d = PNL[year]
        idx = PNL_YEARS.index(year)
        rev = calc_revenue(d, idx)
        opex = calc_opex(d, rev)
        five_year.append([str(year), fmt_eur(rev), fmt_eur(opex), fmt_eur(rev - opex),
                          fmt_eur(rev / 12, 2), fmt_eur((rev - opex) / 12, 2)])
    add_table(doc, ["Year", "Revenue", "OpEx", "Net P/L", "Rev/Month", "Net/Month"], five_year)

    # Future development
    doc.add_heading("9. Future Development Roadmap (Founder-Built)", level=1)
    doc.add_paragraph(
        "Future phases can be built the same way — founder + Cursor Pro — at minimal cash cost. "
        "Hours show complexity; estimated cash cost assumes continued bootstrap approach (~€500–€2,000 per major feature)."
    )
    future_rows = []
    for name, desc, lo, hi, timeline in FUTURE_DEV:
        mid = (lo + hi) / 2
        bootstrap_cost = max(500, min(mid * 2, 5000))  # ~€2/hr effective vs agency
        future_rows.append([name, desc, timeline, f"{lo:,}–{hi:,} hrs", fmt_eur(bootstrap_cost)])
    add_table(doc, ["Initiative", "Description", "Target", "Agency Hours", "Bootstrap Cash Est."], future_rows)
    doc.add_paragraph(
        "Agency market cost for all future phases: see Appendix E. "
        "Bootstrap cash estimate assumes founder builds with AI assist, no external hires."
    )
    doc.add_page_break()

    # Capital summary
    doc.add_heading("10. Total Capital Summary", level=1)
    cum = -ACTUAL_DEV_COST
    capital_rows = [(f"Initial development (sunk)", fmt_eur(ACTUAL_DEV_COST))]
    for y in PNL_YEARS:
        idx = PNL_YEARS.index(y)
        rev_y = calc_revenue(PNL[y], idx)
        opex_y = calc_opex(PNL[y], rev_y)
        net_y = rev_y - opex_y
        cum += net_y
        capital_rows.append((f"End of {y} (cumulative P/L incl. dev)", fmt_eur(cum)))
    add_table(doc, ["Milestone", "Cumulative Position"], capital_rows)
    doc.add_page_break()

    # Risk analysis
    doc.add_heading("11. Risk Factors & Sensitivities", level=1)
    risks = [
        ("Market dominance of DoneDeal/Adverts.ie", "High", "Differentiate on community, trust, local focus"),
        ("Slow in-platform payment adoption", "High", "Buyer protection, cashback programme"),
        ("Founder burnout / key-person risk", "High", "Lean OpEx allows patience; document everything"),
        ("Regulatory (PSD2, consumer rights)", "Medium", "Stripe handles most payment compliance"),
        ("SMS / hosting cost spikes at scale", "Medium", "Fixed OpEx rises modestly in model from Year 3"),
        ("Cybersecurity incident", "Medium", "Keep dependencies updated; free-tier monitoring"),
        ("Currency/tax changes post-Brexit", "Low", "EUR-only operations; Irish Ltd structure"),
    ]
    add_table(doc, ["Risk", "Severity", "Mitigation"], risks)

    # Appendix - competitor context
    doc.add_heading("Appendix A: Irish Market Context", level=1)
    context = [
        ("DoneDeal monthly visitors", "6.4 million", "Distilled Ltd 2024"),
        ("Adverts.ie monthly users", "~2 million", "Distilled Ltd 2024"),
        ("Adverts.ie new listings/month", "200,000+", "Distilled Ltd 2024"),
        ("Distilled Ltd revenue (2024)", "€47 million", "RTE / filed accounts"),
        ("Distilled Ltd pre-tax profit (2024)", "€7.55 million", "Down 38% YoY"),
        ("Typical Irish agency project (marketplace)", "€500K–€2M", "Industry benchmarks"),
        ("LEO Trading Online Voucher", "Up to €2,500", "50% co-funded"),
        ("Minimum viable marketing (Ireland)", "€500–€1,000/mo", "ProfileTree, BeFound 2026"),
    ]
    add_table(doc, ["Benchmark", "Value", "Source"], context)

    doc.add_heading("Appendix B: Default Platform Pricing (from codebase)", level=1)
    pricing = [
        ("boost_7d", "€1.99"), ("boost_30d", "€4.99"), ("featured_homepage", "€2.99"),
        ("featured_category", "€1.99"), ("fast_track_verification", "€2.99"),
        ("store_slot_2", "€4.99"), ("store_slot_3", "€4.99"), ("store_bundle_3", "€7.99"),
        ("buyer_statement", "€0.99"), ("platform_fee_default", "10%"),
        ("verified_seller_fee", "8%"), ("cashback", "1.5%"),
    ]
    add_table(doc, ["SKU / Setting", "Default Price"], pricing)

    doc.add_heading("Appendix C: Glossary of Abbreviations", level=1)
    doc.add_paragraph(
        "All abbreviations and acronyms used in this report, grouped by category."
    )

    glossary_sections = [
        ("Financial & Business Terms", [
            ("MAU", "Monthly Active Users — unique users who visit or use the platform at least once in a calendar month. Key growth metric."),
            ("GMV", "Gross Merchandise Value — total euro value of all goods/services sold through the platform in a period, before fees and refunds."),
            ("OpEx", "Operating Expenses — day-to-day running costs (staff, hosting, marketing, legal, tools) excluding one-off capital spend."),
            ("P&L / P/L", "Profit and Loss — financial statement showing revenue minus costs; net result is profit or loss."),
            ("SKU", "Stock Keeping Unit — a distinct paid product or service (e.g. 7-day listing boost, featured slot). Each SKU has its own price."),
            ("CPM", "Cost Per Mille — advertising cost per 1,000 impressions (views) of an ad."),
            ("SME", "Small and Medium Enterprise — Irish/EU classification for businesses below large-corporate size; used for agency and grant context."),
            ("MVP", "Minimum Viable Product — smallest feature set needed to launch and test with real users."),
            ("FTE", "Full-Time Equivalent — one person working full-time; e.g. '5–6 FTE' means a team of five to six full-time developers."),
            ("YoY", "Year over Year — comparison of a metric in one year vs the same period in the previous year."),
            ("B2B", "Business to Business — selling tools or services to other businesses (e.g. dealer portal) rather than consumers."),
            ("CRM", "Customer Relationship Management — software for managing customer/dealer contacts and sales pipelines."),
            ("Ltd", "Limited — Irish/UK private company structure (e.g. Distilled Ltd); shareholders' liability is limited to their investment."),
            ("NFP", "Not-for-Profit — organisation structure that may qualify for schemes like Google Ad Grants."),
            ("PSD2", "Payment Services Directive 2 — EU regulation governing electronic payments, strong customer authentication, and open banking."),
        ]),
        ("Revenue & Cost Line Items", [
            ("Transaction fee revenue", "Platform's cut (default 10%) on sales paid through in-platform Stripe payments."),
            ("SKU revenue", "Income from sellers/buyers purchasing paid add-ons (boosts, featured slots, verification fast-track, etc.)."),
            ("Stripe cost", "Payment processing fees charged by Stripe (typically ~1.4% + €0.25 per card transaction in Ireland)."),
            ("Infra + Tools", "Infrastructure (servers, storage) plus software subscriptions (monitoring, email, GitHub, etc.)."),
            ("Cumulative P/L", "Running total of net profit/loss from launch year through each projection year."),
            ("Break-even", "Point where annual revenue equals or exceeds operating expenses (operating profit ≥ 0)."),
            ("Contingency", "Extra budget buffer (report uses 25%) for scope creep, delays, and unknowns."),
        ]),
        ("Marketing & Irish Programmes", [
            ("LEO", "Local Enterprise Office — Irish government network offering grants, mentoring, and training to small businesses in every county."),
            ("Trading Online Voucher", "LEO grant of up to €2,500 (50% matched by you) for e-commerce, website, SEO, and digital marketing."),
            ("GBP", "Google Business Profile — free Google listing for local search and maps visibility (formerly Google My Business)."),
            ("SEO", "Search Engine Optimisation — improving organic (unpaid) ranking in Google and other search engines."),
            ("PR", "Public Relations — media outreach, press releases, and coverage in newspapers, radio, and online."),
            ("GAA", "Gaelic Athletic Association — Ireland's largest community sports body; useful for local partnership marketing."),
            ("RTE", "Raidió Teilifís Éireann — Ireland's national public broadcaster (TV and radio)."),
            ("mo", "Per month — e.g. €500/mo = €500 per month."),
            ("hr / hrs", "Hour(s) — used for developer rates and time estimates."),
        ]),
        ("Technology — Platform & Architecture", [
            ("API", "Application Programming Interface — backend endpoints the web and mobile apps call to read/write data."),
            ("REST", "Representational State Transfer — standard style for HTTP APIs (GET, POST, PATCH, DELETE)."),
            ("JWT", "JSON Web Token — secure token format for login sessions and API authentication."),
            ("OTP", "One-Time Password — short code sent by email or SMS for login, registration, or verification."),
            ("RBAC", "Role-Based Access Control — permissions tied to roles (buyer, seller, admin) rather than hard-coded per user."),
            ("KYC", "Know Your Customer — identity verification process (ID, selfie, address) for sellers."),
            ("CRUD", "Create, Read, Update, Delete — basic data operations for any entity (listings, users, etc.)."),
            ("SDK", "Software Development Kit — packaged tools for third parties to integrate with your platform."),
            ("Webhook", "Automated HTTP callback — e.g. Stripe notifying your server when a payment succeeds."),
        ]),
        ("Technology — Frontend & UX", [
            ("UI", "User Interface — visual elements users interact with (buttons, forms, tables)."),
            ("UX", "User Experience — overall ease and quality of using the product."),
            ("PWA", "Progressive Web App — website that can work offline and be installed like an app on phones."),
            ("TS / TSX", "TypeScript / TypeScript + JSX — programming languages used across this codebase."),
            ("LOC", "Lines of Code — rough measure of codebase size (~239,000 in this project)."),
        ]),
        ("Technology — Infrastructure & Services", [
            ("DevOps", "Development Operations — practices and tooling for deploying, monitoring, and scaling software."),
            ("VPS", "Virtual Private Server — rented cloud server (e.g. OVH) hosting the API and databases."),
            ("K8s", "Kubernetes — container orchestration for scaling multiple services in production."),
            ("TLS", "Transport Layer Security — encryption for HTTPS (padlock in the browser)."),
            ("R2", "Cloudflare R2 — object storage for images and files (similar to AWS S3)."),
            ("FCM", "Firebase Cloud Messaging — Google's push notification service for mobile and web."),
            ("CDN", "Content Delivery Network — geographically distributed cache for faster image and static file delivery."),
            ("HPA", "Horizontal Pod Autoscaler — Kubernetes feature that adds/removes server instances based on load."),
            ("OVH", "French cloud/hosting provider commonly used for EU-based VPS deployments."),
        ]),
        ("Technology — Data & Documents", [
            ("PDF", "Portable Document Format — downloadable receipts, statements, and revenue reports."),
            ("CSV", "Comma-Separated Values — spreadsheet-friendly export format for financial data."),
            ("XLSX", "Microsoft Excel Open XML — Excel workbook format for statement and report exports."),
            ("GDPR", "General Data Protection Regulation — EU privacy law governing personal data collection and user rights."),
        ]),
        ("Technology — Testing & Quality", [
            ("QA", "Quality Assurance — systematic testing to find bugs before release."),
            ("UAT", "User Acceptance Testing — final testing with real or representative users before go-live."),
            ("E2E", "End-to-End — automated tests that simulate a full user journey through the app."),
        ]),
        ("Technology — AI & Future Features", [
            ("LLM", "Large Language Model — AI systems (e.g. GPT) used for auto-generating listing text or moderation assist."),
            ("AI/ML", "Artificial Intelligence / Machine Learning."),
        ]),
        ("Vehicle Listings (Irish Context)", [
            ("NCT", "National Car Test — Ireland's mandatory periodic vehicle roadworthiness certificate."),
            ("VIN", "Vehicle Identification Number — unique 17-character ID for every motor vehicle."),
        ]),
        ("Payment & Compliance", [
            ("Stripe Connect", "Stripe's marketplace product — splits payments between platform and sellers, handles payouts."),
            ("PaymentIntent", "Stripe object representing a single card payment attempt."),
            ("Express dashboard", "Stripe-hosted portal where sellers view payouts and tax documents."),
        ]),
        ("Time & Project Planning", [
            ("Q1–Q4", "Calendar quarters — Q1 = Jan–Mar, Q2 = Apr–Jun, Q3 = Jul–Sep, Q4 = Oct–Dec."),
            ("Mid", "Midpoint estimate — average of low and high range in hour/cost tables."),
            ("Low / High", "Optimistic vs pessimistic bounds on hours or cost estimates."),
        ]),
    ]

    for section_title, items in glossary_sections:
        doc.add_heading(section_title, level=2)
        add_table(doc, ["Abbreviation", "Full meaning & context in this report"], items)

    doc.add_heading("Appendix E: Market Replacement Cost Reference", level=1)
    doc.add_paragraph(
        "For comparison only — what it would cost to hire an Irish agency to build the same platform "
        "from scratch. Not applicable to the founder-built bootstrap model."
    )
    agency_rows = []
    for key, info in RATES.items():
        agency_rows.append([
            info["label"],
            f"€{info['rate']}/hr",
            fmt_eur(grand_low * info["rate"]),
            fmt_eur((grand_low + grand_high) / 2 * info["rate"]),
            fmt_eur(grand_high * info["rate"]),
        ])
    add_table(doc, ["Scenario", "Rate", "Low", "Mid", "High"], agency_rows)
    doc.add_paragraph(
        f"Midpoint agency replacement cost: ~€1,316,000 vs actual spend of {fmt_eur(ACTUAL_DEV_COST)} "
        f"— a saving of approximately 99%."
    )

    doc.add_heading("Appendix F: Disclaimer", level=1)
    doc.add_paragraph(
        "This report provides indicative estimates based on codebase analysis and founder-stated "
        f"actual costs ({fmt_eur(ACTUAL_DEV_COST)} one-time development, "
        f"{fmt_eur(ANNUAL_FIXED_OPEX)}/year operating incl. Cursor Pro). "
        "P&L uses conservative MAU/GMV growth assumptions. Projections are models — not financial advice. "
        "Revenue assumptions should be validated with pilot launch data. "
        "Market replacement costs in Appendix E are for comparison only."
    )

    doc.save(OUTPUT)
    print(f"Report saved to: {OUTPUT}")
    print(f"Hours: {grand_low:,}–{grand_high:,} (mid: {(grand_low+grand_high)/2:,.0f})")
    print(f"Mid cost @ €85/hr (market ref): {fmt_eur((grand_low+grand_high)/2 * 85)}")
    print(f"Actual dev cost: {fmt_eur(ACTUAL_DEV_COST)} | Annual fixed OpEx: {fmt_eur(ANNUAL_FIXED_OPEX)} (incl. Cursor Pro)")


if __name__ == "__main__":
    build_doc()
