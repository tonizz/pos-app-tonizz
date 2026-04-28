import "dotenv/config"
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import * as bcrypt from 'bcryptjs'

async function main() {
  const connectionString = process.env.DATABASE_URL
  console.log('Using database URL:', connectionString?.replace(/:[^:@]+@/, ':****@'))

  const pool = new Pool({
    connectionString,
  })

  const adapter = new PrismaPg(pool)

  const prisma = new PrismaClient({
    adapter
  })

  try {
    await prisma.$connect()
    console.log('Connected to database')
  } catch (error) {
    console.error('Failed to connect:', error)
    throw error
  }

  async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10)
  }

  console.log('Seeding database...')

  // Create default admin user
  const adminPassword = await hashPassword('admin123')
  const admin = await prisma.user.upsert({
    where: { email: 'admin@pos.com' },
    update: {
      nrp: 'ADM001',
      phone: '081234567890',
      address: 'Jl. Admin No. 1, Jakarta',
      department: 'Management',
      position: 'System Administrator',
      joinDate: new Date('2024-01-01')
    },
    create: {
      email: 'admin@pos.com',
      name: 'Admin User',
      password: adminPassword,
      role: 'SUPER_ADMIN',
      nrp: 'ADM001',
      phone: '081234567890',
      address: 'Jl. Admin No. 1, Jakarta',
      department: 'Management',
      position: 'System Administrator',
      joinDate: new Date('2024-01-01')
    }
  })
  console.log('✓ Admin user created:', admin.email)

  // Create default cashier
  const cashierPassword = await hashPassword('cashier123')
  const cashier = await prisma.user.upsert({
    where: { email: 'cashier@pos.com' },
    update: {
      nrp: 'CSH001',
      phone: '081234567891',
      address: 'Jl. Cashier No. 2, Jakarta',
      department: 'Operations',
      position: 'Cashier',
      joinDate: new Date('2024-02-01')
    },
    create: {
      email: 'cashier@pos.com',
      name: 'Cashier User',
      password: cashierPassword,
      role: 'CASHIER',
      nrp: 'CSH001',
      phone: '081234567891',
      address: 'Jl. Cashier No. 2, Jakarta',
      department: 'Operations',
      position: 'Cashier',
      joinDate: new Date('2024-02-01')
    }
  })
  console.log('✓ Cashier user created:', cashier.email)

  // Create manager for discount approval
  const managerPassword = await hashPassword('manager123')
  const manager = await prisma.user.upsert({
    where: { email: 'manager@pos.com' },
    update: {
      nrp: 'MGR001',
      phone: '081234567892',
      address: 'Jl. Manager No. 3, Jakarta',
      department: 'Management',
      position: 'Store Manager',
      joinDate: new Date('2024-01-15')
    },
    create: {
      email: 'manager@pos.com',
      name: 'Manager User',
      password: managerPassword,
      role: 'MANAGER',
      nrp: 'MGR001',
      phone: '081234567892',
      address: 'Jl. Manager No. 3, Jakarta',
      department: 'Management',
      position: 'Store Manager',
      joinDate: new Date('2024-01-15')
    }
  })
  console.log('✓ Manager user created:', manager.email)

  // Create sales user for attendance system
  const salesPassword = await hashPassword('sales123')
  const sales = await prisma.user.upsert({
    where: { email: 'sales@pos.com' },
    update: {
      nrp: 'SLS001',
      phone: '081234567893',
      address: 'Jl. Sales No. 4, Jakarta',
      department: 'Sales',
      position: 'Field Sales',
      joinDate: new Date('2024-03-01')
    },
    create: {
      email: 'sales@pos.com',
      name: 'Sales User',
      password: salesPassword,
      role: 'SALES',
      nrp: 'SLS001',
      phone: '081234567893',
      address: 'Jl. Sales No. 4, Jakarta',
      department: 'Sales',
      position: 'Field Sales',
      joinDate: new Date('2024-03-01')
    }
  })
  console.log('✓ Sales user created:', sales.email)

  // Create store
  const store = await prisma.store.upsert({
    where: { id: 'default-store' },
    update: {},
    create: {
      id: 'default-store',
      name: 'My Store',
      address: 'Jl. Contoh No. 123, Jakarta',
      phone: '021-12345678',
      email: 'store@example.com',
      taxRate: 0.11
    }
  })
  console.log('✓ Store created:', store.name)

  // Create main warehouse
  const warehouse = await prisma.warehouse.upsert({
    where: { id: 'main-warehouse' },
    update: {},
    create: {
      id: 'main-warehouse',
      name: 'Main Warehouse',
      address: 'Jl. Gudang No. 1, Jakarta',
      isMain: true
    }
  })
  console.log('✓ Warehouse created:', warehouse.name)

  // Create categories
  const categories = [
    { id: 'cat-food', name: 'Food & Beverages' },
    { id: 'cat-electronics', name: 'Electronics' },
    { id: 'cat-fashion', name: 'Fashion' },
    { id: 'cat-health', name: 'Health & Beauty' },
    { id: 'cat-home', name: 'Home & Living' }
  ]

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { id: cat.id },
      update: {},
      create: cat
    })
  }
  console.log('✓ Categories created:', categories.length)

  // Create sample products (some with auto-discount)
  const products = [
    {
      id: 'prod-1',
      name: 'Coca Cola 330ml',
      sku: 'FOO-COC-001',
      barcode: '8992761111111',
      categoryId: 'cat-food',
      unit: 'pcs',
      buyPrice: 3500,
      sellPrice: 5000,
      wholesalePrice: 4500,
      autoDiscount: 5,
      autoDiscountType: 'percentage'
    },
    {
      id: 'prod-2',
      name: 'Indomie Goreng',
      sku: 'FOO-IND-002',
      barcode: '8992761222222',
      categoryId: 'cat-food',
      unit: 'pcs',
      buyPrice: 2500,
      sellPrice: 3500,
      wholesalePrice: 3000,
      autoDiscount: 500,
      autoDiscountType: 'nominal'
    },
    {
      id: 'prod-3',
      name: 'Samsung Galaxy A54',
      sku: 'ELE-SAM-003',
      barcode: '8992761333333',
      categoryId: 'cat-electronics',
      unit: 'pcs',
      buyPrice: 4500000,
      sellPrice: 5500000,
      wholesalePrice: 5000000,
      autoDiscount: 3,
      autoDiscountType: 'percentage'
    },
    {
      id: 'prod-4',
      name: 'T-Shirt Cotton',
      sku: 'FAS-TSH-004',
      barcode: '8992761444444',
      categoryId: 'cat-fashion',
      unit: 'pcs',
      buyPrice: 50000,
      sellPrice: 85000,
      wholesalePrice: 75000
    },
    {
      id: 'prod-5',
      name: 'Shampoo Clear 170ml',
      sku: 'HEA-SHA-005',
      barcode: '8992761555555',
      categoryId: 'cat-health',
      unit: 'pcs',
      buyPrice: 15000,
      sellPrice: 22000,
      wholesalePrice: 20000,
      autoDiscount: 2000,
      autoDiscountType: 'nominal'
    }
  ]

  for (const prod of products) {
    const product = await prisma.product.upsert({
      where: { id: prod.id },
      update: {},
      create: prod
    })

    // Create initial stock
    const existingStock = await prisma.stock.findFirst({
      where: {
        productId: product.id,
        warehouseId: warehouse.id,
        variantId: null
      }
    })

    if (!existingStock) {
      await prisma.stock.create({
        data: {
          productId: product.id,
          warehouseId: warehouse.id,
          quantity: 100,
          minStock: 10
        }
      })
    }
  }
  console.log('✓ Products created:', products.length)

  // Create sample customers
  const customers = [
    {
      id: 'cust-1',
      name: 'John Doe',
      phone: '081234567890',
      email: 'john@example.com',
      memberTier: 'GOLD',
      points: 500
    },
    {
      id: 'cust-2',
      name: 'Jane Smith',
      phone: '081234567891',
      email: 'jane@example.com',
      memberTier: 'SILVER',
      points: 200
    }
  ]

  for (const cust of customers) {
    await prisma.customer.upsert({
      where: { id: cust.id },
      update: {},
      create: cust
    })
  }
  console.log('✓ Customers created:', customers.length)

  console.log('✅ Database seeded successfully!')

  await prisma.$disconnect()
  await pool.end()
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
