# Payments & Refunds (Admin)

> **Screen:** `/dashboard/payments` · **Permission:** `view_payments`, `approve_refunds`

## Capabilities

- View payment history and ledger
- Approve pending refunds
- Manage disputes and submit evidence
- Manual payouts (restricted permission)
- Stripe Connect status per seller

## Refund approval workflow

1. **Payments** → **Pending refunds**
2. Review amount and reason
3. Approve → triggers Stripe refund

## API

[admin.md](../api/admin.md#payments-apadminpayments)

## Screenshot placeholder

`docs/admin/assets/payments-refunds.png`
