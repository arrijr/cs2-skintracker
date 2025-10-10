// /backend/scripts/verifyTodayData.js — [Backend]
// {/* Verify today's data for all cases */}
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function verifyTodayData() {
  try {
    const today = new Date().toISOString().split('T')[0];
    console.log(`🔍 Verifying data for today: ${today}\n`);
    
    const count = await prisma.caseSupply.count({
      where: { date: new Date(today) }
    });
    
    console.log(`📊 Cases with today's data: ${count}/42`);
    
    if (count > 0) {
      const sample = await prisma.caseSupply.findFirst({
        where: { date: new Date(today) },
        include: { case: { select: { name: true } } }
      });
      
      console.log(`\n📋 Sample case: ${sample.case.name}`);
      console.log(`💰 Price: $${sample.price?.toFixed(2)}`);
      console.log(`📦 Offer Volume: ${sample.offerVolume?.toLocaleString()}`);
      
      if (sample.soldData) {
        try {
          const soldData = JSON.parse(sample.soldData);
          console.log(`📈 Sales Today: ${soldData.sold24h}`);
          console.log(`📈 Sales 7d: ${soldData.sold7d}`);
          console.log(`📈 Sales 30d: ${soldData.sold30d}`);
        } catch (e) {
          console.log(`❌ Error parsing sold data: ${e.message}`);
        }
      }
      
      // Show first 5 cases
      console.log(`\n🎯 First 5 cases with today's data:`);
      const first5 = await prisma.caseSupply.findMany({
        where: { date: new Date(today) },
        take: 5,
        include: { case: { select: { name: true } } }
      });
      
      first5.forEach(supply => {
        console.log(`  ${supply.case.name}: $${supply.price?.toFixed(2)} | ${supply.offerVolume?.toLocaleString()} offers`);
      });
    }
    
  } catch (error) {
    console.error("❌ Error verifying data:", error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyTodayData();
