import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function countSkins() {
  try {
    const total = await prisma.skin.count();
    console.log('Total skins:', total);
    
    const containers = await prisma.skin.count({
      where: { weaponType: 'container' }
    });
    console.log('Container skins:', containers);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

countSkins();
