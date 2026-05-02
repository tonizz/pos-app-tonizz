import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

// Get profit margin analysis by product and category
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

    // Get transaction items with product details
    const transactionItems = await prisma.transactionItem.findMany({
      where: {
        transaction: {
          createdAt: {
            gte: startDate
          },
          status: 'COMPLETED'
        }
      },
      include: {
        product: {
          include: {
            category: true
          }
        },
        transaction: true
      }
    })

    // Analyze by product
    const productAnalysis: {
      [key: string]: {
        productId: string
        name: string
        category: string
        quantitySold: number
        revenue: number
        cost: number
        profit: number
        profitMargin: number
      }
    } = {}

    transactionItems.forEach(item => {
      const productId = item.productId
      const revenue = item.subtotal
      const cost = item.product.costPrice * item.quantity
      const profit = revenue - cost

      if (!productAnalysis[productId]) {
        productAnalysis[productId] = {
          productId,
          name: item.product.name,
          category: item.product.category?.name || 'Uncategorized',
          quantitySold: 0,
          revenue: 0,
          cost: 0,
          profit: 0,
          profitMargin: 0
        }
      }

      productAnalysis[productId].quantitySold += item.quantity
      productAnalysis[productId].revenue += revenue
      productAnalysis[productId].cost += cost
      productAnalysis[productId].profit += profit
    })

    // Calculate profit margins
    const productProfitability = Object.values(productAnalysis).map(product => ({
      ...product,
      profitMargin: product.revenue > 0 ? (product.profit / product.revenue) * 100 : 0
    }))

    // Analyze by category
    const categoryAnalysis: {
      [key: string]: {
        category: string
        quantitySold: number
        revenue: number
        cost: number
        profit: number
        profitMargin: number
        productCount: number
      }
    } = {}

    productProfitability.forEach(product => {
      const category = product.category

      if (!categoryAnalysis[category]) {
        categoryAnalysis[category] = {
          category,
          quantitySold: 0,
          revenue: 0,
          cost: 0,
          profit: 0,
          profitMargin: 0,
          productCount: 0
        }
      }

      categoryAnalysis[category].quantitySold += product.quantitySold
      categoryAnalysis[category].revenue += product.revenue
      categoryAnalysis[category].cost += product.cost
      categoryAnalysis[category].profit += product.profit
      categoryAnalysis[category].productCount += 1
    })

    const categoryProfitability = Object.values(categoryAnalysis).map(category => ({
      ...category,
      profitMargin: category.revenue > 0 ? (category.profit / category.revenue) * 100 : 0
    }))

    // Sort products by different metrics
    const topByRevenue = [...productProfitability]
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    const topByProfit = [...productProfitability]
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 10)

    const topByMargin = [...productProfitability]
      .filter(p => p.quantitySold >= 5) // Minimum 5 sales for reliable margin
      .sort((a, b) => b.profitMargin - a.profitMargin)
      .slice(0, 10)

    const lowMarginProducts = [...productProfitability]
      .filter(p => p.quantitySold >= 5)
      .sort((a, b) => a.profitMargin - b.profitMargin)
      .slice(0, 10)

    // Overall summary
    const totalRevenue = productProfitability.reduce((sum, p) => sum + p.revenue, 0)
    const totalCost = productProfitability.reduce((sum, p) => sum + p.cost, 0)
    const totalProfit = totalRevenue - totalCost
    const overallMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0

    return NextResponse.json({
      summary: {
        totalRevenue,
        totalCost,
        totalProfit,
        overallMargin: overallMargin.toFixed(2),
        totalProducts: productProfitability.length,
        totalCategories: categoryProfitability.length
      },
      topByRevenue,
      topByProfit,
      topByMargin,
      lowMarginProducts,
      categoryProfitability: categoryProfitability.sort((a, b) => b.profit - a.profit),
      allProducts: productProfitability.sort((a, b) => b.revenue - a.revenue)
    })
  } catch (error: any) {
    console.error('Profit margin error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
