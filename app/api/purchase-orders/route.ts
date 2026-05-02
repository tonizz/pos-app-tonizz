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

    const purchaseOrders = await prisma.purchaseOrder.findMany({
      where,
      include: {
        supplier: true,
        warehouse: true,
        items: {
          include: {
            product: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ purchaseOrders })
  } catch (error) {
    console.error('Get purchase orders error:', error)
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
    const { supplierId, warehouseId, items, expectedDate, notes } = body

    if (!supplierId || !warehouseId) {
      return NextResponse.json(
        { error: 'Supplier and warehouse are required' },
        { status: 400 }
      )
    }

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'At least one item is required' },
        { status: 400 }
      )
    }

    // Calculate totals
    let subtotal = 0
    for (const item of items) {
      subtotal += item.quantity * item.price
    }

    const tax = 0 // Can be calculated based on store settings
    const total = subtotal + tax

    // Generate PO number
    const count = await prisma.purchaseOrder.count()
    const poNumber = `PO-${Date.now()}-${String(count + 1).padStart(4, '0')}`

    // Create purchase order
    const purchaseOrder = await prisma.purchaseOrder.create({
      data: {
        poNumber,
        supplierId,
        warehouseId,
        subtotal,
        tax,
        total,
        expectedDate: expectedDate ? new Date(expectedDate) : null,
        notes: notes || null,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            subtotal: item.quantity * item.price
          }))
        }
      },
      include: {
        supplier: true,
        warehouse: true,
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
        entity: 'PurchaseOrder',
        entityId: purchaseOrder.id,
        details: `Created purchase order: ${purchaseOrder.poNumber}`
      }
    })

    return NextResponse.json(purchaseOrder, { status: 201 })
  } catch (error) {
    console.error('Create purchase order error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
