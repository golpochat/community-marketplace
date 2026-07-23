-- AlterTable
ALTER TABLE "categories" ADD COLUMN "requires_review" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "categories" ADD COLUMN "is_hidden" BOOLEAN NOT NULL DEFAULT false;
