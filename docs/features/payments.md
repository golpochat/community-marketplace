# Payments Module

> **Feature:** Stripe Connect marketplace payments · **API:** [payments.md](../api/payments.md)

## Functional requirements

- Stripe Connect onboarding for sellers
- Payment intents with platform fee
- Webhook handling (`payment_intent.succeeded`, disputes)
- Refunds with admin approval workflow
- Disputes and evidence submission
- Ledger and earnings views for sellers
- Fraud checks (daily limits per user)

## Non-functional requirements

- Webhook signature verification
- Idempotent webhook processing
- PCI: card data never touches API (Stripe.js)

## User flows

See [Sequence Diagrams — Stripe](../architecture/sequence-diagrams.md#4-stripe-connect-payment).

## Edge cases

| Case | Behavior |
|------|----------|
| Webhook replay | Idempotent by event ID |
| Refund exceeds balance | Rejected with clear error |
| Unconnected seller | Payment blocked |

## Acceptance criteria

- [ ] Buyer completes payment via Stripe client secret
- [ ] Seller receives notification on success
- [ ] Admin can approve pending refunds

## Related

- [Admin — Payments](../admin/payments.md)
