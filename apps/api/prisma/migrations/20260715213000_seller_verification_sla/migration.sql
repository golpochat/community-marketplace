-- Persist fast-track SLA anchors and overdue notification state.
ALTER TABLE seller_verification_requests
  ADD COLUMN IF NOT EXISTS priority_activated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sla_due_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sla_overdue_notified_at TIMESTAMPTZ;

UPDATE seller_verification_requests svr
SET
  priority_activated_at = u.verification_requested_at,
  sla_due_at = u.verification_requested_at + INTERVAL '24 hours'
FROM users u
WHERE svr.user_id = u.id
  AND svr.status = 'pending'
  AND svr.priority = true
  AND u.verification_requested_at IS NOT NULL
  AND svr.priority_activated_at IS NULL;

CREATE INDEX IF NOT EXISTS seller_verification_requests_sla_due_pending_idx
  ON seller_verification_requests (sla_due_at)
  WHERE status = 'pending' AND priority = true;
