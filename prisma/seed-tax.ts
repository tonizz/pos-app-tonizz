import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const connectionString = process.env.DATABASE_URL

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Seeding default tax setting...')

  // Check if tax setting already exists
  const existingTax = await prisma.taxSetting.findFirst()

  if (!existingTax) {
    await prisma.taxSetting.create({
      data: {
        name: 'PPN',
        rate: 11,
        type: 'INCLUSIVE',
        isActive: true,
        applyToAll: true,
        description: 'Pajak Pertambahan Nilai 11% (included in price)'
      }
    })
    console.log('✅ Default tax setting created: PPN 11% (Inclusive)')
  } else {
    console.log('ℹ️  Tax setting already exists, skipping...')
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
