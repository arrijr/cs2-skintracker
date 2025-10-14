// backend/scripts/verifyDataIntegrity.js — [Backend]
// {/* Script to verify data integrity and alert on gaps or issues */}
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import {
  checkMissingData,
  checkPriceHistoryGaps,
  checkQuantityHistoryGaps
} from "../src/services/dataIntegrityService.js";

const prisma = new PrismaClient();

/**
 * Main verification script
 * Checks for data gaps and issues in the database
 */
async function verifyDataIntegrity() {
  console.log("🔍 [VERIFY] Starting data integrity verification...");
  console.log(`📅 [VERIFY] Verification time: ${new Date().toISOString()}`);
  console.log("============================================================\n");

  let hasIssues = false;
  const issues = [];

  try {
    // Check 1: Missing skin data
    console.log("📊 [CHECK 1/3] Checking for skins with missing data...");
    const missingDataReport = await checkMissingData(100);
    
    if (missingDataReport.error) {
      console.error(`❌ Error checking missing data: ${missingDataReport.error}`);
      issues.push(`Missing data check failed: ${missingDataReport.error}`);
      hasIssues = true;
    } else {
      console.log(`  - Skins without prices: ${missingDataReport.skinsWithoutPrices}`);
      console.log(`  - Skins without market data: ${missingDataReport.skinsWithoutMarketData}`);
      console.log(`  - Skins with stale data (>7d): ${missingDataReport.skinsWithStaleData}`);
      
      if (missingDataReport.skinsWithoutPrices > 0) {
        console.warn(`  ⚠️  WARNING: ${missingDataReport.skinsWithoutPrices} skins have no price data!`);
        issues.push(`${missingDataReport.skinsWithoutPrices} skins without price data`);
        hasIssues = true;
      }
      
      if (missingDataReport.skinsWithStaleData > 100) {
        console.warn(`  ⚠️  WARNING: ${missingDataReport.skinsWithStaleData} skins have stale data!`);
        issues.push(`${missingDataReport.skinsWithStaleData} skins with stale data`);
        hasIssues = true;
      }
      
      if (missingDataReport.skinsWithoutPrices === 0 && missingDataReport.skinsWithStaleData < 100) {
        console.log("  ✅ All skins have recent price data!");
      }
    }
    
    console.log("");

    // Check 2: Price history gaps
    console.log("📊 [CHECK 2/3] Checking price history for gaps (last 7 days)...");
    const priceHistoryReport = await checkPriceHistoryGaps(7);
    
    if (priceHistoryReport.error) {
      console.error(`❌ Error checking price history: ${priceHistoryReport.error}`);
      issues.push(`Price history check failed: ${priceHistoryReport.error}`);
      hasIssues = true;
    } else {
      priceHistoryReport.results.forEach(day => {
        const status = day.hasMissingData ? '❌ MISSING' : '✅';
        console.log(`  ${status} ${day.date}: ${day.count.toLocaleString()} entries`);
      });
      
      if (priceHistoryReport.hasGaps) {
        console.warn(`  ⚠️  WARNING: Price history has gaps on: ${priceHistoryReport.missingDays.join(', ')}`);
        issues.push(`Price history gaps: ${priceHistoryReport.missingDays.join(', ')}`);
        hasIssues = true;
      } else {
        console.log("  ✅ No gaps in price history!");
      }
    }
    
    console.log("");

    // Check 3: Quantity history gaps
    console.log("📊 [CHECK 3/3] Checking quantity history for gaps (last 7 days)...");
    const quantityHistoryReport = await checkQuantityHistoryGaps(7);
    
    if (quantityHistoryReport.error) {
      console.error(`❌ Error checking quantity history: ${quantityHistoryReport.error}`);
      issues.push(`Quantity history check failed: ${quantityHistoryReport.error}`);
      hasIssues = true;
    } else {
      quantityHistoryReport.results.forEach(day => {
        const status = day.hasMissingData ? '❌ MISSING' : '✅';
        console.log(`  ${status} ${day.date}: ${day.count.toLocaleString()} entries`);
      });
      
      if (quantityHistoryReport.hasGaps) {
        console.warn(`  ⚠️  WARNING: Quantity history has gaps on: ${quantityHistoryReport.missingDays.join(', ')}`);
        issues.push(`Quantity history gaps: ${quantityHistoryReport.missingDays.join(', ')}`);
        hasIssues = true;
      } else {
        console.log("  ✅ No gaps in quantity history!");
      }
    }

    console.log("\n============================================================");
    
    if (hasIssues) {
      console.warn("⚠️  [VERIFY] Data integrity issues found!");
      console.warn(`📝 Issues (${issues.length}):`);
      issues.forEach((issue, index) => {
        console.warn(`   ${index + 1}. ${issue}`);
      });
      console.log("============================================================\n");
      
      // Exit with error code if critical issues found
      if (issues.some(i => i.includes('MISSING') || i.includes('without price'))) {
        console.error("❌ Critical data integrity issues detected!");
        process.exit(1);
      }
    } else {
      console.log("✅ [VERIFY] All data integrity checks passed!");
      console.log("============================================================\n");
    }

    return {
      success: !hasIssues,
      issues,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error("❌ [VERIFY] Fatal error during verification:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
verifyDataIntegrity()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });

