# Listing Reserve — Product Spec

**Status:** Phase 2 polish implemented (browse badge, countdown, reminders)  
**Last reviewed:** 2026-07-22  
**Decision lock:** Verified = **seller ID verification** (`sellerStatus === verified`); reserve is **free forever** (no deposit)  
**Related:** [buyer-flow.md](../frontend/buyer-flow.md), [storefront-model.md](./storefront-model.md), [master-blueprint-v1.md](./master-blueprint-v1.md), [launch-checklist.md](./launch-checklist.md)

---

## 1. Executive summary

| Decision | Choice |
|----------|--------|
| Feature name | **Reserve** (buyer-facing) / **Reservation request** while pending |
| Model | **Free** exclusive hold after **seller approval** |
| Who can request | **ID-verified** marketplace accounts only (`sellerStatus === verified`) |
| Who approves | **Seller** (required) |
| Hold duration | **Seller-set** on listing: **4 / 12 / 24 hours** (default **12**) |
| Payment | **None** for reserve — forever free; full price still via existing **Buy now** |
| Listing status | New status: **`reserved`** |
| Scope | One active reserve (or pending request) per listing |

**One sentence**

> An ID-verified member can request to reserve a listing; if the seller approves, the item is held exclusively for that buyer for the seller-chosen window (4, 12, or 24 hours), at no charge, until they Buy now or the hold ends.

**Why this model**

- Simple: no Stripe deposit, refunds, or ledger complexity  
- Trust: only identity-verified members can lock inventory  
- Seller control: approve/decline + choose hold length  
- Fits current buy path: reserve is a **status + timer**; payment stays **Buy now**

---

## 2. Problem and goals

### Buyer problem

Need time to arrange collection/delivery without losing the item to another **Buy now**.

### Seller problem

“Is this available?” chats with no commitment; sellers want to grant holds only to serious, verified people.

### Goals

| Goal | Success signal |
|------|----------------|
| Reduce race-condition frustration | Fewer sold-while-chatting dead-ends |
| Seller trust in who gets a hold | High approve rate for verified requesters; low spam |
| Keep ops light | No payment/refund tickets for reserve |
| Conversion | Request → approved → Buy now within window |

### Non-goals

- Paid deposits / forfeits (explicitly **out forever** unless product reopens)  
- Auto-accept without seller approval  
- Multi-item holds, layaway, escrow  
- Structured shipping booking inside reserve  

---

## 3. User journeys

### 3.1 Happy path

```mermaid
sequenceDiagram
  participant B as Verified member
  participant W as Web
  participant A as API
  participant Seller as Seller

  B->>W: Request reserve
  W->>A: POST /reserves (listingId)
  A->>A: status = pending_seller
  A->>Seller: Notify — approve or decline?
  Seller->>A: Approve
  A->>A: listing = reserved; startsAt/expiresAt set
  A->>W: Open/ensure chat thread
  Note over B,Seller: Arrange handoff in chat
  B->>W: Buy now (full price, existing checkout)
  A->>A: reserve = converted; listing = sold
```

### 3.2 Seller declines

1. Request `pending_seller` → `declined`.  
2. Listing stays `active`.  
3. Buyer notified.

### 3.3 Expiry / cancel

1. Active hold ends (timer), or buyer/seller cancels.  
2. Reserve terminal status; listing → `active` (unless sold/removed).  
3. Both parties notified when relevant.

### 3.4 Seller does not respond

Pending request **expires** after **2 hours** (fixed platform SLA) without approve/decline → listing stays `active`; buyer notified “Seller did not respond.”

---

## 4. Rules

### 4.1 Eligibility

| Actor | Rule |
|-------|------|
| Buyer | Authenticated + `canActAsBuyer` **and** `sellerStatus === verified` (account ID verification) |
| Unverified member | Cannot request; CTA explains they must complete identity verification |
| Listing | Status `active`; not own listing; reserve enabled on listing (always on in v1 unless seller opts out — **v1: always available**) |
| Seller of listing | Owns listing; can approve/decline pending requests |
| Concurrency | At most **one** `pending_seller` **or** `active` reserve per listing |
| Free / €0 listings | Reserve **allowed** (still free); Buy now rules unchanged |
| Stripe Connect | **Not required** to *reserve*; still required for *Buy now* payout as today |

### 4.2 Duration (seller-set)

| Setting | Values |
|---------|--------|
| Listing field | `reserveWindowHours`: **4 \| 12 \| 24** |
| Default when creating listing | **12** |
| When clock starts | On **seller approve** (not on request) |
| Pending request TTL | **2 hours** waiting for seller decision |

Seller can change the dropdown on the listing only while listing is `active` (not while `reserved` / pending).

### 4.3 What “exclusive” means (`active` reserve)

| Action | Allowed? |
|--------|----------|
| Reserving buyer: Buy now | Yes |
| Reserving buyer: Cancel reserve | Yes |
| Other buyers: Buy now | No |
| Other buyers: Request reserve | No |
| Other buyers: Message seller | Yes (optional soft copy) |
| Seller: Approve another request | No (none pending) |
| Seller: Decline/cancel active hold | Yes → listing `active` |
| Seller: Edit price / delivery | **Block** while reserved (v1) |
| Seller: Pause listing | Cancels active/pending reserve |

### 4.4 Acceptance mode

| Mode | Decision |
|------|----------|
| Seller approve/decline | **Required** |
| Auto-accept | **Not used** |

---

## 5. Status model

### 5.1 Listing status

Add:

```text
ListingStatus.reserved
```

| Transition | From → To | Trigger |
|------------|-----------|---------|
| Seller approves | `active` → `reserved` | Approve |
| Buy now success | `reserved` → `sold` | Existing payment completion |
| Expire / cancel | `reserved` → `active` | Timer, buyer/seller cancel |
| Pending only | stays `active` | Request waiting — **listing remains buyable by others until approved** |

**Important:** While `pending_seller`, listing stays **`active`** so the seller is not locked before they agree. On approve, flip to `reserved` and block other Buy now.

Browse: `reserved` visible with badge; Buy now / Reserve disabled for others.

### 5.2 Reserve entity

| Field | Purpose |
|-------|---------|
| `id` | UUID |
| `listingId`, `buyerId`, `sellerId` | Parties |
| `status` | See below |
| `windowHours` | Snapshot of listing setting at **approve** time |
| `requestedAt` | Request time |
| `decisionAt` | Approve/decline time |
| `startsAt`, `expiresAt` | Set on approve |
| `listingPriceSnapshot` | Optional, for display |

**Reserve status**

| Status | Meaning |
|--------|---------|
| `pending_seller` | Awaiting seller |
| `active` | Exclusive hold running |
| `converted` | Buyer completed Buy now |
| `declined` | Seller declined |
| `cancelled_buyer` | Buyer withdrew (pending or active) |
| `cancelled_seller` | Seller cancelled active / withdrew before approve |
| `expired_pending` | Seller did not respond in 2h |
| `expired` | Active hold window ended |

No payment / refund fields.

---

## 6. Payments

**None for reserve.**

Purchase remains existing **Buy now** / Purchases checkout for the **full listing price**. No deposit credit math.

---

## 7. Outcome matrix (no money)

| Scenario | Listing | Reserve status |
|----------|---------|----------------|
| Seller approves | `reserved` | `active` |
| Seller declines | `active` | `declined` |
| Pending TTL (2h) | `active` | `expired_pending` |
| Buyer cancels pending | `active` | `cancelled_buyer` |
| Buyer cancels active | `active` | `cancelled_buyer` |
| Seller cancels active | `active` | `cancelled_seller` |
| Hold window ends | `active` | `expired` |
| Buy now succeeds | `sold` | `converted` |
| Listing flagged / removed | per existing + cancel reserve | terminal cancel |

---

## 8. UX / UI copy

### 8.1 Listing create/edit (seller)

**Label:** Reservation hold window  

**Control:** Dropdown — `4 hours` / `12 hours` (default) / `24 hours`  

**Hint:** If you approve a reservation request, the buyer gets exclusive time to complete purchase.

### 8.2 Listing detail (buyer)

**Eligible (verified):**

- `[ Buy now ]`
- `[ Request to reserve ]`

**Helper:**

> Free. If the seller approves, this item is held for you for {N} hours so you can arrange collection or delivery and complete purchase. Identity verification required.

**Not verified:**

- Reserve disabled or opens verification CTA:  
  > Complete identity verification to request a reservation.

**Pending (this buyer):**

> Reservation requested · waiting for seller (expires {time})  
> `[ Cancel request ]`

**Active (this buyer):**

> Reserved for you · ends in {countdown}  
> `[ Buy now ]` `[ Cancel reservation ]`

**Reserved by someone else:**

> Reserved  
> Someone else has reserved this item. It may become available again after {time}.

### 8.3 Seller: approve UI

Notification + listing manage / messages:

> {Buyer} requested to reserve “{title}” for {N} hours.  
> `[ Approve ]` `[ Decline ]`  
> Request expires {pendingDeadline}.

On approve toast:

> Reserved for {buyer} until {expiresAt}. We’ve opened chat to arrange handoff.

### 8.4 Notifications

| Event | Audience | Theme |
|-------|----------|-------|
| New request | Seller | Approve/decline CTA |
| Approved | Buyer | Hold until {time}; Buy now |
| Declined | Buyer | Seller declined |
| Pending expired | Buyer | Seller did not respond |
| Hold ending soon (T-2h if window ≥ 4h) | Buyer | Complete purchase |
| Hold expired | Both | Listing available again |
| Converted | Seller | Sold via reserved buyer |

### 8.5 Browse card

Badge: `Reserved` when listing status is `reserved`.

---

## 9. API sketch

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/buyer/reserves` | Request reserve (`listingId`) |
| `GET` | `/api/buyer/reserves/mine` | My requests / active holds |
| `POST` | `/api/buyer/reserves/:id/cancel` | Cancel pending or active |
| `GET` | `/api/seller/reserves/pending` | Inbox for approve/decline |
| `POST` | `/api/seller/reserves/:id/approve` | Approve → start timer |
| `POST` | `/api/seller/reserves/:id/decline` | Decline |
| `GET` | `/api/listings/:id` | Include reservation summary |
| Job | `expire-reserves` | Expire pending (2h) and active (window) |

Guards: buyer must be verified; approve/decline only listing owner.

---

## 10. Edge cases

| Case | Behaviour |
|------|-----------|
| Two buyers request while active | Second request rejected: already pending/reserved |
| Buy now by other buyer while `pending_seller` | **Allowed** (listing still active) — pending request auto-`cancelled_seller` or `declined` with notice |
| Reserving buyer Buy now | Normal checkout; on success mark `converted` |
| Unverified user crafts API call | 403 |
| Seller approves after pending TTL | Reject — already `expired_pending` |
| Clock skew | Server `expiresAt` only |

---

## 11. Analytics

| Metric | Definition |
|--------|------------|
| Request rate | Requests / eligible listing views |
| Approve rate | Approved / requested |
| Convert rate | `converted` / `active` |
| Decline / expire-pending rates | Quality of requests + seller responsiveness |
| Median time request → approve → buy | Funnel speed |

---

## 12. Legal / trust

- Copy must say reservation is **free** and **not a payment** / not escrow.  
- Exclusive hold is a platform convenience; item condition and purchase terms follow existing marketplace rules.  
- Verification gate reuses existing seller ID verification policy ([storefront-model.md](./storefront-model.md)).

---

## 13. Phased delivery

| Phase | Scope |
|-------|--------|
| **0 — Spec** | This document |
| **1 — MVP** | Verified-only request, seller approve/decline, listing `reserveWindowHours`, `reserved` status, pending 2h TTL, expire job, chat system line, Buy now blocked when reserved | ✅ |
| **2 — Polish** | Countdown, browse badge, reminders, seller inbox UI | ✅ |
| **3 — Optional** | Seller opt-out “allow reservations” per listing | 📋 |

---

## 14. Locked decisions

| # | Decision | Value |
|---|----------|--------|
| 1 | Who can reserve | **`sellerStatus === verified`** only |
| 2 | Price of reserve | **Free forever** |
| 3 | Seller approval | **Required** |
| 4 | Duration | Seller dropdown **4 / 12 / 24h** (default 12); clock on approve |
| 5 | Pending seller response | **2 hours** then expire request |
| 6 | Reserved in search | **Visible** with badge |
| 7 | Pending + other Buy now | **Allowed** until approve |

---

## 15. Approval checklist

Product decisions (implemented):

- [x] Verified = seller ID verification  
- [x] Reserve free forever  
- [x] Seller approval required  
- [x] Seller-set 4 / 12 / 24h  
- [x] Pending TTL **2 hours**  
- [x] Others can Buy now while request is pending  
- [x] Listing status includes `reserved`  
- [x] Verification CTA path from Reserve button  

**Still not in scope:** Phase 3 seller opt-out (`allowReservations` or similar) — not coded.
