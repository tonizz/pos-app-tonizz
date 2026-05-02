import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

// Get sales trends and forecasting
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

    // Get daily sales data
    const transactions = await prisma.transaction.findMany({
      where: {
        createdAt: {
          gte: startDate
        },
        status: 'COMPLETED'
      },
      select: {
        total: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    // Group by date
    const salesByDate: { [key: string]: { total: number; count: number } } = {}

    transactions.forEach(transaction => {
      const date = transaction.createdAt.toISOString().split('T')[0]
      if (!salesByDate[date]) {
        salesByDate[date] = { total: 0, count: 0 }
      }
      salesByDate[date].total += transaction.total
      salesByDate[date].count += 1
    })

    // Convert to array and calculate trends
    const dailySales = Object.entries(salesByDate).map(([date, data]) => ({
      date,
      total: data.total,
      count: data.count,
      average: data.total / data.count
    }))

    // Calculate simple moving average (7-day)
    const movingAverage = dailySales.map((day, index) => {
      if (index < 6) return { ...day, movingAvg: null }

      const last7Days = dailySales.slice(index - 6, index + 1)
      const avg = last7Days.reduce((sum, d) => sum + d.total, 0) / 7

      return { ...day, movingAvg: avg }
    })

    // Calculate growth rate
    const totalSales = dailySales.reduce((sum, day) => sum + day.total, 0)
    const avgDailySales = totalSales / dailySales.length

    const firstHalf = dailySales.slice(0, Math.floor(dailySales.length / 2))
    const secondHalf = dailySales.slice(Math.floor(dailySales.length / 2))

    const firstHalfAvg = firstHalf.reduce((sum, day) => sum + day.total, 0) / firstHalf.length
    const secondHalfAvg = secondHalf.reduce((sum, day) => sum + day.total, 0) / secondHalf.length

    const growthRate = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100

    // Simple forecast for next 7 days (using linear regression)
    const forecast = []
    const lastValue = dailySales[dailySales.length - 1]?.total || avgDailySales
    const trend = growthRate / 100

    for (let i = 1; i <= 7; i++) {
      const forecastDate = new Date()
      forecastDate.setDate(forecastDate.getDate() + i)

      forecast.push({
        date: forecastDate.toISOString().split('T')[0],
        predictedTotal: lastValue * (1 + (trend * i / 30)),
        confidence: Math.max(0.5, 1 - (i * 0.05)) // Confidence decreases over time
      })
    }

    return NextResponse.json({
      dailySales: movingAverage,
      summary: {
        totalSales,
        avgDailySales,
        growthRate: growthRate.toFixed(2),
        totalTransactions: transactions.length
      },
      forecast
    })
  } catch (error: any) {
    console.error('Sales trends error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
