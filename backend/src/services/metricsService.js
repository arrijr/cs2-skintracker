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
const FIXED_MONTHLY_COSTS = 21; // break-even denominator (cheapest tier)

export async function calculateBusinessMetrics() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [totalUsers, payingUsers, churnedUsers] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isPremium: true } }),
    // Rough churn: users who had premium but now don't, updated in last 30 days
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
  const estimatedMonthlyChurn =
    payingUsers > 0 ? Math.round((churnedUsers / payingUsers) * 100) : 0;

  return {
    mrr: Math.round(mrr * 100) / 100,
    totalUsers,
    payingUsers,
    freeUsers,
    liteUsers,
    proUsers,
    arpu: Math.round(arpu * 100) / 100,
    estimatedMonthlyChurn,
    breakEvenUsers: Math.ceil(FIXED_MONTHLY_COSTS / LITE_PRICE),
    generatedAt: new Date().toISOString(),
  };
}
