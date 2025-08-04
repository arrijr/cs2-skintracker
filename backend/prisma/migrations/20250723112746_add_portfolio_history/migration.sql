-- CreateTable
CREATE TABLE "PortfolioHistory" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "PortfolioHistory_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PortfolioHistory" ADD CONSTRAINT "PortfolioHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
