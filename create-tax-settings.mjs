import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function createTaxSettings() {
  console.log('Creating tax settings...')

  // Check if tax settings already exist
  const existing = await prisma.taxSetting.findFirst()

  if (existing) {
    console.log('Tax settings already exist. Updating to active...')
    await prisma.taxSetting.updateMany({
      data: { isActive: true }
    })
    console.log('✅ Tax settings activated!')
  } else {
    console.log('Creating new tax settings...')

    // Create PPN 11%
    await prisma.taxSetting.create({
      data: {
        name: 'PPN',
        rate: 11,
        type: 'INCLUSIVE',
        isActive: true
      }
    })

    console.log('✅ Tax settings created!')
  }

  // Show active tax
  const activeTax = await prisma.taxSetting.findFirst({
    where: { isActive: true }
  })

  console.log('\n=== Active Tax Settings ===')
  console.log('Name:', activeTax?.name)
  console.log('Rate:', activeTax?.rate + '%')
  console.log('Type:', activeTax?.type)
  console.log('Active:', activeTax?.isActive)

  await prisma.$disconnect()
}

createTaxSettings().catch(console.error)
