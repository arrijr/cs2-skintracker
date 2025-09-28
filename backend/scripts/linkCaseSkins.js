// /backend/scripts/linkCaseSkins.js — [Backend]
// {/* Link real skins to cases based on collection patterns */}
import { PrismaClient } from '@prisma/client';
import "dotenv/config";

const prisma = new PrismaClient();

// Collection to Case mapping based on real CS2 data
const collectionToCaseMapping = {
  'Operation Bravo': 'Operation Bravo Case',
  'CS:GO Weapon Case': 'CS:GO Weapon Case',
  'eSports 2013': 'eSports 2013 Case',
  'Winter Offensive': 'Winter Offensive Weapon Case',
  'Falchion': 'Falchion Case',
  'Shadow': 'Shadow Case',
  'Snakebite': 'Snakebite Case',
  'Fracture': 'Fracture Case',
  'Prisma': 'Prisma Case',
  'Shattered Web': 'Shattered Web Case'
};

// Rarity drop chances (approximate)
const rarityDropChances = {
  'Consumer': 79.92,
  'Industrial': 15.98,
  'Mil-Spec': 3.20,
  'Restricted': 0.64,
  'Classified': 0.26,
  'Covert': 0.026,
  'Exceedingly Rare': 0.026
};

async function linkCaseSkins() {
  try {
    console.log('🔗 Linking skins to cases...');

    // Get all cases
    const cases = await prisma.case.findMany();
    console.log(`Found ${cases.length} cases`);

    // Get all skins
    const skins = await prisma.skin.findMany({
      where: {
        collection: {
          not: null
        }
      }
    });
    console.log(`Found ${skins.length} skins with collections`);

    let linkedCount = 0;

    for (const caseItem of cases) {
      console.log(`\nProcessing case: ${caseItem.name}`);
      
      // Find matching skins by collection
      const matchingSkins = skins.filter(skin => {
        if (!skin.collection) return false;
        
        // Check if case name contains collection name or vice versa
        const caseNameLower = caseItem.name.toLowerCase();
        const collectionLower = skin.collection.toLowerCase();
        
        return caseNameLower.includes(collectionLower) || 
               collectionLower.includes(caseNameLower) ||
               collectionToCaseMapping[skin.collection] === caseItem.name;
      });

      console.log(`Found ${matchingSkins.length} matching skins`);

      // Link skins to case
      for (const skin of matchingSkins) {
        try {
          // Check if relationship already exists
          const existingLink = await prisma.caseSkin.findUnique({
            where: {
              caseId_skinId: {
                caseId: caseItem.id,
                skinId: skin.id
              }
            }
          });

          if (!existingLink) {
            await prisma.caseSkin.create({
              data: {
                caseId: caseItem.id,
                skinId: skin.id,
                rarity: skin.rarity || 'Consumer',
                dropChance: rarityDropChances[skin.rarity] || 79.92,
                isSpecial: skin.rarity === 'Exceedingly Rare' || skin.itemType?.includes('knife')
              }
            });
            linkedCount++;
          }
        } catch (error) {
          console.error(`Error linking skin ${skin.name} to case ${caseItem.name}:`, error.message);
        }
      }
    }

    console.log(`\n✅ Successfully linked ${linkedCount} skin-case relationships`);

    // Update case statistics
    for (const caseItem of cases) {
      const skinCount = await prisma.caseSkin.count({
        where: { caseId: caseItem.id }
      });
      
      console.log(`${caseItem.name}: ${skinCount} skins`);
    }

  } catch (error) {
    console.error('❌ Error linking case skins:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  linkCaseSkins();
}

export default linkCaseSkins;
