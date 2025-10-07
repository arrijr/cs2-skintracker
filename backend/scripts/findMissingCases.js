import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const cases = await prisma.case.findMany({ include: { caseSkins: true } });
const without = cases.filter(c => c.caseSkins.length === 0);

console.log(`\n📊 Cases WITHOUT skins (${without.length}):`);
without.forEach(c => console.log(`  - ${c.name}`));

console.log(`\n✅ Cases WITH skins: ${cases.length - without.length}/42`);
await prisma.$disconnect();

