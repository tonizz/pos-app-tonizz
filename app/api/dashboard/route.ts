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
      // Count low stock products
      prisma.stock.findMany({
        where: {
          quantity: { lte: 10 } // Simple threshold for low stock
        }
      }).then(stocks => stocks.length).catch(() => 0),
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

    // Get sales by day using Prisma groupBy
    const transactions = await prisma.transaction.findMany({
      where: {
        createdAt: { gte: startDate },
        status: 'COMPLETED'
      },
      select: {
        createdAt: true,
        total: true
      }
    })

    // Group by day manually
    const salesByDayMap = new Map()
    transactions.forEach(t => {
      const date = t.createdAt.toISOString().split('T')[0]
      if (!salesByDayMap.has(date)) {
        salesByDayMap.set(date, { date, revenue: 0, transactions: 0 })
      }
      const day = salesByDayMap.get(date)
      day.revenue += t.total
      day.transactions += 1
    })
    const salesByDay = Array.from(salesByDayMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    )

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
