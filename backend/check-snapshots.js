import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSnapshots() {
  try {
    // Check total count
    const count = await prisma.marketSnapshot.count();
    console.log('Total snapshots:', count);
    
    // Check recent snapshots
    const recent = await prisma.marketSnapshot.findMany({
      take: 5,
      orderBy: { date: 'desc' },
      include: {
        skin: {
          select: { id: true, name: true }
        }
      }
    });
    
    console.log('Recent snapshots:');
    recent.forEach(snapshot => {
      console.log(`- ${snapshot.skin.name}: ${snapshot.activeListings} listings on ${snapshot.date.toISOString().split('T')[0]}`);
    });
    
    // Check specific skin
    const skin1Snapshots = await prisma.marketSnapshot.findMany({
      where: { skinId: 1 },
      orderBy: { date: 'desc' }
    });
    
    console.log(`\nSkin ID 1 snapshots: ${skin1Snapshots.length}`);
    skin1Snapshots.forEach(snapshot => {
      console.log(`- ${snapshot.date.toISOString().split('T')[0]}: ${snapshot.activeListings} listings`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSnapshots();
