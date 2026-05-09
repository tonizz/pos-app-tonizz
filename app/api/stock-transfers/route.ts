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
    const status = searchParams.get('status')

    const where: any = {}
    if (status) {
      where.status = status
    }

    const transfers = await prisma.stockTransfer.findMany({
      where,
      include: {
        fromWarehouse: true,
        toWarehouse: true,
        items: {
          include: {
            product: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ transfers })
  } catch (error) {
    console.error('Get stock transfers error:', error)
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
    const { fromWarehouseId, toWarehouseId, items, notes } = body

    if (!fromWarehouseId || !toWarehouseId) {
      return NextResponse.json(
        { error: 'From and To warehouse are required' },
        { status: 400 }
      )
    }

    if (fromWarehouseId === toWarehouseId) {
      return NextResponse.json(
        { error: 'Cannot transfer to the same warehouse' },
        { status: 400 }
      )
    }

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'At least one item is required' },
        { status: 400 }
      )
    }

    // Check stock availability (termasuk reserved dari transfer PENDING/IN_TRANSIT)
    for (const item of items) {
      const stock = await prisma.stock.findFirst({
        where: { productId: item.productId, warehouseId: fromWarehouseId }
      })

      if (!stock) {
        const product = await prisma.product.findUnique({ where: { id: item.productId } })
        return NextResponse.json({ error: `Stok tidak ditemukan untuk ${product?.name}` }, { status: 400 })
      }

      // Hitung reserved dari transfer lain yang masih aktif
      const pendingTransfers = await prisma.stockTransfer.findMany({
        where: {
          fromWarehouseId,
          status: { in: ['PENDING', 'IN_TRANSIT'] },
          items: { some: { productId: item.productId } }
        },
        include: { items: { where: { productId: item.productId } } }
      })
      const reserved = pendingTransfers.reduce((sum, t) =>
        sum + t.items.reduce((s, i) => s + i.quantity, 0), 0)
      const available = stock.quantity - reserved

      if (available < item.quantity) {
        const product = await prisma.product.findUnique({ where: { id: item.productId } })
        return NextResponse.json(
          { error: `Stok tidak cukup untuk ${product?.name}. Tersedia: ${available} (stok: ${stock.quantity}, reserved: ${reserved})` },
          { status: 400 }
        )
      }
    }

    // Generate transfer number
    const count = await prisma.stockTransfer.count()
    const transferNo = `TRF-${Date.now()}-${String(count + 1).padStart(4, '0')}`

    // Create transfer
    const transfer = await prisma.stockTransfer.create({
      data: {
        transferNo,
        fromWarehouseId,
        toWarehouseId,
        notes: notes || null,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity
          }))
        }
      },
      include: {
        fromWarehouse: true,
        toWarehouse: true,
        items: {
          include: {
            product: true
          }
        }
      }
    })

    await prisma.auditLog.create({
      data: {
        userId: decoded.userId,
        action: 'CREATE',
        entity: 'StockTransfer',
        entityId: transfer.id,
        details: `Created stock transfer: ${transfer.transferNo}`
      }
    })

    return NextResponse.json(transfer, { status: 201 })
  } catch (error) {
    console.error('Create stock transfer error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
