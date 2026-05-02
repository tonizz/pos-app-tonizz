import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

// Get best selling hours and days analysis
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

    // Get all transactions
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
      }
    })

    // Analyze by hour (0-23)
    const salesByHour: { [key: number]: { total: number; count: number } } = {}
    for (let i = 0; i < 24; i++) {
      salesByHour[i] = { total: 0, count: 0 }
    }

    // Analyze by day of week (0=Sunday, 6=Saturday)
    const salesByDay: { [key: number]: { total: number; count: number } } = {}
    for (let i = 0; i < 7; i++) {
      salesByDay[i] = { total: 0, count: 0 }
    }

    transactions.forEach(transaction => {
      const hour = transaction.createdAt.getHours()
      const dayOfWeek = transaction.createdAt.getDay()

      salesByHour[hour].total += transaction.total
      salesByHour[hour].count += 1

      salesByDay[dayOfWeek].total += transaction.total
      salesByDay[dayOfWeek].count += 1
    })

    // Convert to arrays
    const hourlyData = Object.entries(salesByHour).map(([hour, data]) => ({
      hour: parseInt(hour),
      hourLabel: `${hour.padStart(2, '0')}:00`,
      total: data.total,
      count: data.count,
      average: data.count > 0 ? data.total / data.count : 0
    }))

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const dailyData = Object.entries(salesByDay).map(([day, data]) => ({
      day: parseInt(day),
      dayName: dayNames[parseInt(day)],
      total: data.total,
      count: data.count,
      average: data.count > 0 ? data.total / data.count : 0
    }))

    // Find peak hours and days
    const peakHour = hourlyData.reduce((max, curr) =>
      curr.total > max.total ? curr : max
    , hourlyData[0])

    const peakDay = dailyData.reduce((max, curr) =>
      curr.total > max.total ? curr : max
    , dailyData[0])

    // Find slowest hours and days
    const slowestHour = hourlyData
      .filter(h => h.count > 0)
      .reduce((min, curr) =>
        curr.total < min.total ? curr : min
      , hourlyData.find(h => h.count > 0) || hourlyData[0])

    const slowestDay = dailyData
      .filter(d => d.count > 0)
      .reduce((min, curr) =>
        curr.total < min.total ? curr : min
      , dailyData.find(d => d.count > 0) || dailyData[0])

    return NextResponse.json({
      hourlyData,
      dailyData,
      insights: {
        peakHour: {
          hour: peakHour.hourLabel,
          total: peakHour.total,
          transactions: peakHour.count
        },
        slowestHour: {
          hour: slowestHour.hourLabel,
          total: slowestHour.total,
          transactions: slowestHour.count
        },
        peakDay: {
          day: peakDay.dayName,
          total: peakDay.total,
          transactions: peakDay.count
        },
        slowestDay: {
          day: slowestDay.dayName,
          total: slowestDay.total,
          transactions: slowestDay.count
        }
      }
    })
  } catch (error: any) {
    console.error('Peak hours error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
