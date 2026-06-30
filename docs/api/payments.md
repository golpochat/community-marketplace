# Payments API

> Base paths: `/api/buyer/payments`, `/api/seller/earnings`, `/api/admin/payments`, `/api/payments/webhooks/stripe`

## Overview

Marketplace payments use **Stripe Connect Express** with platform application fees. Card data is never stored — buyers complete payment via Stripe PaymentIntent client secrets (Stripe Elements on the client).

### Data model

| Entity | Purpose |
|--------|---------|
| `Payment` | Buyer → seller charge for a listing |
| `Payout` | Seller withdrawal to bank via Stripe |
| `LedgerEntry` | Credit/debit audit trail per user |
| `PaymentRefund` | Buyer-requested, admin-approved refunds |
| `PaymentDispute` | Stripe chargeback/dispute records |
| `StripeConnectAccount` | Seller Connect account linkage |
| `PaymentAuditLog` | Immutable audit of payment actions |
| `ProcessedStripeEvent` | Webhook idempotency |

### Payment statuses

| Status | Description |
|--------|-------------|
| `pending` | PaymentIntent created, awaiting confirmation |
| `processing` | Stripe processing |
| `succeeded` | Funds captured |
| `failed` | Payment failed |
| `refunded` | Refund issued |
| `disputed` | Chargeback/dispute opened |

---

## Stripe Connect onboarding (Seller)

Sellers must onboard before receiving payments.

```http
POST /api/seller/earnings/connect/onboard
Authorization: Bearer <token>
X-Device-Fingerprint: <fingerprint>

{
  "country": "US",
  "returnUrl": "https://app.example/seller/earnings",
  "refreshUrl": "https://app.example/seller/earnings"
}
```

```json
{
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "stripeAccountId": "acct_...",
    "chargesEnabled": false,
    "payoutsEnabled": false,
    "onboardingComplete": false,
    "onboardingUrl": "https://connect.stripe.com/...",
    "createdAt": "2026-06-24T00:00:00.000Z",
    "updatedAt": "2026-06-24T00:00:00.000Z"
  }
}
```

### Check onboarding status

```http
GET /api/seller/earnings/connect/status
```

Admins can view any seller's Connect status:

```http
GET /api/admin/payments/connect/:userId
```

**RBAC**

| Endpoint | Roles | Permissions |
|----------|-------|-------------|
| `POST .../connect/onboard` | `SELLER` | `receive_payment` |
| `GET .../connect/status` | `SELLER` | `receive_payment` |
| `GET /admin/payments/connect/:userId` | `ADMIN`, `SUPER_ADMIN` | `manage_payments` |

---

## Payment intent flow (Buyer)

### 1. Create payment intent

Validates listing availability, seller verification, seller Connect account, and anti-fraud limits.

```http
POST /api/buyer/payments/intent

{
  "listingId": "uuid",
  "method": "card"
}
```

```json
{
  "data": {
    "payment": {
      "id": "uuid",
      "listingId": "uuid",
      "buyerId": "uuid",
      "sellerId": "uuid",
      "amount": 150,
      "platformFee": 15,
      "currency": "USD",
      "method": "card",
      "status": "pending",
      "providerPaymentId": "pi_...",
      "createdAt": "...",
      "updatedAt": "..."
    },
    "clientSecret": "pi_..._secret_..."
  }
}
```

Use `clientSecret` with **Stripe Elements** on the client. Never send card numbers to this API.

### 2. Confirm payment (optional poll)

After client-side confirmation, optionally sync status:

```http
POST /api/buyer/payments/confirm

{ "paymentId": "uuid" }
```

Final status is authoritative via webhooks (`payment_intent.succeeded` / `payment_intent.payment_failed`).

### Buyer history

```http
GET /api/buyer/payments?page=1&limit=20
GET /api/buyer/payments/:id
```

**RBAC**

| Endpoint | Roles | Permissions |
|----------|-------|-------------|
| `POST .../intent` | `BUYER` | `purchase_item` |
| `POST .../confirm` | `BUYER` | `purchase_item` |
| `GET .../payments` | `BUYER` | `view_payments` |
| `GET .../payments/:id` | `BUYER` (owner) | `view_payments` |

---

## Webhooks

```http
POST /api/payments/webhooks/stripe
Stripe-Signature: t=...,v1=...
Content-Type: application/json

<raw Stripe event body>
```

**Public endpoint** — verified with `STRIPE_WEBHOOK_SECRET`.

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Finalize payment from Stripe Checkout (Buy now flow), mark listing `sold` |
| `payment_intent.succeeded` | Mark payment `succeeded`, credit seller ledger, debit buyer ledger, mark listing `sold`, chat system message |
| `payment_intent.payment_failed` | Mark payment `failed`, chat system message |
| `refund.created` | Mark payment `refunded` (preferred; replaces legacy `charge.refunded`) |
| `charge.refunded` | Mark payment `refunded` (legacy; still handled if enabled) |
| `charge.dispute.created` | Create dispute, mark payment `disputed`, notify seller |
| `transfer.created` | Platform → seller Connect transfer (destination charges); optional audit |
| `payout.paid` | Record seller bank payout, ledger debit (**Connected accounts** scope) |
| `payout.failed` | Record failed seller bank payout (**Connected accounts** scope) |
| `account.updated` | Sync Connect onboarding / KYC flags (`charges_enabled`, `payouts_enabled`) |

### Stripe Dashboard event selection

Stripe’s UI splits events by **scope** and **category**. Use two destinations (same URL is fine) if needed.

#### Destination 1 — **Your account** (platform)

| Stripe category | Event |
|-----------------|-------|
| Account | `account.updated` |
| Charge | `charge.dispute.created` |
| Checkout | `checkout.session.completed` |
| Payment Intent | `payment_intent.succeeded` |
| Payment Intent | `payment_intent.payment_failed` |
| Refund | `refund.created` |
| Transfer | `transfer.created` |

> **Note:** `charge.refunded` is legacy. Stripe now lists refunds under the **Refund** category as `refund.created`.

#### Destination 2 — **Connected accounts** (seller Express accounts)

| Stripe category | Event |
|-----------------|-------|
| Payout | `payout.paid` |
| Payout | `payout.failed` |

> Payout events fire on the **seller’s** Connect account when Stripe pays out to their bank. They do **not** appear under “Your account” — create a second event destination with **Events from → Connected accounts**.

Endpoint URL (both destinations): `https://api.sellnearby.ie/api/payments/webhooks/stripe`  
Local: `stripe listen --forward-to localhost:4000/api/payments/webhooks/stripe` (add `--forward-connect-to` for connected-account events).

Events are deduplicated via `ProcessedStripeEvent`.

---

## Refunds & disputes

### Buyer requests refund

```http
POST /api/buyer/payments/refunds

{
  "paymentId": "uuid",
  "reason": "Item not as described"
}
```

Creates `PaymentRefund` with status `pending`.

### Admin approves/rejects

```http
POST /api/admin/payments/refunds/approve

{
  "refundId": "uuid",
  "approve": true,
  "reason": "Valid refund request"
}
```

On approval, triggers Stripe refund, updates payment to `refunded`, and writes ledger entries.

**RBAC**

| Endpoint | Roles | Permissions |
|----------|-------|-------------|
| `POST /buyer/payments/refunds` | `BUYER` | `view_payments` |
| `POST /admin/payments/refunds/approve` | `ADMIN`, `SUPER_ADMIN` | `refund_payment` |
| `GET /admin/payments/refunds/pending` | `ADMIN`, `SUPER_ADMIN` | `manage_payments` |

### Disputes

Created automatically from `charge.dispute.created` webhooks.

```http
GET /api/admin/payments/disputes
GET /api/admin/payments/disputes/:id
POST /api/admin/payments/disputes/evidence

{
  "disputeId": "uuid",
  "evidence": {
    "shipping_documentation": "https://..."
  }
}
```

---

## Payouts

Stripe handles automatic payouts to connected accounts. Admins can trigger manual payouts:

```http
POST /api/admin/payments/payouts/manual

{
  "sellerId": "uuid",
  "amount": 100,
  "currency": "USD"
}
```

### Seller endpoints

```http
GET /api/seller/earnings
GET /api/seller/earnings/payouts?page=1&limit=20
GET /api/seller/earnings/payments?page=1&limit=20
```

**RBAC**

| Endpoint | Roles | Permissions |
|----------|-------|-------------|
| Seller earnings/payouts | `SELLER` | `view_payments` |
| Manual payout | `ADMIN`, `SUPER_ADMIN` | `manage_payments` |

---

## Ledger system

Every succeeded payment, refund, and payout creates `LedgerEntry` rows:

| Type | Meaning |
|------|---------|
| `credit` | Funds in (seller net on payment) |
| `debit` | Funds out (buyer payment, refund, payout) |

```http
GET /api/admin/payments/ledger?page=1&limit=50
```

---

## Admin payment management

```http
GET /api/admin/payments?status=succeeded&buyerId=uuid&sellerId=uuid&listingId=uuid&page=1&limit=20
GET /api/admin/payments/:id
```

**RBAC:** `ADMIN` / `SUPER_ADMIN` with `manage_payments`. `SUPER_ADMIN` has full access.

---

## Security & compliance

- **PCI:** No card data stored. Use PaymentIntent `clientSecret` + Stripe.js/Elements only.
- **Anti-fraud:** Daily payment limits, active account checks, listing ownership validation, self-purchase blocked, banned users blocked.
- **Audit:** All payment actions logged in `PaymentAuditLog`.

---

## Error cases

| Code | Scenario |
|------|----------|
| `400` | Listing unavailable, seller not onboarded, daily limit exceeded, invalid refund state |
| `403` | Wrong role, not payment participant |
| `404` | Payment/refund/dispute not found |
| `401` | Missing or invalid auth |

---

## Environment

| Variable | Description |
|----------|-------------|
| `STRIPE_SECRET_KEY` | Stripe API secret key |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret |
| `PLATFORM_FEE_PERCENT` | Platform fee (default `10`) |
| `MAX_DAILY_PAYMENTS_PER_USER` | Anti-fraud daily cap (default `10`) |
| `WEB_APP_URL` | Used for Connect return URLs |

---

## Frontend routes

| Role | Route |
|------|-------|
| `BUYER` | `/buyer/payments` |
| `SELLER` | `/seller/earnings` |
