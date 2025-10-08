// Check if case ID 33 exists in database
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function checkCase() {
  try {
    console.log('Checking for case ID 33...');
    
    const caseData = await prisma.case.findUnique({
      where: { id: 33 },
      include: {
        caseSkins: {
          take: 5
        },
        caseSupply: {
          take: 1,
          orderBy: { date: 'desc' }
        }
      }
    });
    
    if (caseData) {
      console.log('✅ Case found:', {
        id: caseData.id,
        name: caseData.name,
        price: caseData.price,
        skinCount: caseData.caseSkins?.length || 0,
        hasSupplyData: !!caseData.caseSupply?.length
      });
    } else {
      console.log('❌ Case ID 33 not found in database');
      
      // Check what cases exist
      const allCases = await prisma.case.findMany({
        select: { id: true, name: true },
        take: 10
      });
      
      console.log('\nFirst 10 cases in database:');
      allCases.forEach(c => console.log(`  - ID ${c.id}: ${c.name}`));
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCase();
