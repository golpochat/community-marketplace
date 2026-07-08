-- Seller identity: private legal name + business verification fields

CREATE TYPE "SellerBusinessStructure" AS ENUM ('individual', 'sole_trader', 'limited_company');

ALTER TABLE "pending_registrations"
  ADD COLUMN "seller_kind" "SellerBusinessStructure";

ALTER TABLE "user_profiles"
  ADD COLUMN "business_structure" "SellerBusinessStructure",
  ADD COLUMN "legal_name" VARCHAR(100),
  ADD COLUMN "registered_company_name" VARCHAR(200),
  ADD COLUMN "cro_number" VARCHAR(20);
