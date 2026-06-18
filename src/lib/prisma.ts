import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const g = globalThis as any;

export function getPrisma() {
  if (!g._prisma) {
    g._prisma = new PrismaClient({
      datasourceUrl: process.env.DATABASE_URL,
    }).$extends(withAccelerate());
  }
  return g._prisma;
}
