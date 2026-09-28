import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { serverEnv } from "@/config/env";

function createPrismaClient() {
  if (!serverEnv.DATABASE_URL) {
    throw new Error("DATABASE_URL tanımlı değil; veritabanı istemcisi başlatılamaz.");
  }
  const adapter = new PrismaPg(serverEnv.DATABASE_URL);
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as {
  prisma?: ReturnType<typeof createPrismaClient>;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
