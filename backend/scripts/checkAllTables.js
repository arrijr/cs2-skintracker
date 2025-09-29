// /backend/scripts/checkAllTables.js (Backend)
// {/* Check all tables in the database */}

import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkAllTables() {
  try {
    console.log("🔍 Checking all tables in database...");
    
    // Check all tables mentioned in schema
    const tables = [
      'User', 'Skin', 'Portfolio', 'Watchlist', 'PriceHistory', 
      'Transaction', 'Case', 'CaseSkin', 'CaseSupply', 'CasePriceHistory',
      'JobRun', 'AuditLog'
    ];
    
    for (const table of tables) {
      try {
        const count = await prisma[table.toLowerCase()].count();
        console.log(`📊 ${table}: ${count} records`);
        
        if (count > 0 && count < 10) {
          const sample = await prisma[table.toLowerCase()].findMany({
            take: 3,
            select: { id: true }
          });
          console.log(`   Sample IDs: ${sample.map(s => s.id).join(', ')}`);
        }
      } catch (error) {
        console.log(`❌ ${table}: Error - ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error("❌ Database error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllTables();
