import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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
    const { status } = body

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      )
    }

    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id: id },
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

    if (!purchaseOrder) {
      return NextResponse.json(
        { error: 'Purchase order not found' },
        { status: 404 }
      )
    }

    if (purchaseOrder.status === 'RECEIVED' || purchaseOrder.status === 'CANCELLED') {
      return NextResponse.json(
        { error: 'Cannot update received or cancelled purchase order' },
        { status: 400 }
      )
    }

    // If receiving PO, update stock
    if (status === 'RECEIVED') {
      for (const item of purchaseOrder.items) {
        // Find or create stock
        const stock = await prisma.stock.findFirst({
          where: {
            productId: item.productId,
            warehouseId: purchaseOrder.warehouseId
          }
        })

        if (stock) {
          await prisma.stock.update({
            where: { id: stock.id },
            data: {
              quantity: stock.quantity + item.quantity
            }
          })

          // Create stock movement
          await prisma.stockMovement.create({
            data: {
              stockId: stock.id,
              warehouseId: purchaseOrder.warehouseId,
              type: 'IN',
              quantity: item.quantity,
              reference: purchaseOrder.poNumber,
              notes: `Purchase order received from ${purchaseOrder.supplier?.name || 'supplier'}`
            }
          })
        } else {
          // Create new stock record
          const newStock = await prisma.stock.create({
            data: {
              productId: item.productId,
              warehouseId: purchaseOrder.warehouseId,
              quantity: item.quantity,
              minStock: 0
            }
          })

          // Create stock movement
          await prisma.stockMovement.create({
            data: {
              stockId: newStock.id,
              warehouseId: purchaseOrder.warehouseId,
              type: 'IN',
              quantity: item.quantity,
              reference: purchaseOrder.poNumber,
              notes: `Purchase order received from ${purchaseOrder.supplier?.name || 'supplier'}`
            }
          })
        }
      }
    }

    const updatedPurchaseOrder = await prisma.purchaseOrder.update({
      where: { id: id },
      data: {
        status,
        receivedDate: status === 'RECEIVED' ? new Date() : null
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
        action: 'UPDATE',
        entity: 'PurchaseOrder',
        entityId: updatedPurchaseOrder.id,
        details: `Updated purchase order ${updatedPurchaseOrder.poNumber} status to ${status}`
      }
    })

    return NextResponse.json(updatedPurchaseOrder)
  } catch (error) {
    console.error('Update purchase order error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id: id }
    })

    if (!purchaseOrder) {
      return NextResponse.json(
        { error: 'Purchase order not found' },
        { status: 404 }
      )
    }

    if (purchaseOrder.status === 'RECEIVED') {
      return NextResponse.json(
        { error: 'Cannot delete received purchase order' },
        { status: 400 }
      )
    }

    await prisma.purchaseOrder.delete({
      where: { id: id }
    })

    await prisma.auditLog.create({
      data: {
        userId: decoded.userId,
        action: 'DELETE',
        entity: 'PurchaseOrder',
        entityId: id,
        details: `Deleted purchase order: ${purchaseOrder.poNumber}`
      }
    })

    return NextResponse.json({ message: 'Purchase order deleted successfully' })
  } catch (error) {
    console.error('Delete purchase order error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
