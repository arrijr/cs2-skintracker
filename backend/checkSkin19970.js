import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkSkin19970() {
  try {
    const skin = await prisma.skin.findUnique({
      where: { id: 19970 },
      include: {
        caseSkins: {
          include: {
            case: {
              select: { id: true, name: true }
            }
          }
        }
      }
    });
    
    console.log('🔍 Skin ID 19970:', skin?.name);
    console.log('📦 Case relationships:', skin?.caseSkins?.length || 0);
    
    if (skin?.caseSkins?.length > 0) {
      console.log('✅ This skin IS in cases:');
      skin.caseSkins.forEach(cs => {
        console.log(`  - Case: ${cs.case.name} (ID: ${cs.case.id})`);
      });
    } else {
      console.log('❌ This skin is NOT in any cases');
    }
    
    // Also check a few other skins
    console.log('\n🔍 Checking other skins...');
    const otherSkins = [3762, 9871, 20428];
    
    for (const skinId of otherSkins) {
      const otherSkin = await prisma.skin.findUnique({
        where: { id: skinId },
        include: {
          caseSkins: {
            include: {
              case: {
                select: { id: true, name: true }
              }
            }
          }
        }
      });
      
      console.log(`\nSkin ID ${skinId}: ${otherSkin?.name}`);
      console.log(`Case relationships: ${otherSkin?.caseSkins?.length || 0}`);
      
      if (otherSkin?.caseSkins?.length > 0) {
        otherSkin.caseSkins.forEach(cs => {
          console.log(`  - Case: ${cs.case.name} (ID: ${cs.case.id})`);
        });
      }
    }
    
  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

checkSkin19970();
