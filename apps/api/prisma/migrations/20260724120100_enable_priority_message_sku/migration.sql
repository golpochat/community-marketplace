-- Enable priority_message SKU for existing platform_settings rows that still
-- carry the pre-fulfillment default (enabled: false).
UPDATE "platform_settings"
SET "pricing" = jsonb_set(
  COALESCE("pricing", '{}'::jsonb),
  '{skus,priority_message}',
  COALESCE(
    "pricing"->'skus'->'priority_message',
    '{"amount": 0.49, "enabled": true}'::jsonb
  ) || '{"enabled": true}'::jsonb,
  true
)
WHERE id = 'default';
