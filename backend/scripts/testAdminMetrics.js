// /backend/scripts/testAdminMetrics.js (Backend)
import "dotenv/config";
import { apiFetch } from "../src/lib/http.js";

async function testAdminMetrics() {
  console.log("🧪 Testing Admin Mini-Metrics System");
  console.log("====================================");

  try {
    // Test overview metrics endpoint
    console.log("\n1. Testing Overview Metrics Endpoint:");
    const overviewResponse = await apiFetch('/api/v1/admin/metrics/overview');
    
    if (overviewResponse.success) {
      console.log("✅ Overview metrics retrieved successfully:");
      console.log(`  Users: ${overviewResponse.metrics.users.total} (${overviewResponse.metrics.users.admins} admins, ${overviewResponse.metrics.users.regular} regular)`);
      console.log(`  Watchlist: ${overviewResponse.metrics.watchlist.totalItems} items (${overviewResponse.metrics.watchlist.uniqueSkins} unique skins)`);
      console.log(`  Portfolio: ${overviewResponse.metrics.portfolio.totalItems} items, $${overviewResponse.metrics.portfolio.totalValue} total value`);
      console.log(`  Price History: ${overviewResponse.metrics.priceHistory.totalEntries} entries (${overviewResponse.metrics.priceHistory.uniqueSkins} unique skins)`);
      console.log(`  Portfolio History: ${overviewResponse.metrics.portfolioHistory.totalEntries} entries`);
      console.log(`  Transactions: ${overviewResponse.metrics.transactions.total} ($${overviewResponse.metrics.transactions.totalValue} total value)`);
      console.log(`  Jobs: ${overviewResponse.metrics.jobs.total} runs (${overviewResponse.metrics.jobs.successful} successful, ${overviewResponse.metrics.jobs.failed} failed)`);
      console.log(`  System Uptime: ${overviewResponse.metrics.system.uptime}s`);
      console.log(`  Memory Usage: ${overviewResponse.metrics.system.memory.used}MB / ${overviewResponse.metrics.system.memory.total}MB`);
      
      // Test growth rates
      console.log("\n  Growth Rates (24h):");
      console.log(`    Users: +${overviewResponse.metrics.users.growth24h} (${overviewResponse.metrics.users.growthRate}%)`);
      console.log(`    Watchlist: +${overviewResponse.metrics.watchlist.growth24h} (${overviewResponse.metrics.watchlist.growthRate}%)`);
      console.log(`    Portfolio: +${overviewResponse.metrics.portfolio.growth24h} (${overviewResponse.metrics.portfolio.growthRate}%)`);
      
      // Test system health
      console.log("\n  System Health:");
      console.log(`    Database: ${overviewResponse.metrics.system.health.database}`);
      console.log(`    API: ${overviewResponse.metrics.system.health.api}`);
      console.log(`    Cron: ${overviewResponse.metrics.system.health.cron}`);
      console.log(`    Memory: ${overviewResponse.metrics.system.health.memory}`);
      
      // Test recent activity
      if (overviewResponse.metrics.recentActivity.length > 0) {
        console.log("\n  Recent Activity:");
        overviewResponse.metrics.recentActivity.slice(0, 3).forEach(activity => {
          console.log(`    ${activity.action} - ${activity.userEmail} (${new Date(activity.createdAt).toLocaleString()})`);
        });
      }
      
    } else {
      console.log(`❌ Overview metrics failed: ${overviewResponse.error}`);
    }

    // Test real-time metrics endpoint
    console.log("\n2. Testing Real-time Metrics Endpoint:");
    const realtimeResponse = await apiFetch('/api/v1/admin/metrics/realtime');
    
    if (realtimeResponse.success) {
      console.log("✅ Real-time metrics retrieved successfully:");
      console.log(`  Active Users (5min): ${realtimeResponse.realtime.activeUsers}`);
      console.log(`  Recent Activity (5min): ${realtimeResponse.realtime.recentActivity}`);
      console.log(`  System Uptime: ${realtimeResponse.realtime.system.uptime}s`);
      console.log(`  Memory: ${realtimeResponse.realtime.system.memory.used}MB / ${realtimeResponse.realtime.system.memory.total}MB`);
      console.log(`  CPU Usage: ${JSON.stringify(realtimeResponse.realtime.system.cpu)}`);
    } else {
      console.log(`❌ Real-time metrics failed: ${realtimeResponse.error}`);
    }

    // Test range metrics endpoint
    console.log("\n3. Testing Range Metrics Endpoint:");
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000); // Last 7 days
    
    const rangeResponse = await apiFetch(`/api/v1/admin/metrics/range?start=${startDate.toISOString()}&end=${endDate.toISOString()}`);
    
    if (rangeResponse.success) {
      console.log("✅ Range metrics retrieved successfully:");
      console.log(`  Period: ${rangeResponse.range.start} to ${rangeResponse.range.end}`);
      console.log(`  Growth (7 days):`);
      console.log(`    Users: +${rangeResponse.range.growth.users}`);
      console.log(`    Watchlist: +${rangeResponse.range.growth.watchlist}`);
      console.log(`    Portfolio: +${rangeResponse.range.growth.portfolio}`);
      console.log(`    Price History: +${rangeResponse.range.growth.priceHistory}`);
      console.log(`    Transactions: +${rangeResponse.range.growth.transactions}`);
    } else {
      console.log(`❌ Range metrics failed: ${rangeResponse.error}`);
    }

    // Test invalid range
    console.log("\n4. Testing Invalid Range (Error Handling):");
    const invalidRangeResponse = await apiFetch('/api/v1/admin/metrics/range?start=invalid&end=invalid');
    
    if (!invalidRangeResponse.success) {
      console.log("✅ Invalid range correctly rejected:");
      console.log(`  Error: ${invalidRangeResponse.error}`);
    } else {
      console.log("❌ Should have rejected invalid range");
    }

    // Test missing parameters
    console.log("\n5. Testing Missing Parameters (Error Handling):");
    const missingParamsResponse = await apiFetch('/api/v1/admin/metrics/range');
    
    if (!missingParamsResponse.success) {
      console.log("✅ Missing parameters correctly rejected:");
      console.log(`  Error: ${missingParamsResponse.error}`);
    } else {
      console.log("❌ Should have rejected missing parameters");
    }

    // Test performance
    console.log("\n6. Testing Performance:");
    const startTime = Date.now();
    const perfResponse = await apiFetch('/api/v1/admin/metrics/overview');
    const endTime = Date.now();
    
    if (perfResponse.success) {
      console.log(`✅ Overview metrics response time: ${endTime - startTime}ms`);
      
      if (endTime - startTime < 1000) {
        console.log("  🚀 Performance: Excellent (< 1s)");
      } else if (endTime - startTime < 3000) {
        console.log("  ⚡ Performance: Good (< 3s)");
      } else {
        console.log("  ⚠️  Performance: Slow (> 3s)");
      }
    }

    // Test data consistency
    console.log("\n7. Testing Data Consistency:");
    if (overviewResponse.success) {
      const metrics = overviewResponse.metrics;
      
      // Check if totals make sense
      const userTotal = metrics.users.admins + metrics.users.regular;
      if (userTotal === metrics.users.total) {
        console.log("✅ User totals are consistent");
      } else {
        console.log(`❌ User totals inconsistent: ${userTotal} vs ${metrics.users.total}`);
      }
      
      // Check if growth rates are reasonable
      const userGrowthRate = parseFloat(metrics.users.growthRate);
      if (userGrowthRate >= 0 && userGrowthRate <= 1000) {
        console.log("✅ User growth rate is reasonable");
      } else {
        console.log(`⚠️  User growth rate seems unusual: ${userGrowthRate}%`);
      }
      
      // Check if system health values are valid
      const validHealthStatuses = ['healthy', 'warning', 'error'];
      const healthStatuses = Object.values(metrics.system.health);
      const allValid = healthStatuses.every(status => validHealthStatuses.includes(status));
      
      if (allValid) {
        console.log("✅ System health statuses are valid");
      } else {
        console.log(`❌ Invalid system health statuses: ${healthStatuses}`);
      }
    }

    console.log("\n✅ Admin Mini-Metrics System Test Completed Successfully!");

  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

// Run the test
testAdminMetrics();
