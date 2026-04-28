import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_YgLuCh7w8dyS@ep-muddy-tree-ao4oslno-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require'

// Use connection pooling only in development
const pool = new Pool({
  connectionString,
  max: 1, // Limit connections for serverless
})

const adapter = new PrismaPg(pool)

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
