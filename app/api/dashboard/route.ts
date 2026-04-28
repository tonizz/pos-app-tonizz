import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'today'

    const now = new Date()
    let startDate = new Date()

    switch (period) {
      case 'today':
        startDate.setHours(0, 0, 0, 0)
        break
      case 'week':
        startDate.setDate(now.getDate() - 7)
        break
      case 'month':
        startDate.setMonth(now.getMonth() - 1)
        break
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1)
        break
    }

    const [
      totalRevenue,
      totalTransactions,
      totalProducts,
      lowStockProducts,
      recentTransactions,
      topProducts
    ] = await Promise.all([
      prisma.transaction.aggregate({
        where: {
          createdAt: { gte: startDate },
          status: 'COMPLETED'
        },
        _sum: { total: true }
      }),
      prisma.transaction.count({
        where: {
          createdAt: { gte: startDate },
          status: 'COMPLETED'
        }
      }),
      prisma.product.count({
        where: { isActive: true }
      }),
      prisma.$queryRaw`
        SELECT COUNT(*) as count
        FROM Stock
        WHERE quantity <= minStock
      `.then((result: any) => Number(result[0]?.count || 0)),
      prisma.transaction.findMany({
        where: {
          createdAt: { gte: startDate }
        },
        include: {
          customer: true,
          cashier: {
            select: { name: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      }),
      prisma.transactionItem.groupBy({
        by: ['productId'],
        where: {
          transaction: {
            createdAt: { gte: startDate },
            status: 'COMPLETED'
          }
        },
        _sum: {
          quantity: true,
          subtotal: true
        },
        orderBy: {
          _sum: {
            quantity: 'desc'
          }
        },
        take: 5
      })
    ])

    const topProductsWithDetails = await Promise.all(
      topProducts.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          include: { category: true }
        })
        return {
          product,
          totalQuantity: item._sum.quantity,
          totalRevenue: item._sum.subtotal
        }
      })
    )

    const salesByDay = await prisma.$queryRaw`
      SELECT
        DATE(createdAt) as date,
        SUM(total) as revenue,
        COUNT(*) as transactions
      FROM "Transaction"
      WHERE createdAt >= ${startDate}
        AND status = 'COMPLETED'
      GROUP BY DATE(createdAt)
      ORDER BY date ASC
    `

    return NextResponse.json({
      summary: {
        totalRevenue: totalRevenue._sum.total || 0,
        totalTransactions,
        totalProducts,
        lowStockProducts
      },
      recentTransactions,
      topProducts: topProductsWithDetails,
      salesByDay
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
