import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

// Get product correlation (frequently bought together)
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
    const minSupport = parseFloat(searchParams.get('minSupport') || '0.01') // 1% minimum

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Get transactions with items
    const transactions = await prisma.transaction.findMany({
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
    })

    const totalTransactions = transactions.length

    if (totalTransactions === 0) {
      return NextResponse.json({
        correlations: [],
        summary: {
          totalTransactions: 0,
          totalProductPairs: 0
        }
      })
    }

    // Build product pairs (market basket analysis)
    const productPairs: {
      [key: string]: {
        product1: { id: string; name: string }
        product2: { id: string; name: string }
        count: number
        support: number
        confidence: number
      }
    } = {}

    const productCounts: { [key: string]: number } = {}

    transactions.forEach(transaction => {
      const items = transaction.items

      // Count individual products
      items.forEach(item => {
        productCounts[item.productId] = (productCounts[item.productId] || 0) + 1
      })

      // Find pairs
      for (let i = 0; i < items.length; i++) {
        for (let j = i + 1; j < items.length; j++) {
          const product1 = items[i]
          const product2 = items[j]

          // Create consistent pair key (alphabetically sorted)
          const pairKey = [product1.productId, product2.productId].sort().join('-')

          if (!productPairs[pairKey]) {
            productPairs[pairKey] = {
              product1: {
                id: product1.productId,
                name: product1.product.name
              },
              product2: {
                id: product2.productId,
                name: product2.product.name
              },
              count: 0,
              support: 0,
              confidence: 0
            }
          }

          productPairs[pairKey].count += 1
        }
      }
    })

    // Calculate support and confidence
    const correlations = Object.values(productPairs)
      .map(pair => {
        // Support: how often the pair appears together
        const support = pair.count / totalTransactions

        // Confidence: P(B|A) = P(A and B) / P(A)
        const product1Count = productCounts[pair.product1.id] || 1
        const product2Count = productCounts[pair.product2.id] || 1

        const confidence1 = pair.count / product1Count
        const confidence2 = pair.count / product2Count

        // Use average confidence
        const confidence = (confidence1 + confidence2) / 2

        return {
          ...pair,
          support,
          confidence,
          lift: support / ((product1Count / totalTransactions) * (product2Count / totalTransactions))
        }
      })
      .filter(pair => pair.support >= minSupport) // Filter by minimum support
      .sort((a, b) => b.confidence - a.confidence) // Sort by confidence

    // Get top correlations
    const topCorrelations = correlations.slice(0, 20)

    // Get most popular products
    const popularProducts = Object.entries(productCounts)
      .map(([productId, count]) => {
        const product = transactions
          .flatMap(t => t.items)
          .find(item => item.productId === productId)?.product

        return {
          productId,
          name: product?.name || 'Unknown',
          count,
          frequency: count / totalTransactions
        }
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    return NextResponse.json({
      correlations: topCorrelations,
      popularProducts,
      summary: {
        totalTransactions,
        totalProductPairs: correlations.length,
        avgItemsPerTransaction: transactions.reduce((sum, t) => sum + t.items.length, 0) / totalTransactions
      }
    })
  } catch (error: any) {
    console.error('Product correlation error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
