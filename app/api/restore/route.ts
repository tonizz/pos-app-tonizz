import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { backup } = body

    if (!backup || !backup.data) {
      return NextResponse.json(
        { error: 'Invalid backup data' },
        { status: 400 }
      )
    }

    // Validate backup version
    if (backup.version !== '1.0') {
      return NextResponse.json(
        { error: 'Unsupported backup version' },
        { status: 400 }
      )
    }

    // Start transaction to restore data
    await prisma.$transaction(async (tx) => {
      // Clear existing data (be careful!)
      // Note: This will delete all data. In production, you might want to be more selective

      // Restore users (skip if exists to avoid conflicts)
      if (backup.data.users && backup.data.users.length > 0) {
        for (const user of backup.data.users) {
          await tx.user.upsert({
            where: { id: user.id },
            update: user,
            create: user
          })
        }
      }

      // Restore customers
      if (backup.data.customers && backup.data.customers.length > 0) {
        for (const customer of backup.data.customers) {
          await tx.customer.upsert({
            where: { id: customer.id },
            update: customer,
            create: customer
          })
        }
      }

      // Restore categories
      if (backup.data.categories && backup.data.categories.length > 0) {
        for (const category of backup.data.categories) {
          await tx.category.upsert({
            where: { id: category.id },
            update: category,
            create: category
          })
        }
      }

      // Restore warehouses
      if (backup.data.warehouses && backup.data.warehouses.length > 0) {
        for (const warehouse of backup.data.warehouses) {
          await tx.warehouse.upsert({
            where: { id: warehouse.id },
            update: warehouse,
            create: warehouse
          })
        }
      }

      // Restore products
      if (backup.data.products && backup.data.products.length > 0) {
        for (const product of backup.data.products) {
          const { category, stocks, ...productData } = product
          await tx.product.upsert({
            where: { id: product.id },
            update: productData,
            create: productData
          })
        }
      }

      // Restore stocks
      if (backup.data.stocks && backup.data.stocks.length > 0) {
        for (const stock of backup.data.stocks) {
          const { product, warehouse, ...stockData } = stock
          await tx.stock.upsert({
            where: { id: stock.id },
            update: stockData,
            create: stockData
          })
        }
      }

      // Restore suppliers
      if (backup.data.suppliers && backup.data.suppliers.length > 0) {
        for (const supplier of backup.data.suppliers) {
          await tx.supplier.upsert({
            where: { id: supplier.id },
            update: supplier,
            create: supplier
          })
        }
      }

      // Restore employees
      if (backup.data.employees && backup.data.employees.length > 0) {
        for (const employee of backup.data.employees) {
          await tx.employee.upsert({
            where: { id: employee.id },
            update: employee,
            create: employee
          })
        }
      }

      // Restore promotions
      if (backup.data.promotions && backup.data.promotions.length > 0) {
        for (const promotion of backup.data.promotions) {
          await tx.promotion.upsert({
            where: { id: promotion.id },
            update: promotion,
            create: promotion
          })
        }
      }

      // Note: Transactions are complex with relations, might need special handling
      // For now, we skip restoring transactions to avoid conflicts
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: decoded.userId,
        action: 'RESTORE',
        entity: 'Database',
        entityId: 'full-restore',
        details: `Database restored from backup dated ${backup.timestamp}`
      }
    })

    return NextResponse.json({
      message: 'Database restored successfully',
      restoredAt: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('Restore error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
