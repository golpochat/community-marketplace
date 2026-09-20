# Concierge GTM — Dublin wedge (internal)

How to get the **first card sales** without building more SKUs. Distilled and Facebook already own national inventory. SellNearby wins one job in one place: **verified seller, Connect payout, card receipt**.

**Related:** [pilot-kickoff.md](./pilot-kickoff.md) · [pilot-feedback.md](./pilot-feedback.md) · [dispute-refund-playbook.md](./dispute-refund-playbook.md) · [launch-checklist.md](../product/launch-checklist.md)

**Do this after** Path A pipes work on prod (Stripe live, email, R2). Walking sellers through Connect against test keys trains the wrong habit.

---

## Wedge (pick one and do not widen)

Default for the Ireland pilot: **Dublin household goods** — furniture, baby/kids kit, or small electronics. Pick **one** of those three. Do not add motors, property, or “everything in Ireland.”

| In | Out until 5 card sales |
|----|------------------------|
| Sellers you can WhatsApp / meet | National Facebook ads |
| Listings you help photograph | Boost / featured / AI credit packs as a pitch |
| Card checkout as the safer path | Cutting 10% / 8% for everyone |
| Multi-home: DoneDeal/Facebook **plus** the SellNearby URL | Banning cash collection |

Year-1 target in the competitive report is still **€3k–€15k**, mostly from **card take-rate**. Chat/cash close is **€0 fee**.

---

## Weekly loop (3–5 sellers, not 50)

Every week, personally take **3–5 serious sellers** through this path. Target **10–30 active listings** in the wedge before you hunt buyers.

### 1. Verify

- Seller: `/account/verification`
- You: admin verification queue — approve when ID is real
- Tell them: verification unlocks the **verified seller service fee** (live % from settings, default 8% vs 10%). It is not “no fees.”

### 2. Connect

- Seller: **Earnings** → Stripe Connect onboarding
- Required to **receive card**, not to list
- Product already nags Connect on listings **€50+**. Help those first; skip €20 clutter.

### 3. First listing

- Create on `/account/listings/create` (fee disclosure shows before publish)
- You: approve if the queue requires it
- Copy the **canonical listing URL**. Ask them to add it on their DoneDeal / Facebook ad: “Pay by card on SellNearby for a receipt.”

### 4. First card sale

- Buyer pays listed price; seller fee comes out of payout
- Chat has **Pay on SellNearby** when the listing is active and Connect is ready — remind them to use it after price agreement
- If they close in cash anyway: **Mark as sold** with the real close channel (cash / off-platform). That feeds the Friday KPI.

Do **not** pitch boosts, featured, display ads, or AI packs until search in that wedge has competing listings.

---

## Friday numbers (15 minutes)

Admin dashboard → **Sale close mix (7 days)**:

| If you see | Do |
|------------|----|
| **≥1 card** close | Keep the same wedge. Help the next 3 sellers. |
| Solds exist but **leak rate ≥ 50%** | Nudge harder in chat; do not cut the fee. Check Connect drop-off. |
| **Zero solds** | Shrink the niche or the geography. Fix listing quality. Do not buy ads. |

Month-3 gate (from the gap-close board): **fewer than 5 card sales** → shrink again. **Do not** launch a protection SKU or a 5% sitewide fee until you have checkout-objection *data*. A **manual** fee override for 5–10 concierge sellers is already in admin monetization — use that, do not recode the default.

---

## Outreach (copy you can paste)

**Seller invite (WhatsApp):**

> I’m running a small Dublin pilot on SellNearby — free to list, optional card checkout so buyers get a receipt. I’ll help you verify, set up payouts, and get the first listing live. Cash collection still works in chat. Card sales take a seller service fee (verified rate is lower). Interested in listing [item type] this week?

**Buyer nudge after they agree a price in chat:**

> If you want a receipt and a 48-hour review if something’s wrong, use Pay on SellNearby. Cash/collection is fine too — that’s at your own risk.

**Do not say:** no commission, buyer protection (as insurance), we hold the money.

---

## Your calendar (this week vs later)

| When | You | Not you / not code |
|------|-----|-------------------|
| **This week** | Finish [Path A](../product/launch-checklist.md#path-a--closed-pilot-target-2-3-weeks): prod, Stripe live, SendGrid, R2 | New SKUs |
| **Then** | This concierge loop + [feedback form](./pilot-feedback.md) | National launch |
| **Before open Ireland** | Solicitor sign-off of `/terms` and `/privacy` | Pretending drafts are signed |
| **After ~20–30 card sales** | Consider a thin purchase promise / fee experiment | Building it now |

Infra and secrets stay on [pilot-vps-day-by-day.md](./pilot-vps-day-by-day.md) and [ovh-vps-deploy.md](./ovh-vps-deploy.md). This runbook does not replace them.
