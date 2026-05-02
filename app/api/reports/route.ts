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
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const warehouseId = searchParams.get('warehouseId')

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Start date and end date are required' },
        { status: 400 }
      )
    }

    const where: any = {
      createdAt: {
        gte: new Date(startDate),
        lte: new Date(endDate)
      },
      status: 'COMPLETED'
    }

    if (warehouseId) {
      where.warehouseId = warehouseId
    }

    // Get all transactions in date range
    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        items: {
          include: {
            product: {
              include: {
                category: true
              }
            }
          }
        },
        cashier: true
      },
      orderBy: { createdAt: 'asc' }
    })

    // Calculate daily sales
    const dailySales: { [key: string]: { date: string; revenue: number; transactions: number } } = {}

    transactions.forEach(t => {
      const date = new Date(t.createdAt).toISOString().split('T')[0]
      if (!dailySales[date]) {
        dailySales[date] = { date, revenue: 0, transactions: 0 }
      }
      dailySales[date].revenue += t.total
      dailySales[date].transactions += 1
    })

    // Calculate top products
    const productSales: { [key: string]: { productId: string; name: string; quantity: number; revenue: number } } = {}

    transactions.forEach(t => {
      t.items.forEach(item => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = {
            productId: item.productId,
            name: item.product.name,
            quantity: 0,
            revenue: 0
          }
        }
        productSales[item.productId].quantity += item.quantity
        productSales[item.productId].revenue += item.subtotal
      })
    })

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    // Calculate summary
    const totalRevenue = transactions.reduce((sum, t) => sum + t.total, 0)
    const totalTransactions = transactions.length
    const totalDiscount = transactions.reduce((sum, t) => sum + t.discount, 0)
    const totalTax = transactions.reduce((sum, t) => sum + t.tax, 0)
    const totalProfit = transactions.reduce((sum, t) => {
      const itemsCost = t.items.reduce((itemSum, item) => {
        return itemSum + (item.product.buyPrice * item.quantity)
      }, 0)
      return sum + (t.total - itemsCost)
    }, 0)

    // Payment method breakdown
    const paymentMethods: { [key: string]: number } = {}
    transactions.forEach(t => {
      if (!paymentMethods[t.paymentMethod]) {
        paymentMethods[t.paymentMethod] = 0
      }
      paymentMethods[t.paymentMethod] += t.total
    })

    // Category performance
    const categoryPerformance: { [key: string]: { categoryId: string; name: string; revenue: number; quantity: number } } = {}
    transactions.forEach(t => {
      t.items.forEach(item => {
        if (item.product.categoryId) {
          if (!categoryPerformance[item.product.categoryId]) {
            categoryPerformance[item.product.categoryId] = {
              categoryId: item.product.categoryId,
              name: item.product.category?.name || 'Uncategorized',
              revenue: 0,
              quantity: 0
            }
          }
          categoryPerformance[item.product.categoryId].revenue += item.subtotal
          categoryPerformance[item.product.categoryId].quantity += item.quantity
        }
      })
    })

    // Cashier performance
    const cashierPerformance: { [key: string]: { cashierId: string; name: string; transactions: number; revenue: number } } = {}
    transactions.forEach(t => {
      if (!cashierPerformance[t.cashierId]) {
        cashierPerformance[t.cashierId] = {
          cashierId: t.cashierId,
          name: t.cashier?.name || 'Unknown',
          transactions: 0,
          revenue: 0
        }
      }
      cashierPerformance[t.cashierId].transactions += 1
      cashierPerformance[t.cashierId].revenue += t.total
    })

    return NextResponse.json({
      summary: {
        totalRevenue,
        totalTransactions,
        totalDiscount,
        totalTax,
        totalProfit,
        averageTransaction: totalTransactions > 0 ? totalRevenue / totalTransactions : 0
      },
      dailySales: Object.values(dailySales),
      topProducts,
      paymentMethods: Object.entries(paymentMethods).map(([method, amount]) => ({
        method,
        amount
      })),
      categoryPerformance: Object.values(categoryPerformance)
        .sort((a, b) => b.revenue - a.revenue),
      cashierPerformance: Object.values(cashierPerformance)
        .sort((a, b) => b.revenue - a.revenue)
    })
  } catch (error) {
    console.error('Get reports error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
