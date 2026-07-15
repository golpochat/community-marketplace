-- Enterprise invariant: at most one open (pending) seller verification request per user.
-- 1) Merge document/priority signals onto the canonical row
-- 2) Close duplicate pending rows
-- 3) Enforce with a partial unique index

WITH ranked AS (
  SELECT
    id,
    user_id,
    id_document_path,
    selfie_path,
    address_document_path,
    phone_number,
    priority,
    ROW_NUMBER() OVER (
      PARTITION BY user_id
      ORDER BY
        CASE
          WHEN id_document_path IS NOT NULL AND selfie_path IS NOT NULL THEN 0
          ELSE 1
        END,
        priority DESC,
        created_at DESC
    ) AS rn
  FROM seller_verification_requests
  WHERE status = 'pending'
),
keepers AS (
  SELECT * FROM ranked WHERE rn = 1
),
losers AS (
  SELECT * FROM ranked WHERE rn > 1
),
merged AS (
  SELECT
    k.id AS keeper_id,
    COALESCE(k.id_document_path, (
      SELECT l.id_document_path FROM losers l
      WHERE l.user_id = k.user_id AND l.id_document_path IS NOT NULL
      LIMIT 1
    )) AS id_document_path,
    COALESCE(k.selfie_path, (
      SELECT l.selfie_path FROM losers l
      WHERE l.user_id = k.user_id AND l.selfie_path IS NOT NULL
      LIMIT 1
    )) AS selfie_path,
    COALESCE(k.address_document_path, (
      SELECT l.address_document_path FROM losers l
      WHERE l.user_id = k.user_id AND l.address_document_path IS NOT NULL
      LIMIT 1
    )) AS address_document_path,
    COALESCE(k.phone_number, (
      SELECT l.phone_number FROM losers l
      WHERE l.user_id = k.user_id AND l.phone_number IS NOT NULL
      LIMIT 1
    )) AS phone_number,
    (
      k.priority OR EXISTS (
        SELECT 1 FROM losers l WHERE l.user_id = k.user_id AND l.priority = true
      )
    ) AS priority
  FROM keepers k
)
UPDATE seller_verification_requests svr
SET
  id_document_path = m.id_document_path,
  selfie_path = m.selfie_path,
  address_document_path = m.address_document_path,
  phone_number = m.phone_number,
  priority = m.priority,
  updated_at = NOW()
FROM merged m
WHERE svr.id = m.keeper_id;

UPDATE seller_verification_requests svr
SET
  status = 'rejected',
  rejection_reason = 'Superseded: duplicate open verification request closed',
  reviewed_at = NOW(),
  updated_at = NOW()
FROM (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id
      ORDER BY
        CASE
          WHEN id_document_path IS NOT NULL AND selfie_path IS NOT NULL THEN 0
          ELSE 1
        END,
        priority DESC,
        created_at DESC
    ) AS rn
  FROM seller_verification_requests
  WHERE status = 'pending'
) ranked
WHERE svr.id = ranked.id
  AND ranked.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS seller_verification_requests_one_pending_per_user
  ON seller_verification_requests (user_id)
  WHERE status = 'pending';
