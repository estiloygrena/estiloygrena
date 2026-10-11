import { PrismaClient } from "@prisma/client";
import "server-only";
import { requiredServerEnv } from "@/lib/env";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db = globalForPrisma.prisma ?? new PrismaClient({ ...(process.env.DATABASE_URL ? { datasourceUrl: requiredServerEnv("DATABASE_URL") } : {}), log: [] });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
