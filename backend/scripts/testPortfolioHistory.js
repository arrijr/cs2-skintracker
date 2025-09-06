// /backend/scripts/testPortfolioHistory.js (Backend)
import "dotenv/config";
import { calculateAndStorePortfolioValues } from "../src/cron/portfolioHistoryService.js";
import prisma from "../src/prisma/prismaClient.js";

async function testPortfolioHistory() {
  console.log("🧪 Testing Portfolio History Cron Job");
  console.log("====================================");

  try {
    // Check current portfolio history stats
    console.log("\n1. Current Portfolio History Stats:");
    const stats = await prisma.portfolioHistory.groupBy({
      by: ['userId'],
      _count: { id: true },
      _max: { date: true },
      _min: { date: true }
    });
    
    console.log(`Found ${stats.length} users with portfolio history`);
    stats.forEach(stat => {
      console.log(`  User ${stat.userId}: ${stat._count.id} entries (${stat._min.date} to ${stat._max.date})`);
    });

    // Check recent job runs
    console.log("\n2. Recent Job Runs:");
    const recentJobs = await prisma.jobRun.findMany({
      where: {
        jobName: 'portfolio-history'
      },
      orderBy: { startedAt: 'desc' },
      take: 5
    });
    
    recentJobs.forEach(job => {
      console.log(`  ${job.startedAt.toISOString()}: ${job.status} (${job.duration}ms)`);
      if (job.errorMessage) {
        console.log(`    Error: ${job.errorMessage}`);
      }
    });

    // Run the portfolio history calculation
    console.log("\n3. Running Portfolio History Calculation...");
    const startTime = Date.now();
    
    await calculateAndStorePortfolioValues();
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    console.log(`✅ Portfolio history calculation completed in ${duration}ms`);

    // Check results
    console.log("\n4. Results After Calculation:");
    const newStats = await prisma.portfolioHistory.groupBy({
      by: ['userId'],
      _count: { id: true },
      _max: { date: true },
      _avg: { value: true },
      _sum: { value: true }
    });
    
    newStats.forEach(stat => {
      console.log(`  User ${stat.userId}:`);
      console.log(`    Entries: ${stat._count.id}`);
      console.log(`    Latest: ${stat._max.date}`);
      console.log(`    Avg Value: $${stat._avg.value?.toFixed(2) || 'N/A'}`);
      console.log(`    Total Value: $${stat._sum.value?.toFixed(2) || 'N/A'}`);
    });

    // Test API endpoint simulation
    console.log("\n5. Testing API Endpoint Simulation:");
    const testUserId = stats[0]?.userId;
    if (testUserId) {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const history = await prisma.portfolioHistory.findMany({
        where: {
          userId: testUserId,
          date: {
            gte: thirtyDaysAgo
          }
        },
        orderBy: { date: 'asc' }
      });
      
      console.log(`  User ${testUserId} - Last 30 days: ${history.length} entries`);
      if (history.length > 0) {
        console.log(`    First: ${history[0].date.toISOString().split('T')[0]} - $${history[0].value}`);
        console.log(`    Last: ${history[history.length - 1].date.toISOString().split('T')[0]} - $${history[history.length - 1].value}`);
      }
    }

    // Check for data quality issues
    console.log("\n6. Data Quality Check:");
    const nullValues = await prisma.portfolioHistory.count({
      where: {
        OR: [
          { value: null },
          { value: 0 },
          { invested: null },
          { unrealizedPL: null }
        ]
      }
    });
    
    if (nullValues > 0) {
      console.log(`⚠️  Found ${nullValues} entries with null/zero values`);
    } else {
      console.log("✅ No data quality issues found");
    }

    // Check carry-forward logic
    console.log("\n7. Carry-Forward Logic Test:");
    const userWithHistory = await prisma.portfolioHistory.findFirst({
      where: { value: { gt: 0 } },
      include: { user: true }
    });
    
    if (userWithHistory) {
      console.log(`  Testing carry-forward for user ${userWithHistory.user.email}`);
      
      // Get portfolio for this user
      const portfolio = await prisma.portfolio.findMany({
        where: { userId: userWithHistory.userId },
        include: { skin: true }
      });
      
      console.log(`    Portfolio: ${portfolio.length} items`);
      portfolio.forEach(item => {
        console.log(`      ${item.skin.marketHashName}: ${item.amount}x $${item.buyPrice}`);
      });
    }

    console.log("\n✅ Portfolio History Test Completed Successfully!");

  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testPortfolioHistory();
