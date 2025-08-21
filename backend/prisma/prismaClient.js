// {/* Prisma Singleton für alle Jobs & Services */}
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;
const prisma = globalForPrisma.__prisma__ || new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__prisma__ = prisma;
}

export default prisma;
