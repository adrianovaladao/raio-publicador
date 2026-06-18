import { PrismaClient } from "@prisma/client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const g = globalThis as any;

export function getPrisma(): PrismaClient {
  if (!g._prisma) {
    g._prisma = new PrismaClient();
  }
  return g._prisma;
}
