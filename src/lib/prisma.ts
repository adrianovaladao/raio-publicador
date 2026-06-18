import { PrismaClient } from "@prisma/client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const g = globalThis as any;

export function getPrisma(): PrismaClient {
  if (!g._prisma) {
    g._prisma = new PrismaClient({
      datasourceUrl: process.env.DATABASE_URL,
    });
  }
  return g._prisma;
}
