const { PrismaClient } = require('@prisma/client')
const { PrismaLibSql } = require('@prisma/adapter-libsql')
const fs = require('fs')
const path = require('path')

const dbPath = path.join(__dirname, 'prisma', 'dev.db')
const dbUrl = `file:${dbPath}`

const adapter = new PrismaLibSql({
  url: dbUrl
})

const prisma = new PrismaClient({
  adapter
})

async function exportData() {
  try {
    console.log('Exporting data from database...')

    const users = await prisma.user.findMany()
    const attendances = await prisma.attendance.findMany()
    const locations = await prisma.location.findMany()
    const products = await prisma.product.findMany()
    const customers = await prisma.customer.findMany()
    const categories = await prisma.category.findMany()
    const stores = await prisma.store.findMany()
    const warehouses = await prisma.warehouse.findMany()

    const exportData = {
      exportDate: new Date().toISOString(),
      users,
      attendances,
      locations,
      products,
      customers,
      categories,
      stores,
      warehouses
    }

    const backupDir = path.join(__dirname, 'backup', 'backup-20260428-202649')
    const exportPath = path.join(backupDir, 'data-export.json')

    fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2))

    console.log('✅ Data exported successfully to:', exportPath)
    console.log('📊 Export summary:')
    console.log(`   - Users: ${users.length}`)
    console.log(`   - Attendances: ${attendances.length}`)
    console.log(`   - Locations: ${locations.length}`)
    console.log(`   - Products: ${products.length}`)
    console.log(`   - Customers: ${customers.length}`)
    console.log(`   - Categories: ${categories.length}`)
    console.log(`   - Stores: ${stores.length}`)
    console.log(`   - Warehouses: ${warehouses.length}`)

  } catch (error) {
    console.error('Error exporting data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

exportData()
