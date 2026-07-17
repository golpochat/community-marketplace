# Storefront & Account Model (v1)

> **Status:** Approved direction — implementation spec  
> **Last updated:** 2026-06-29

Canonical rules for separating **login accounts** from **storefronts**, listing limits, verification, and paid store slots.

---

## Summary

> One verified login account may own multiple paid storefronts (after verification). Each storefront owns its listings, reviews, and public branding. Unverified accounts get **one free store** and **five admin-approved live listings** account-wide. Published listings cannot be deleted—only paused or ended—until identity verification unlocks unlimited publishing.

---

## 1. Identity layers

| Layer | Purpose | Examples | Visibility |
|-------|---------|----------|------------|
| **Account** | Login, KYC, payouts, platform limits | Email, phone, legal name, `sellerStatus` | Private / admin |
| **Storefront** | Public shop brand | Store name, slug, logo, description | Public |

**Rules**

- ID verification applies to the **account**, not each storefront.
- Legal name is captured at admin approval of verification; never shown on public storefronts.
- Verified badge copy: **“Verified seller”** (not the legal name).
- Buyers interact with **store names** (e.g. Hijabi Gift), not passport names.
- **Buyers do not get storefronts.** Only seller accounts.

---

## 2. API separation

Seller-facing and public APIs must treat account and storefront as distinct resources.

| Surface | Owns |
|---------|------|
| `/account/*` or `/me/*` | Personal profile, credentials |
| `/seller/verification/*` | ID submission, verification status |
| `/seller/stores/*` | Storefront CRUD, branding, slug, policies |
| `/seller/stores/:storeId/listings/*` | Listings scoped to a store |
| Public `/stores/:slug` | Buyer-facing storefront |

**Data model**

- Introduce a `Store` entity (`userId`, 1:N with account; **enforce 1 store at v1 launch**).
- Listings carry `storeId` (retain `sellerId` for payouts, disputes, bans).
- Reviews, store analytics, and public branding are **per storefront**.
- Trust & safety actions (ban, suspend) apply at **account** level (all stores).

---

## 3. Storefront rules

| Rule | Detail |
|------|--------|
| First storefront | **Free and mandatory** for sellers; must set store name **before creating** the first listing (draft or submit) |
| Additional storefronts | **Verified accounts only** + paid store slot |
| Default limit | `storeSlotLimit = 1` on account |
| Multi-store UX (v1) | Enforce max 1 store in product; schema supports N |
| Per-store isolation | Separate listings, reviews/ratings, analytics, slug, branding, policies |

---

## 4. Unverified listing limit (5 per account)

Applies to the **account**, not per storefront.

### What counts

- Increment `approvedListingCount` when a listing first transitions to **`active`** via **admin approval** (or equivalent auto-publish to `active`).
- Does **not** increment on draft create, duplicate create, or `pending_review` alone.

### What does not free a slot (unverified)

- Pause (`paused`), end/archive (`ended`), or sold (`sold`) — slot remains consumed.
- Prevents rotate-5-publish-without-verify gaming.

### Gates

| Action | Unverified at 5 approved (`verification_required`) |
|--------|---------------------------|
| Create draft | **Block** (status flips to `verification_required` at the 5th activation) |
| Submit for review | **Block** |
| Admin approve → active | **Block** |
| Duplicate listing | **Block** while verification required |

### After verification

- `sellerStatus === verified` → **unlimited** listings across all owned stores.
- Existing `sellerLimit` / gate service moves to approval-based counting (not create-based).

---

## 5. Listing lifecycle (no delete after publish)

| Status | Seller may delete? | Seller alternatives |
|--------|-------------------|---------------------|
| `draft` | Yes | Edit |
| `rejected` | Yes | Fix and resubmit |
| `pending_review` | No (withdraw → `draft` allowed) | Cancel review |
| `active` | **No** | **Pause** |
| `paused` | **No** | Resume or **End** |
| `sold` / `ended` | **No** | Historical record |
| `removed` | No | Admin only |

**Terminology**

- **Pause / hold** → `paused` (hidden from buyers, retained in system)
- **Archive** → `ended` (delisted, audit trail kept)

Hard delete remains available to **admin** for policy violations.

---

## 6. Multi-storefront monetization

Ship store-slot SKUs in the **same release** as the `Store` entity (not before).

### Purchase rules

- Only **`verified`** accounts may purchase additional store slots.
- Unverified users cannot request, attempt, or complete extra-storefront purchases.
- First store is always included (`storeSlotLimit` default 1).

### SKU shape (one-time, micro-transaction)

| SKU | Unlocks |
|-----|---------|
| `store_slot_2` | 2nd storefront |
| `store_slot_3` | 3rd storefront |
| `store_bundle_3` | Up to 3 stores (discounted bundle) |

- Add to `PlatformPurchaseType` and `PlatformPricingConfig.skus` (same pattern as boosts / fast-track).
- On successful payment: increment `storeSlotLimit`; fulfillment = permission to create another `Store` row.
- Platform cap at launch: e.g. **5 stores per account** (configurable).

### Pricing

- Amounts TBD in monetization settings (admin-configurable SKUs).
- Prefer **one-time unlock** over subscription for v1 (aligned with master blueprint).

---

## 7. Verification & multi-store interaction

```
Register as seller
  → Create 1st storefront (name required)
  → Draft listings freely
  → Submit for review (blocked at 5 approved)
  → Admin approves → counts toward 5
  → At 5 approved → verification required for more
  → Verify ID (account-level)
  → Unlimited listings
  → (Optional) Purchase 2nd+ store slot → new storefront, own catalog & reviews
```

- Extra storefronts do **not** grant another 5 unverified listings (verification already complete).
- Stripe Connect / payouts stay **account-level** unless legal entity requirements change later.

---

## 8. Implementation phases

| Phase | Scope |
|-------|--------|
| **v1** | `Store` table, API split, `storeId` on listings, approval-based 5-cap, no-delete-after-publish, 1 store enforced, migrate `businessName` → store |
| **v1 (same release)** | Store-slot SKUs, `storeSlotLimit`, verified-only purchase gate |
| **v2** | Multi-store UI (switcher, pick store on listing create), bundle merchandising |

---

## 9. Decision log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-06-29 | Account vs storefront separation | Legal identity ≠ brand (e.g. Hijabi Gift) |
| 2026-06-29 | 5 listing cap at account level | KYC is per person; prevents multi-store cap gaming |
| 2026-06-29 | Count on admin approval only | Drafts should not burn slots; fixes current create-time count |
| 2026-06-29 | No seller delete after publish | Audit trail, dispute support, anti-gaming |
| 2026-06-29 | Extra stores: verified + paid | Abuse prevention + monetization without paywalling first shop |
| 2026-06-29 | `Store` entity (1 enforced, N ready) | Clean API; avoids re-conflating profile fields |

---

## Related docs

- [master-blueprint-v1.md](./master-blueprint-v1.md) — monetization, verification, storefront UX
- [monetization.md](./monetization.md) — platform purchase patterns
- [roadmap.md](./roadmap.md) — delivery phasing
