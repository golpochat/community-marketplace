# Payments API

> **Status:** Placeholder — base path `/api/payments`

## Overview

Payments via Stripe Connect with platform fee support. Sellers onboard through Stripe Express accounts.

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/` | Required | Create payment for listing |
| `GET` | `/` | Required | List user's payments |
| `GET` | `/:id` | Required | Payment detail |
| `POST` | `/connect/onboard` | Required | Start Stripe Connect onboarding |
| `GET` | `/connect/account` | Required | Get Connect account status |

## Create payment

```http
POST /api/payments
Authorization: Bearer <token>

{
  "listingId": "listing-123",
  "amount": 150.00,
  "currency": "USD",
  "method": "card"
}
```

```json
{
  "data": {
    "id": "pay-...",
    "status": "pending",
    "transactionRef": "pi_..._secret_...",
    "amount": 150,
    "currency": "USD"
  }
}
```

## Payment statuses

| Status | Description |
|--------|-------------|
| `pending` | Created, awaiting confirmation |
| `processing` | Stripe processing |
| `completed` | Funds captured |
| `failed` | Payment failed |
| `refunded` | Refund issued |

## Stripe Connect onboarding

```http
POST /api/payments/connect/onboard

{
  "country": "US",
  "returnUrl": "https://community.market/settings/payments/success",
  "refreshUrl": "https://community.market/settings/payments"
}
```

Response includes `onboardingUrl` for Stripe-hosted onboarding.

## Webhooks (TODO)

| Event | Handler |
|-------|---------|
| `payment_intent.succeeded` | Mark payment completed |
| `payment_intent.payment_failed` | Mark payment failed |
| `account.updated` | Update Connect account status |

## Environment

| Variable | Description |
|----------|-------------|
| `STRIPE_SECRET_KEY` | Stripe API secret key |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret |

## TODO

- [ ] Webhook endpoint `POST /api/payments/webhooks/stripe`
- [ ] Platform fee configuration
- [ ] Refund endpoint
