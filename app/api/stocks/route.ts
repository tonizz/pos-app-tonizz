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
    const warehouseId = searchParams.get('warehouseId')

    const where: any = {}
    if (warehouseId) {
      where.warehouseId = warehouseId
    }

    const stocks = await prisma.stock.findMany({
      where,
      include: {
        product: {
          include: {
            category: true
          }
        },
        variant: true,
        warehouse: true
      },
      orderBy: { updatedAt: 'desc' }
    })

    // Hitung reserved stock dari transfer PENDING/IN_TRANSIT
    const pendingTransfers = await prisma.stockTransfer.findMany({
      where: {
        fromWarehouseId: warehouseId ? warehouseId : undefined,
        status: { in: ['PENDING', 'IN_TRANSIT'] }
      },
      include: { items: true }
    })

    const reservedMap: Record<string, number> = {}
    for (const transfer of pendingTransfers) {
      for (const item of transfer.items) {
        const key = `${item.productId}_${transfer.fromWarehouseId}`
        reservedMap[key] = (reservedMap[key] || 0) + item.quantity
      }
    }

    const stocksWithReserved = stocks.map(s => ({
      ...s,
      reserved: reservedMap[`${s.productId}_${s.warehouseId}`] || 0,
      available: s.quantity - (reservedMap[`${s.productId}_${s.warehouseId}`] || 0)
    }))

    const lowStockItems = stocksWithReserved.filter(stock => stock.available <= stock.minStock)

    return NextResponse.json({
      stocks: stocksWithReserved,
      lowStockItems,
      summary: {
        totalItems: stocksWithReserved.length,
        lowStockCount: lowStockItems.length
      }
    })
  } catch (error) {
    console.error('Get stocks error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { productId, warehouseId, quantity, minStock, expiredDate, type, notes } = body

    if (!productId || !warehouseId || quantity === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const result = await prisma.$transaction(async (tx) => {
      const existingStock = await tx.stock.findFirst({
        where: {
          productId,
          warehouseId,
          variantId: null
        }
      })

      let stock
      if (existingStock) {
        // Bug fix: validasi stok cukup sebelum OUT
        if (type === 'OUT' && existingStock.quantity < quantity) {
          throw new Error(`Stok tidak cukup. Tersedia: ${existingStock.quantity}, diminta: ${quantity}`)
        }

        stock = await tx.stock.update({
          where: { id: existingStock.id },
          data: {
            quantity: type === 'IN'
              ? existingStock.quantity + quantity
              : existingStock.quantity - quantity,
            minStock: minStock !== undefined ? minStock : existingStock.minStock,
            expiredDate: expiredDate ? new Date(expiredDate) : existingStock.expiredDate
          },
          include: {
            product: true,
            warehouse: true
          }
        })
      } else {
        stock = await tx.stock.create({
          data: {
            productId,
            warehouseId,
            quantity,
            minStock: minStock || 0,
            expiredDate: expiredDate ? new Date(expiredDate) : null
          },
          include: {
            product: true,
            warehouse: true
          }
        })
      }

      await tx.stockMovement.create({
        data: {
          stockId: stock.id,
          warehouseId,
          type: type || 'IN',
          quantity,
          notes
        }
      })

      await tx.auditLog.create({
        data: {
          userId: decoded.userId,
          action: 'UPDATE',
          entity: 'Stock',
          entityId: stock.id,
          details: `Stock ${type || 'IN'}: ${quantity} units`
        }
      })

      return stock
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Update stock error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
