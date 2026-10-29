-- Access levels (staff / head), demo personas, tile logos, head-only tiles.
-- Additive + defaulted: existing users become STAFF, non-demo; existing tiles
-- keep their visibility.

CREATE TYPE "AccessLevel" AS ENUM ('STAFF', 'HEAD');

ALTER TABLE "User" ADD COLUMN "level" "AccessLevel" NOT NULL DEFAULT 'STAFF';
ALTER TABLE "User" ADD COLUMN "isDemo" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "AppCatalog" ADD COLUMN "logo" TEXT;
ALTER TABLE "AppCatalog" ADD COLUMN "headOnlyIn" "Department"[] DEFAULT ARRAY[]::"Department"[];
