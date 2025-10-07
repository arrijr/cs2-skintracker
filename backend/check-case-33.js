import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkCase() {
  try {
    // Check if case 33 exists
    const case33 = await prisma.case.findUnique({
      where: { id: 33 },
      select: { id: true, name: true }
    });
    
    console.log('Case 33:', case33);
    
    // Check total cases
    const totalCases = await prisma.case.count();
    console.log('Total cases:', totalCases);
    
    // Check first few cases
    const firstCases = await prisma.case.findMany({
      take: 5,
      select: { id: true, name: true }
    });
    console.log('First 5 cases:', firstCases);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCase();
