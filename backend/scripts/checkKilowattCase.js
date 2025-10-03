// /backend/scripts/checkKilowattCase.js — [Backend]
// {/* Check kilowatt case data and update with real price */}
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkKilowattCase() {
  console.log("🔍 Checking kilowatt case data...");
  
  try {
    const kilowattCase = await prisma.case.findFirst({
      where: { 
        name: { 
          contains: 'kilowatt', 
          mode: 'insensitive' 
        } 
      }
    });
    
    if (kilowattCase) {
      console.log("📦 Found kilowatt case:");
      console.log("- Name:", kilowattCase.name);
      console.log("- Current price:", kilowattCase.price);
      console.log("- Image URL:", kilowattCase.imageUrl);
      console.log("- Is discontinued:", kilowattCase.isDiscontinued);
      
      // Update with real price (0.41€ = ~$0.45)
      await prisma.case.update({
        where: { id: kilowattCase.id },
        data: {
          price: 0.45, // $0.45 USD
          imageUrl: "https://community.akamai.steamstatic.com/economy/image/kilowatt%20case/",
          lastUpdated: new Date()
        }
      });
      
      console.log("✅ Updated kilowatt case with real price: $0.45");
    } else {
      console.log("❌ Kilowatt case not found");
    }
    
  } catch (error) {
    console.error("❌ Error checking kilowatt case:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkKilowattCase();
