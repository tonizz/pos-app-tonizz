import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

// Get customer purchase patterns and behavior analysis
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
    const days = parseInt(searchParams.get('days') || '30')

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Get customer transactions
    const customers = await prisma.customer.findMany({
      include: {
        transactions: {
          where: {
            createdAt: {
              gte: startDate
            },
            status: 'COMPLETED'
          },
          include: {
            items: {
              include: {
                product: true
              }
            }
          }
        }
      }
    })

    // Analyze customer segments
    const customerAnalysis = customers
      .filter(c => c.transactions.length > 0)
      .map(customer => {
        const transactions = customer.transactions
        const totalSpent = transactions.reduce((sum, t) => sum + t.total, 0)
        const avgOrderValue = totalSpent / transactions.length
        const totalItems = transactions.reduce((sum, t) =>
          sum + t.items.reduce((itemSum, item) => itemSum + item.quantity, 0)
        , 0)

        // Calculate days between purchases
        const sortedDates = transactions
          .map(t => t.createdAt.getTime())
          .sort((a, b) => a - b)

        const daysBetweenPurchases = []
        for (let i = 1; i < sortedDates.length; i++) {
          const daysDiff = (sortedDates[i] - sortedDates[i - 1]) / (1000 * 60 * 60 * 24)
          daysBetweenPurchases.push(daysDiff)
        }

        const avgDaysBetweenPurchases = daysBetweenPurchases.length > 0
          ? daysBetweenPurchases.reduce((sum, days) => sum + days, 0) / daysBetweenPurchases.length
          : null

        // Get favorite products
        const productCounts: { [key: string]: { name: string; count: number } } = {}
        transactions.forEach(t => {
          t.items.forEach(item => {
            if (!productCounts[item.productId]) {
              productCounts[item.productId] = {
                name: item.product.name,
                count: 0
              }
            }
            productCounts[item.productId].count += item.quantity
          })
        })

        const favoriteProducts = Object.entries(productCounts)
          .map(([id, data]) => ({ productId: id, ...data }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 3)

        return {
          customerId: customer.id,
          name: customer.name,
          memberTier: customer.memberTier,
          totalTransactions: transactions.length,
          totalSpent,
          avgOrderValue,
          totalItems,
          avgDaysBetweenPurchases,
          favoriteProducts,
          lastPurchase: transactions[transactions.length - 1]?.createdAt
        }
      })

    // Segment customers
    const segments = {
      vip: customerAnalysis.filter(c => c.totalSpent > 10000000), // > 10M
      regular: customerAnalysis.filter(c => c.totalSpent >= 1000000 && c.totalSpent <= 10000000), // 1M - 10M
      occasional: customerAnalysis.filter(c => c.totalSpent < 1000000), // < 1M
    }

    // Calculate RFM (Recency, Frequency, Monetary)
    const now = new Date().getTime()
    const rfmAnalysis = customerAnalysis.map(customer => {
      const recency = customer.lastPurchase
        ? Math.floor((now - customer.lastPurchase.getTime()) / (1000 * 60 * 60 * 24))
        : 999

      const frequency = customer.totalTransactions
      const monetary = customer.totalSpent

      // Simple scoring (1-5)
      const recencyScore = recency <= 7 ? 5 : recency <= 30 ? 4 : recency <= 60 ? 3 : recency <= 90 ? 2 : 1
      const frequencyScore = frequency >= 10 ? 5 : frequency >= 5 ? 4 : frequency >= 3 ? 3 : frequency >= 2 ? 2 : 1
      const monetaryScore = monetary >= 5000000 ? 5 : monetary >= 2000000 ? 4 : monetary >= 1000000 ? 3 : monetary >= 500000 ? 2 : 1

      const rfmScore = recencyScore + frequencyScore + monetaryScore

      let segment = 'At Risk'
      if (rfmScore >= 13) segment = 'Champions'
      else if (rfmScore >= 10) segment = 'Loyal'
      else if (rfmScore >= 7) segment = 'Potential'

      return {
        customerId: customer.customerId,
        name: customer.name,
        recency,
        frequency,
        monetary,
        rfmScore,
        segment
      }
    })

    // Top customers
    const topCustomers = customerAnalysis
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10)

    return NextResponse.json({
      summary: {
        totalCustomers: customerAnalysis.length,
        vipCustomers: segments.vip.length,
        regularCustomers: segments.regular.length,
        occasionalCustomers: segments.occasional.length,
        avgOrderValue: customerAnalysis.reduce((sum, c) => sum + c.avgOrderValue, 0) / customerAnalysis.length || 0,
        avgTransactionsPerCustomer: customerAnalysis.reduce((sum, c) => sum + c.totalTransactions, 0) / customerAnalysis.length || 0
      },
      topCustomers,
      rfmAnalysis: rfmAnalysis.slice(0, 20),
      segments: {
        champions: rfmAnalysis.filter(c => c.segment === 'Champions').length,
        loyal: rfmAnalysis.filter(c => c.segment === 'Loyal').length,
        potential: rfmAnalysis.filter(c => c.segment === 'Potential').length,
        atRisk: rfmAnalysis.filter(c => c.segment === 'At Risk').length
      }
    })
  } catch (error: any) {
    console.error('Customer patterns error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
