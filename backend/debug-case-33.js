import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function debugCase33() {
  try {
    console.log('=== DEBUGGING CASE 33 ===');
    
    // 1. Check if case exists
    const caseData = await prisma.case.findUnique({
      where: { id: 33 },
      include: {
        caseSkins: {
          include: {
            skin: {
              select: {
                name: true,
                offerVolume: true,
                sold7d: true,
                priceLatest: true
              }
            }
          }
        }
      }
    });
    
    console.log('Case 33 found:', !!caseData);
    if (caseData) {
      console.log('Case name:', caseData.name);
      console.log('CaseSkins count:', caseData.caseSkins?.length || 0);
    }
    
    // 2. Check if case exists as skin
    const caseAsSkin = await prisma.skin.findFirst({
      where: {
        name: caseData?.name,
        weaponType: 'case'
      },
      select: {
        name: true,
        weaponType: true,
        offerVolume: true,
        sold7d: true
      }
    });
    
    console.log('Case as skin found:', !!caseAsSkin);
    if (caseAsSkin) {
      console.log('Skin name:', caseAsSkin.name);
      console.log('WeaponType:', caseAsSkin.weaponType);
    }
    
  } catch (error) {
    console.error('ERROR:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

debugCase33();
