# Seller Verification (Admin)

> **Screen:** `/dashboard/verifications` · **Permission:** `approve_verification`

## Workflow

1. Open **Verifications** queue (pending submissions)
2. Review documents (R2 `verification-documents/` prefix)
3. **Approve** or **Reject** with notes
4. Seller notified via Notifications module

```mermaid
sequenceDiagram
  participant Admin
  participant UI as Admin UI
  participant API
  participant Seller

  Admin->>UI: Review submission
  UI->>API: POST .../approve
  API->>Seller: notification
```

## Edge cases

- Rejected sellers may resubmit per policy
- Approved sellers gain seller capabilities on next session

## API

See [users API](../api/users.md#admin-verification)

## Screenshot placeholder

`docs/admin/assets/verification-queue.png`
