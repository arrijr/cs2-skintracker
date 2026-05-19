-- Add ON DELETE CASCADE to all User-owned relations so DELETE /users/me works.
-- BlogPost intentionally omitted: blog posts should outlive their author (TODO: nullable authorId migration).
-- Alert / APIKey / APILog already have CASCADE (set elsewhere). JobRun keeps SET NULL.

ALTER TABLE "AuditLog" DROP CONSTRAINT IF EXISTS "AuditLog_userId_fkey";
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Watchlist" DROP CONSTRAINT IF EXISTS "Watchlist_userId_fkey";
ALTER TABLE "Watchlist" ADD CONSTRAINT "Watchlist_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Portfolio" DROP CONSTRAINT IF EXISTS "Portfolio_userId_fkey";
ALTER TABLE "Portfolio" ADD CONSTRAINT "Portfolio_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CasePortfolio" DROP CONSTRAINT IF EXISTS "CasePortfolio_userId_fkey";
ALTER TABLE "CasePortfolio" ADD CONSTRAINT "CasePortfolio_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PortfolioHistory" DROP CONSTRAINT IF EXISTS "PortfolioHistory_userId_fkey";
ALTER TABLE "PortfolioHistory" ADD CONSTRAINT "PortfolioHistory_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Transaction" DROP CONSTRAINT IF EXISTS "Transaction_userId_fkey";
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
