import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const cases = await prisma.case.findMany({ orderBy: { name: 'asc' } });
cases.forEach(c => console.log(c.name));
await prisma.$disconnect();

