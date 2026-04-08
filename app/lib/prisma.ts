import { PrismaClient } from "../../src/generated/prisma"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  // pg@8 parses the connectionString LAST and overwrites any explicit `ssl` config.
  // `sslmode=require` is now treated as `verify-full` (rejectUnauthorized: true),
  // so we strip it from the URL before passing it in. Our explicit ssl config then
  // survives the Object.assign merge and disables cert-chain verification, which is
  // required for Supabase's self-signed certificate chain on local dev.
  const url = new URL(process.env.DATABASE_URL!)
  url.searchParams.delete('sslmode')

  const pool = new Pool({
    connectionString: url.toString(),
    ssl: { rejectUnauthorized: false },
  })
  const adapter = new PrismaPg(pool)
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}