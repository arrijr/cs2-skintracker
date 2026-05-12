/**
 * metricsService.js
 * Business KPI calculations: MRR, user tier counts, churn estimate.
 *
 * Schema note: User model has isPremium (Boolean) but no subscriptionTier field.
 * All paying users are treated as "pro" tier (19.99/mo) since there is no lite tier
 * distinction in the database. liteUsers is always 0 until schema adds a tier field.
 */
import prisma from '../prisma/prismaClient.js';

const LITE_PRICE = 4.99;
const PRO_PRICE = 19.99;
// Vercel Pro $20 + domain $1/mo
const FIXED_MONTHLY_COSTS = 21;

export async function calculateBusinessMetrics() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [totalUsers, payingUsers, recentNonPremiumUpdatesRaw] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isPremium: true } }),
    // Proxy for churn: non-premium users updated in last 30 days (includes new signups, not actual churned premium users)
    prisma.user.count({
      where: {
        isPremium: false,
        updatedAt: { gte: thirtyDaysAgo },
      },
    }),
  ]);

  // No lite/pro split in schema — all paying users count as pro until schema evolves
  const liteUsers = 0;
  const proUsers = payingUsers;
  const freeUsers = totalUsers - payingUsers;

  const mrr = liteUsers * LITE_PRICE + proUsers * PRO_PRICE;
  const arpu = payingUsers > 0 ? mrr / payingUsers : 0;
  const recentNonPremiumUpdates =
    payingUsers > 0 ? Math.round((recentNonPremiumUpdatesRaw / payingUsers) * 100) : 0;

  return {
    mrr: Math.round(mrr * 100) / 100,
    totalUsers,
    payingUsers,
    freeUsers,
    liteUsers,
    proUsers,
    arpu: Math.round(arpu * 100) / 100,
    recentNonPremiumUpdates,
    breakEvenUsers: Math.ceil(FIXED_MONTHLY_COSTS / PRO_PRICE),
    generatedAt: new Date().toISOString(),
  };
}
