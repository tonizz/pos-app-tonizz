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

    const transfer = await prisma.stockTransfer.findUnique({
      where: { id: id },
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

    if (!transfer) {
      return NextResponse.json(
        { error: 'Transfer not found' },
        { status: 404 }
      )
    }

    if (transfer.status === 'COMPLETED' || transfer.status === 'CANCELLED') {
      return NextResponse.json(
        { error: 'Cannot update completed or cancelled transfer' },
        { status: 400 }
      )
    }

    // If completing transfer, update stock
    if (status === 'COMPLETED') {
      for (const item of transfer.items) {
        // Reduce stock from source warehouse
        const fromStock = await prisma.stock.findFirst({
          where: {
            productId: item.productId,
            warehouseId: transfer.fromWarehouseId
          }
        })

        if (fromStock) {
          await prisma.stock.update({
            where: { id: fromStock.id },
            data: {
              quantity: fromStock.quantity - item.quantity
            }
          })

          // Create stock movement for OUT
          await prisma.stockMovement.create({
            data: {
              stockId: fromStock.id,
              warehouseId: transfer.fromWarehouseId,
              type: 'TRANSFER',
              quantity: -item.quantity,
              reference: transfer.transferNo,
              notes: `Transfer to ${transfer.toWarehouse?.name || 'warehouse'}`
            }
          })
        }

        // Add stock to destination warehouse
        const toStock = await prisma.stock.findFirst({
          where: {
            productId: item.productId,
            warehouseId: transfer.toWarehouseId
          }
        })

        if (toStock) {
          await prisma.stock.update({
            where: { id: toStock.id },
            data: {
              quantity: toStock.quantity + item.quantity
            }
          })

          // Create stock movement for IN
          await prisma.stockMovement.create({
            data: {
              stockId: toStock.id,
              warehouseId: transfer.toWarehouseId,
              type: 'TRANSFER',
              quantity: item.quantity,
              reference: transfer.transferNo,
              notes: `Transfer from ${transfer.fromWarehouse?.name || 'warehouse'}`
            }
          })
        } else {
          // Create new stock record if doesn't exist
          const newStock = await prisma.stock.create({
            data: {
              productId: item.productId,
              warehouseId: transfer.toWarehouseId,
              quantity: item.quantity,
              minStock: 0
            }
          })

          // Create stock movement for IN
          await prisma.stockMovement.create({
            data: {
              stockId: newStock.id,
              warehouseId: transfer.toWarehouseId,
              type: 'TRANSFER',
              quantity: item.quantity,
              reference: transfer.transferNo,
              notes: `Transfer from ${transfer.fromWarehouse?.name || 'warehouse'}`
            }
          })
        }
      }
    }

    const updatedTransfer = await prisma.stockTransfer.update({
      where: { id: id },
      data: { status },
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
        action: 'UPDATE',
        entity: 'StockTransfer',
        entityId: updatedTransfer.id,
        details: `Updated stock transfer ${updatedTransfer.transferNo} status to ${status}`
      }
    })

    return NextResponse.json(updatedTransfer)
  } catch (error) {
    console.error('Update stock transfer error:', error)
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

    const transfer = await prisma.stockTransfer.findUnique({
      where: { id: id }
    })

    if (!transfer) {
      return NextResponse.json(
        { error: 'Transfer not found' },
        { status: 404 }
      )
    }

    if (transfer.status === 'COMPLETED') {
      return NextResponse.json(
        { error: 'Cannot delete completed transfer' },
        { status: 400 }
      )
    }

    await prisma.stockTransfer.delete({
      where: { id: id }
    })

    await prisma.auditLog.create({
      data: {
        userId: decoded.userId,
        action: 'DELETE',
        entity: 'StockTransfer',
        entityId: id,
        details: `Deleted stock transfer: ${transfer.transferNo}`
      }
    })

    return NextResponse.json({ message: 'Transfer deleted successfully' })
  } catch (error) {
    console.error('Delete stock transfer error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
