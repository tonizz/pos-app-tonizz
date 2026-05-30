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

    // Role check — hanya owner roles
    const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'MANAGER']
    if (!allowedRoles.includes(decoded.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const now = new Date()

    // Hari ini: dari 00:00 sampai sekarang
    const todayStart = new Date(now)
    todayStart.setHours(0, 0, 0, 0)

    // Kemarin: dari 00:00 sampai 23:59:59
    const yesterdayStart = new Date(todayStart)
    yesterdayStart.setDate(yesterdayStart.getDate() - 1)
    const yesterdayEnd = new Date(todayStart)
    yesterdayEnd.setMilliseconds(-1)

    // 7 hari terakhir (untuk mini chart)
    const sevenDaysAgo = new Date(now)
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
    sevenDaysAgo.setHours(0, 0, 0, 0)

    const [
      todayRevenue,
      todayTransactions,
      yesterdayRevenue,
      yesterdayTransactions,
      last7DaysTransactions,
      topProductsRaw,
      recentTransactions,
      allStocks,
      activeShifts,
    ] = await Promise.all([
      // Revenue hari ini
      prisma.transaction.aggregate({
        where: { createdAt: { gte: todayStart }, status: 'COMPLETED' },
        _sum: { total: true },
      }),

      // Jumlah transaksi hari ini
      prisma.transaction.count({
        where: { createdAt: { gte: todayStart }, status: 'COMPLETED' },
      }),

      // Revenue kemarin
      prisma.transaction.aggregate({
        where: {
          createdAt: { gte: yesterdayStart, lte: yesterdayEnd },
          status: 'COMPLETED',
        },
        _sum: { total: true },
      }),

      // Jumlah transaksi kemarin
      prisma.transaction.count({
        where: {
          createdAt: { gte: yesterdayStart, lte: yesterdayEnd },
          status: 'COMPLETED',
        },
      }),

      // 7 hari terakhir untuk mini chart
      prisma.transaction.findMany({
        where: { createdAt: { gte: sevenDaysAgo }, status: 'COMPLETED' },
        select: { createdAt: true, total: true },
        orderBy: { createdAt: 'asc' },
      }),

      // Top 5 produk terlaris hari ini (by qty)
      prisma.transactionItem.groupBy({
        by: ['productId'],
        where: {
          transaction: {
            createdAt: { gte: todayStart },
            status: 'COMPLETED',
          },
        },
        _sum: { quantity: true, subtotal: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5,
      }),

      // 5 transaksi terbaru
      prisma.transaction.findMany({
        where: { createdAt: { gte: todayStart } },
        include: {
          customer: { select: { name: true } },
          cashier: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),

      // Fetch semua stok dengan minStock > 0, filter kritis di JS
      prisma.stock.findMany({
        where: { minStock: { gt: 0 } },
        include: {
          product: { select: { name: true, sku: true } },
          warehouse: { select: { name: true } },
        },
      }),

      // Shift kasir yang aktif
      prisma.cashSession.findMany({
        where: { status: 'OPEN' },
        include: {
          cashier: { select: { name: true } },
        },
      }),
    ])

    // Filter stok kritis: quantity <= minStock
    const lowStockItems = allStocks
      .filter(s => s.quantity <= s.minStock)
      .slice(0, 10)

    // Build 7-hari chart data
    const chartData: Record<string, { date: string; revenue: number; transactions: number }> = {}
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const key = d.toISOString().split('T')[0]
      chartData[key] = {
        date: key,
        revenue: 0,
        transactions: 0,
      }
    }
    last7DaysTransactions.forEach(t => {
      const key = t.createdAt.toISOString().split('T')[0]
      if (chartData[key]) {
        chartData[key].revenue += t.total
        chartData[key].transactions += 1
      }
    })
    const weeklyChart = Object.values(chartData)

    // Resolve top product names
    const topProducts = await Promise.all(
      topProductsRaw.map(async item => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: { name: true, sku: true },
        })
        return {
          productId: item.productId,
          name: product?.name || 'Unknown',
          sku: product?.sku || '',
          totalQty: item._sum.quantity || 0,
          totalRevenue: item._sum.subtotal || 0,
        }
      })
    )

    // Hitung growth
    const todayRev = todayRevenue._sum.total || 0
    const yesterdayRev = yesterdayRevenue._sum.total || 0
    const revenueGrowth =
      yesterdayRev > 0
        ? (((todayRev - yesterdayRev) / yesterdayRev) * 100).toFixed(1)
        : todayRev > 0
          ? '100.0'
          : '0.0'

    const txGrowth =
      yesterdayTransactions > 0
        ? (((todayTransactions - yesterdayTransactions) / yesterdayTransactions) * 100).toFixed(1)
        : '0.0'

    const avgTransaction =
      todayTransactions > 0 ? todayRev / todayTransactions : 0

    return NextResponse.json({
      summary: {
        todayRevenue: todayRev,
        todayTransactions,
        yesterdayRevenue: yesterdayRev,
        yesterdayTransactions,
        revenueGrowth: parseFloat(revenueGrowth),
        txGrowth: parseFloat(txGrowth),
        avgTransaction,
        lowStockCount: lowStockItems.length,
        activeShiftCount: activeShifts.length,
      },
      weeklyChart,
      topProducts,
      recentTransactions: recentTransactions.map(t => ({
        id: t.id,
        invoiceNo: t.invoiceNo,
        customer: t.customer?.name || 'Umum',
        cashier: t.cashier?.name || '-',
        total: t.total,
        status: t.status,
        createdAt: t.createdAt,
      })),
      lowStockItems: lowStockItems.map(s => ({
        productName: s.product.name,
        sku: s.product.sku,
        warehouse: s.warehouse.name,
        quantity: s.quantity,
        minStock: s.minStock,
      })),
      activeShifts: activeShifts.map(s => ({
        cashierName: s.cashier.name,
        openedAt: s.openedAt,
        totalSales: s.totalSales,
      })),
    })
  } catch (error: any) {
    console.error('Owner dashboard error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
