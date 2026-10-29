-- AppCatalog metadata: icon hint, sign-in method, IT-only level gate, coming-soon flag.
-- Additive + defaulted, so existing rows and the init migration remain valid.

ALTER TABLE "AppCatalog" ADD COLUMN "icon" TEXT;
ALTER TABLE "AppCatalog" ADD COLUMN "signIn" TEXT NOT NULL DEFAULT 'ERP_TOKEN';
ALTER TABLE "AppCatalog" ADD COLUMN "itOnly" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "AppCatalog" ADD COLUMN "comingSoon" BOOLEAN NOT NULL DEFAULT false;
