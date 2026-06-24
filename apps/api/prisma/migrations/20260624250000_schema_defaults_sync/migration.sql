-- Align column defaults with current Prisma schema (@updatedAt and explicit defaults).

ALTER TABLE "categories" ALTER COLUMN "updated_at" DROP DEFAULT;

ALTER TABLE "device_tokens" ALTER COLUMN "updated_at" DROP DEFAULT;

ALTER TABLE "listings" ALTER COLUMN "latitude" DROP DEFAULT,
ALTER COLUMN "longitude" DROP DEFAULT;

ALTER TABLE "payments" ALTER COLUMN "method" SET DEFAULT 'card';

ALTER TABLE "user_profiles" ALTER COLUMN "updated_at" DROP DEFAULT;
