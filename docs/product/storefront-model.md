# Storefront & Account Model (v1)

> **Status:** Implemented (v1) — core rules live in API + `/account/storefront`  
> **Last updated:** 2026-07-22

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
- **Buyers do not get storefronts.** Only seller accounts. Default registration role is **`MEMBER`** (unified `/account` hub).

---

## 2. API & web separation

Seller-facing and public APIs treat account and storefront as distinct resources.

| Surface | Owns |
|---------|------|
| `/account/*` (web) · `/api/users/me/*` | Personal profile, credentials |
| `/api/seller/verification/*` | ID submission, verification status |
| `/api/seller/stores/*` | Storefront CRUD, branding, slug, policies |
| Public **API** `GET /api/stores/:slug` | Buyer-facing storefront JSON |
| Public **web** `/store/[slug]` | Buyer-facing storefront page |

**Data model**

- `Store` entity exists (`userId`, 1:N with account). Unverified sellers are gated to **1** free store; verified sellers may purchase slots.
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
| Multi-store UX | Partially shipped — storefront settings support tabs / create / slots; listing-create store picker may still polish |
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

### Title amend after first approval (A1)

Applies only when a listing has been admin-approved at least once (`activatedAt` set) and status is `active` or `paused`.

| Change | Result |
|--------|--------|
| Typo / wording amendment (≥60% token similarity) | Live title stays visible; proposed title queued for admin review |
| Completely different title (&lt;60% similarity) | Hard reject — create a new listing instead |
| First-time draft / never activated | Free title edit via normal listing update |

Buyers always see the live title until an admin approves the amendment.

### Photos on submit

- Drafts may be saved without photos.
- Submit for review requires **at least one photo** (API + seller UI).

### Extra fraud cap (planned — not coded)

- Spec once proposed: new seller accounts (&lt;30 days) ≤ **5 draft listings per calendar day**.
- **Not implemented** in seller/listing gate services as of 2026-07-22. Do not treat as live policy.

### `under_review` seller status

- While identity verification is `under_review`, new listing **create** and **submit/activate** are hard-blocked.
- Sellers should finish verification before adding more inventory.

---

## 6. Multi-storefront monetization

Store-slot SKUs (`store_slot_2/3`, `store_bundle_3`) are **live** alongside the `Store` entity.

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

| Phase | Scope | Status |
|-------|--------|--------|
| **v1** | `Store` table, API split, `storeId` on listings, approval-based 5-cap, no-delete-after-publish, migrate `businessName` → store | ✅ Live |
| **v1 (same release)** | Store-slot SKUs, `storeSlotLimit`, verified-only purchase gate | ✅ Live |
| **v2 polish** | Listing-create store picker polish, bundle merchandising | Partial / ongoing |

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
| 2026-07-22 | Status → Implemented (v1) | Core storefront model shipped; web path `/store/[slug]` |

---

## Related docs

- [master-blueprint-v1.md](./master-blueprint-v1.md) — monetization, verification, storefront UX
- [monetization.md](./monetization.md) — platform purchase patterns
- [roadmap.md](./roadmap.md) — delivery phasing
