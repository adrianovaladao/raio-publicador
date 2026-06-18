import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const g = globalThis as any;

export function getPrisma(): PrismaClient {
  if (!g._prisma) {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    g._prisma = new PrismaClient({ adapter });
  }
  return g._prisma;
}
