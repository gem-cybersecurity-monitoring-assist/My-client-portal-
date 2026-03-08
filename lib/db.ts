/**
 * Prisma client singleton — shared across the Next.js server runtime.
 * Prisma 7 requires a driver adapter; we use @prisma/adapter-pg with the
 * pg Pool so a single connection pool is reused across hot-reloads in dev.
 */

import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"
import { Pool } from "pg"

const DB_URL =
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@localhost:5432/client_admin_portal"

const globalForPrisma = globalThis as unknown as {
  pool?: Pool
  prisma?: PrismaClient
}

const pool = globalForPrisma.pool ?? new Pool({ connectionString: DB_URL })
const adapter = new PrismaPg(pool)

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  })

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.pool = pool
  globalForPrisma.prisma = prisma
}
