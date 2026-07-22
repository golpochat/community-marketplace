# Payments & Refunds (Admin)

> **Screen:** `/admin/payments` · `/admin/finance` · **Permission:** `view_payments`, `refund_payment` / `manage_payments`

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
