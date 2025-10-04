// /backend/scripts/debugCaseData.js — [Backend]
// {/* Debug case data inconsistencies */}
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function debugCaseData() {
  console.log("🔍 Debugging case data inconsistencies...");
  
  try {
    // Get CS:GO Weapon Case (ID: 2)
    const caseData = await prisma.case.findUnique({
      where: { id: 2 },
      include: {
        casePriceHistory: {
          orderBy: { date: 'desc' },
          take: 10
        },
        caseSupply: {
          orderBy: { date: 'desc' },
          take: 10
        }
      }
    });
    
    if (!caseData) {
      console.log("❌ Case not found");
      return;
    }
    
    console.log(`📦 Case: ${caseData.name}`);
    console.log(`💰 Current Price: $${caseData.price}`);
    console.log(`📊 Market Cap: $${caseData.marketCap}`);
    console.log(`📈 Price Change 24h: ${caseData.priceChange24h}%`);
    console.log(`📈 Price Change 7d: ${caseData.priceChange7d}%`);
    console.log(`📈 Price Change 30d: ${caseData.priceChange30d}%`);
    console.log(`🏷️  Is Discontinued: ${caseData.isDiscontinued}`);
    console.log(`📅 Release Date: ${caseData.releaseDate}`);
    console.log(`📅 Discontinued Date: ${caseData.discontinuedDate}`);
    
    console.log("\n📈 Recent Price History:");
    caseData.casePriceHistory.forEach((entry, index) => {
      console.log(`  ${index + 1}. ${entry.date.toISOString().split('T')[0]}: $${entry.price} (Market Cap: $${entry.marketCap || 'N/A'})`);
    });
    
    console.log("\n📊 Recent Supply History:");
    caseData.caseSupply.forEach((entry, index) => {
      console.log(`  ${index + 1}. ${entry.date.toISOString().split('T')[0]}: Remaining ${entry.remaining}, Dropped ${entry.dropped}, Unboxed ${entry.unboxed}`);
    });
    
    // Check for data inconsistencies
    console.log("\n🔍 Data Analysis:");
    
    if (caseData.casePriceHistory.length > 0) {
      const latestPrice = caseData.casePriceHistory[0].price;
      const currentPrice = caseData.price;
      
      if (Math.abs(latestPrice - currentPrice) > 0.01) {
        console.log(`⚠️  Price mismatch: Current (${currentPrice}) vs Latest History (${latestPrice})`);
      } else {
        console.log(`✅ Price consistent: Current (${currentPrice}) matches Latest History (${latestPrice})`);
      }
    }
    
    if (caseData.caseSupply.length > 0) {
      const latestSupply = caseData.caseSupply[0];
      const currentRemaining = caseData.remaining;
      
      if (latestSupply.remaining !== currentRemaining) {
        console.log(`⚠️  Supply mismatch: Current Remaining (${currentRemaining}) vs Latest History (${latestSupply.remaining})`);
      } else {
        console.log(`✅ Supply consistent: Current Remaining (${currentRemaining}) matches Latest History (${latestSupply.remaining})`);
      }
    }
    
    // Check discontinued logic
    console.log("\n🏷️  Discontinued Logic:");
    if (caseData.isDiscontinued) {
      console.log(`✅ Case is marked as discontinued`);
      if (caseData.discontinuedDate) {
        console.log(`📅 Discontinued on: ${caseData.discontinuedDate}`);
      } else {
        console.log(`⚠️  No discontinued date set`);
      }
    } else {
      console.log(`✅ Case is active (not discontinued)`);
    }
    
  } catch (error) {
    console.error("❌ Error debugging case data:", error);
  } finally {
    await prisma.$disconnect();
  }
}

debugCaseData();
