import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function findP90Skins() {
  try {
    const skins = await prisma.skin.findMany({
      where: {
        name: {
          contains: 'P90',
          mode: 'insensitive'
        }
      },
      select: {
        id: true,
        name: true,
        caseSkins: {
          include: {
            case: {
              select: { id: true, name: true }
            }
          }
        }
      }
    });
    
    console.log('🔍 P90 Skins found:');
    skins.forEach(skin => {
      console.log(`ID ${skin.id}: ${skin.name}`);
      console.log(`  Case relationships: ${skin.caseSkins.length}`);
      if (skin.caseSkins.length > 0) {
        skin.caseSkins.forEach(cs => {
          console.log(`    - ${cs.case.name} (ID: ${cs.case.id})`);
        });
      }
      console.log('');
    });
    
    // Specifically check for StatTrak P90 Asiimov
    const statTrakP90 = skins.find(s => s.name.includes('StatTrak') && s.name.includes('Asiimov'));
    if (statTrakP90) {
      console.log('🎯 Found StatTrak P90 Asiimov:');
      console.log(`  ID: ${statTrakP90.id}`);
      console.log(`  Name: ${statTrakP90.name}`);
      console.log(`  In Cases: ${statTrakP90.caseSkins.length}`);
    } else {
      console.log('❌ StatTrak P90 Asiimov not found in database');
    }
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

findP90Skins();
