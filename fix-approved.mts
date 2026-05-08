import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const p = new PrismaClient({ adapter })

const result = await p.user.updateMany({
  where: { isApproved: null },
  data: { isApproved: true }
})
console.log('Fixed:', result.count, 'users set to isApproved=true')

const users = await p.user.findMany({ select: { email: true, role: true, isApproved: true, isActive: true } })
console.log(JSON.stringify(users, null, 2))

await p.$disconnect()
await pool.end()
