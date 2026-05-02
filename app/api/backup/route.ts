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

    // Get all data from database
    const [
      users,
      customers,
      categories,
      products,
      warehouses,
      stocks,
      suppliers,
      transactions,
      promotions
    ] = await Promise.all([
      prisma.user.findMany(),
      prisma.customer.findMany(),
      prisma.category.findMany(),
      prisma.product.findMany({ include: { category: true } }),
      prisma.warehouse.findMany(),
      prisma.stock.findMany({ include: { product: true, warehouse: true } }),
      prisma.supplier.findMany(),
      prisma.transaction.findMany({
        include: {
          items: { include: { product: true } },
          customer: true,
          cashier: true,
          payments: true
        }
      }),
      prisma.promotion.findMany()
    ])

    const backup = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      data: {
        users,
        customers,
        categories,
        products,
        warehouses,
        stocks,
        suppliers,
        transactions,
        promotions
      }
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: decoded.userId,
        action: 'BACKUP',
        entity: 'Database',
        entityId: 'full-backup',
        details: `Database backup created at ${backup.timestamp}`
      }
    })

    return NextResponse.json({
      message: 'Backup created successfully',
      backup,
      filename: `pos-backup-${new Date().toISOString().split('T')[0]}.json`
    })
  } catch (error: any) {
    console.error('Backup error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
