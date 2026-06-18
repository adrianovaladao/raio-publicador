import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const g = globalThis as any;

export function getPrisma(): PrismaClient {
  if (!g._prisma) {
    const adapter = new PrismaPg(process.env.DATABASE_URL!);
    g._prisma = new PrismaClient({ adapter });
  }
  return g._prisma;
}
