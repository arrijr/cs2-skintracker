-- AlterTable
ALTER TABLE "Skin" ADD COLUMN     "isStar" BOOLEAN,
ADD COLUMN     "isStattrak" BOOLEAN,
ADD COLUMN     "itemName" TEXT,
ADD COLUMN     "itemType" TEXT,
ADD COLUMN     "offerVolume" INTEGER,
ADD COLUMN     "priceAvg" DOUBLE PRECISION,
ADD COLUMN     "priceMax" DOUBLE PRECISION,
ADD COLUMN     "priceMedian" DOUBLE PRECISION,
ADD COLUMN     "priceMin" DOUBLE PRECISION,
ADD COLUMN     "quality" TEXT,
ADD COLUMN     "rarity" TEXT,
ADD COLUMN     "sold24h" INTEGER;
