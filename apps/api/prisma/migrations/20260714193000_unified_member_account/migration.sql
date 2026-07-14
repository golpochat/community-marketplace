-- Unified marketplace account: MEMBER role + seller onboarding timestamp

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "seller_onboarding_started_at" TIMESTAMP(3);

INSERT INTO "roles" ("id", "code", "name", "description", "is_system", "created_at", "updated_at")
VALUES (
  '00000000-0000-4000-8000-000000000008',
  'MEMBER',
  'Member',
  'System role: MEMBER',
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("code") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description";

-- MEMBER role permissions (buyer defaults)
INSERT INTO "role_permissions" ("role_id", "permission_id", "created_at")
SELECT r.id, p.id, CURRENT_TIMESTAMP
FROM "roles" r
CROSS JOIN "permissions" p
WHERE r.code = 'MEMBER'
  AND p.code IN (
    'view_listings',
    'purchase_item',
    'view_payments',
    'leave_review',
    'view_reviews',
    'submit_verification',
    'send_message',
    'view_conversations',
    'favorite_listing',
    'report_listing'
  )
ON CONFLICT ("role_id", "permission_id") DO NOTHING;

-- Legacy SELLER may purchase after unified account
INSERT INTO "role_permissions" ("role_id", "permission_id", "created_at")
SELECT r.id, p.id, CURRENT_TIMESTAMP
FROM "roles" r
CROSS JOIN "permissions" p
WHERE r.code = 'SELLER'
  AND p.code IN ('purchase_item', 'leave_review', 'view_reviews')
ON CONFLICT ("role_id", "permission_id") DO NOTHING;

-- Mark legacy sellers as onboarded before role migration
UPDATE "users" u
SET "seller_onboarding_started_at" = COALESCE(u."seller_onboarding_started_at", u."created_at")
FROM "roles" r
WHERE u."primary_role_id" = r.id
  AND r.code = 'SELLER';

-- Migrate existing marketplace users to MEMBER
UPDATE "users" u
SET "primary_role_id" = m.id
FROM "roles" r
JOIN "roles" m ON m.code = 'MEMBER'
WHERE u."primary_role_id" = r.id
  AND r.code IN ('BUYER', 'SELLER');

-- Grant seller capability overrides for users who already started selling
INSERT INTO "user_permissions" ("id", "user_id", "permission_id", "effect", "reason", "created_at", "updated_at")
SELECT gen_random_uuid(), u.id, p.id, 'GRANT', 'Migrated seller capabilities', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "users" u
CROSS JOIN "permissions" p
WHERE u."seller_onboarding_started_at" IS NOT NULL
  AND p.code IN ('create_listing', 'edit_listing', 'delete_listing', 'receive_payment')
ON CONFLICT ("user_id", "permission_id") DO NOTHING;
