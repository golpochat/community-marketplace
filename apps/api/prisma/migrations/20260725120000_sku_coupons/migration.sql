-- CreateEnum
CREATE TYPE "CouponDiscountType" AS ENUM ('percent', 'fixed');

-- AlterTable
ALTER TABLE "platform_purchases" ADD COLUMN "coupon_id" TEXT;

-- CreateTable
CREATE TABLE "coupons" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "discount_type" "CouponDiscountType" NOT NULL,
    "discount_value" DECIMAL(12,2) NOT NULL,
    "allowed_purchase_types" JSONB NOT NULL DEFAULT '[]',
    "max_redemptions" INTEGER,
    "max_per_user" INTEGER NOT NULL DEFAULT 1,
    "starts_at" TIMESTAMP(3),
    "ends_at" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coupons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coupon_redemptions" (
    "id" TEXT NOT NULL,
    "coupon_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "platform_purchase_id" TEXT NOT NULL,
    "amount_saved" DECIMAL(12,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coupon_redemptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "coupons_code_key" ON "coupons"("code");

-- CreateIndex
CREATE INDEX "coupons_active_ends_at_idx" ON "coupons"("active", "ends_at");

-- CreateIndex
CREATE UNIQUE INDEX "coupon_redemptions_platform_purchase_id_key" ON "coupon_redemptions"("platform_purchase_id");

-- CreateIndex
CREATE INDEX "coupon_redemptions_coupon_id_created_at_idx" ON "coupon_redemptions"("coupon_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "coupon_redemptions_user_id_coupon_id_idx" ON "coupon_redemptions"("user_id", "coupon_id");

-- CreateIndex
CREATE INDEX "platform_purchases_coupon_id_idx" ON "platform_purchases"("coupon_id");

-- AddForeignKey
ALTER TABLE "platform_purchases" ADD CONSTRAINT "platform_purchases_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "coupons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "coupon_redemptions_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "coupons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "coupon_redemptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "coupon_redemptions_platform_purchase_id_fkey" FOREIGN KEY ("platform_purchase_id") REFERENCES "platform_purchases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
