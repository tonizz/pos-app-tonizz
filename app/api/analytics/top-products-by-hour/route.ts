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
    const days = parseInt(searchParams.get('days') || '30')

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    startDate.setHours(0, 0, 0, 0)

    // Ambil semua transaction items dengan info waktu transaksi
    const transactionItems = await prisma.transactionItem.findMany({
      where: {
        transaction: {
          createdAt: { gte: startDate },
          status: 'COMPLETED',
        },
      },
      select: {
        productId: true,
        quantity: true,
        subtotal: true,
        transaction: {
          select: { createdAt: true },
        },
      },
    })

    // Struktur: { productId: { hour: { qty, revenue } } }
    const productHourMap: Record<
      string,
      { totalQty: number; byHour: Record<number, { qty: number; revenue: number }> }
    > = {}

    transactionItems.forEach(item => {
      const hour = item.transaction.createdAt.getHours()
      const pid = item.productId

      if (!productHourMap[pid]) {
        productHourMap[pid] = { totalQty: 0, byHour: {} }
      }
      if (!productHourMap[pid].byHour[hour]) {
        productHourMap[pid].byHour[hour] = { qty: 0, revenue: 0 }
      }

      productHourMap[pid].totalQty += item.quantity
      productHourMap[pid].byHour[hour].qty += item.quantity
      productHourMap[pid].byHour[hour].revenue += item.subtotal
    })

    // Ambil top 15 produk berdasarkan total qty
    const topProductIds = Object.entries(productHourMap)
      .sort((a, b) => b[1].totalQty - a[1].totalQty)
      .slice(0, 15)
      .map(([pid]) => pid)

    // Resolve nama produk
    const products = await prisma.product.findMany({
      where: { id: { in: topProductIds } },
      select: { id: true, name: true, sku: true },
    })
    const productMap = Object.fromEntries(products.map(p => [p.id, p]))

    // Build heatmap data: array of { productId, name, hourData[] }
    const heatmapData = topProductIds.map(pid => {
      const hourData = Array.from({ length: 24 }, (_, h) => ({
        hour: h,
        qty: productHourMap[pid]?.byHour[h]?.qty || 0,
        revenue: productHourMap[pid]?.byHour[h]?.revenue || 0,
      }))
      return {
        productId: pid,
        name: productMap[pid]?.name || 'Unknown',
        sku: productMap[pid]?.sku || '',
        totalQty: productHourMap[pid]?.totalQty || 0,
        hourData,
      }
    })

    // Build top products per jam (untuk sidebar ranking saat klik jam)
    const hourlyTopProducts = Array.from({ length: 24 }, (_, hour) => {
      const productsAtHour = topProductIds
        .map(pid => ({
          productId: pid,
          name: productMap[pid]?.name || 'Unknown',
          qty: productHourMap[pid]?.byHour[hour]?.qty || 0,
          revenue: productHourMap[pid]?.byHour[hour]?.revenue || 0,
        }))
        .filter(p => p.qty > 0)
        .sort((a, b) => b.qty - a.qty)
        .slice(0, 10)

      const totalQtyAtHour = productsAtHour.reduce((sum, p) => sum + p.qty, 0)

      return {
        hour,
        hourLabel: `${String(hour).padStart(2, '0')}:00`,
        totalQty: totalQtyAtHour,
        topProducts: productsAtHour,
      }
    })

    // Cari nilai max untuk normalisasi warna heatmap
    let maxQty = 0
    heatmapData.forEach(p => {
      p.hourData.forEach(h => {
        if (h.qty > maxQty) maxQty = h.qty
      })
    })

    return NextResponse.json({
      heatmapData,
      hourlyTopProducts,
      maxQty,
      meta: { days, totalProducts: topProductIds.length },
    })
  } catch (error: any) {
    console.error('Top products by hour error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
