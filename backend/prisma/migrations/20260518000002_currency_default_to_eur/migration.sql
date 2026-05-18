-- Switch default preferredCurrency from USD to EUR.
-- Steam Market prices are scraped in EUR; default user currency should match.
UPDATE "User" SET "preferredCurrency" = 'EUR' WHERE "preferredCurrency" = 'USD';
ALTER TABLE "User" ALTER COLUMN "preferredCurrency" SET DEFAULT 'EUR';
