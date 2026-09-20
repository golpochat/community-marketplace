# Dispute and refund playbook (internal)

Staff procedure for the Ireland **closed pilot**. This is an ops SLA, not a solicitor-signed policy and **not insurance or escrow**.

**Related:** [pilot-kickoff.md](./pilot-kickoff.md) · [launch-checklist.md](../product/launch-checklist.md) · public copy on `/safety` and `/terms` · admin **Disputes** and **Payments → Pending refunds**

---

## What SellNearby actually covers

| Path | Receipt | In-app dispute | Refund button | Staff promise |
|------|---------|----------------|---------------|---------------|
| **Card checkout** on SellNearby | Yes | Yes (`/account/disputes`) | Buyer can request; admin approves | Review within **48 hours** of open |
| **Cash / collection** arranged in chat | No | No (needs a succeeded payment) | No | Advise meetup safety; do not refund cash |
| **Off-platform** (DoneDeal, Facebook, bank) | No | No | No | Out of scope |

SellNearby is **not an escrow service**. Favouring the buyer **does** refund a succeeded card payment when you confirm **Refund card and resolve**. Favour seller / close does not move money.

---

## Daily 15-minute check

Owner: whoever is on support that day (founder is fine for pilot).

1. **Disputes** — `/admin/disputes` or `/super-admin/disputes` → **Open**.
2. **Refunds** — `/admin/payments` or `/super-admin/payments` → **Pending refunds**.
3. **Sale close mix** — admin dashboard, 7-day card vs sold-without-card (leakage, not a dispute queue).
4. Reply on `/contact` / `support@sellnearby.ie` the same day if someone mailed instead of using the product.

Clock for the 48-hour SLA: **dispute `createdAt`**, not the first time you noticed the email.

---

## Card checkout — marketplace dispute

Buyer opened a case after a **succeeded card payment**. Statuses: Open → (optional) Awaiting evidence → Under review → resolved.

### Hour 0–4

1. Open the case. Read reason, description, listing price, whether `paymentId` is present.
2. **Mark under review** so the queue is honest.
3. If photos / tracking / chat screenshots are missing, **Request evidence** (notifies buyer and seller). Pause the 48-hour *decision* clock only while you are waiting on evidence you asked for; still acknowledge within 48 hours (“we have it, waiting on photos”).

### Decide

| Outcome (admin button) | When | Money |
|------------------------|------|--------|
| **Favor buyer** | Item not received, not as described, damaged, or wrong — and evidence supports the buyer | Confirm **Refund card and resolve**. That refunds the succeeded card payment via Stripe (or no-ops if already refunded). Stripe chargebacks are not refunded twice. |
| **Favor seller** | Buyer has the item as described, or evidence is weak / contradictory | Do **not** approve a refund. Reject a pending refund with a short reason. |
| **Closed** | Duplicate, opened in error, or parties already settled in chat | No refund unless you already decided one is owed |

Write resolution notes in the product (required). Use plain language: what you believed, what you did about money.

### After buyer-favored

- [ ] Confirm the in-product notice: refunded, already refunded, or skipped because of a Stripe chargeback
- [ ] Cashback on a refunded payment is already cancelled via `payment.disputed` / refund events — do not “make whole” in Credit
- [ ] If the seller looks abusive (repeat not-as-described), open **Reports** / consider suspend — do not silently eat a third case

---

## Card checkout — refund without a dispute

Buyer used **Request refund** on a succeeded payment. Row lands on **Pending refunds**.

| Approve when | Reject when |
|--------------|-------------|
| Clear not-as-described / not received, or you already favoured the buyer | Meetup/cash story with no card payment; duplicate; seller already shipped with proof and buyer changed mind without a product issue |

Approve runs **Stripe refund** (and reverses the Connect transfer when Stripe metadata has `transfer_id`). Local/dev payments with `pi_test_` skip Stripe.

Do not approve refunds for **boosts / featured / other platform SKUs** from this queue — those are platform purchases, not listing GMV. Handle SKU mistakes as a support exception, not this playbook.

---

## Stripe chargeback (`charge.dispute.*`)

This is **Stripe vs the card network**, not the in-app dispute module.

1. Stripe Dashboard → **Disputes** (and/or admin payment status `disputed`).
2. Submit evidence in Stripe within **Stripe’s deadline** (often ~7 days — use Dashboard, not our 48-hour SLA).
3. In-app: you may still resolve the marketplace dispute for the same payment so buyer/seller see an outcome.
4. If Stripe loses the chargeback, do not “refund again” in admin.

---

## Cash, collection, and “they never paid”

There is **no** marketplace dispute and **no** refund. Reply with `/safety`: meet in public, cash is at your own risk, card checkout is the receipt path. Do not invent a goodwill cash refund from the company bank account during pilot.

If they **did** pay by card and are confused, send them to **Purchases** → refund or dispute.

---

## Ban / suspend (keep this short)

Use existing admin user tools; do not invent a second process.

| Signal | Action |
|--------|--------|
| Scam language, fake listing, harassment | Hide/remove listing, ban if clear |
| Seller takes card then ghosts (first time) | Buyer-favored + refund; warn seller |
| Second substantiated ghost / counterfeit | Suspend seller; end open listings |
| Chargeback fraud (buyer) | Favour seller if goods proof exists; note for Stripe |

Prohibited items: `/policies/prohibited-items` + listing moderation. Do not “refund” a banned listing that never had a card payment.

---

## What you must not say

- “Buyer protection” as insurance
- “We hold the money” / escrow
- “Always refund, no questions”
- A 48-hour review for **cash** deals

Public line (already in product copy): card disputes are reviewed within 48 hours; cash/collection in chat is at your own risk; SellNearby is not an escrow service.

Solicitor sign-off of `/terms` and `/privacy` is still a **human** gate before open Ireland.
