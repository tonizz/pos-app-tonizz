import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

// POST /api/purchase-orders/[id]/receive — partial receiving
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    // receivedItems: [{ productId, receivedQty }]
    const { receivedItems } = await request.json()
    if (!receivedItems?.length) {
      return NextResponse.json({ error: 'receivedItems wajib diisi' }, { status: 400 })
    }

    const po = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: { supplier: true, warehouse: true, items: { include: { product: true } } }
    })

    if (!po) return NextResponse.json({ error: 'PO tidak ditemukan' }, { status: 404 })
    if (po.status === 'CANCELLED') {
      return NextResponse.json({ error: 'PO sudah dibatalkan' }, { status: 400 })
    }

    // Update stok untuk setiap item yang diterima
    for (const recv of receivedItems) {
      if (!recv.receivedQty || recv.receivedQty <= 0) continue

      const poItem = po.items.find(i => i.productId === recv.productId)
      if (!poItem) continue

      const stock = await prisma.stock.findFirst({
        where: { productId: recv.productId, warehouseId: po.warehouseId }
      })

      if (stock) {
        await prisma.stock.update({
          where: { id: stock.id },
          data: { quantity: { increment: recv.receivedQty } }
        })
        await prisma.stockMovement.create({
          data: {
            stockId: stock.id,
            warehouseId: po.warehouseId,
            type: 'IN',
            quantity: recv.receivedQty,
            reference: po.poNumber,
            notes: `Partial receive dari ${po.supplier?.name} (${recv.receivedQty}/${poItem.quantity})`
          }
        })
      } else {
        const newStock = await prisma.stock.create({
          data: { productId: recv.productId, warehouseId: po.warehouseId, quantity: recv.receivedQty, minStock: 0 }
        })
        await prisma.stockMovement.create({
          data: {
            stockId: newStock.id,
            warehouseId: po.warehouseId,
            type: 'IN',
            quantity: recv.receivedQty,
            reference: po.poNumber,
            notes: `Partial receive dari ${po.supplier?.name}`
          }
        })
      }
    }

    // Cek apakah semua item sudah diterima penuh → set RECEIVED, jika tidak → APPROVED
    const allReceived = receivedItems.every((recv: any) => {
      const poItem = po.items.find(i => i.productId === recv.productId)
      return poItem && recv.receivedQty >= poItem.quantity
    }) && receivedItems.length === po.items.length

    const newStatus = allReceived ? 'RECEIVED' : 'APPROVED'

    await prisma.purchaseOrder.update({
      where: { id },
      data: {
        status: newStatus,
        receivedDate: allReceived ? new Date() : undefined
      }
    })

    await prisma.auditLog.create({
      data: {
        userId: decoded.userId,
        action: 'UPDATE',
        entity: 'PurchaseOrder',
        entityId: id,
        details: `Partial receive PO ${po.poNumber} - ${allReceived ? 'COMPLETED' : 'PARTIAL'}`
      }
    })

    return NextResponse.json({ success: true, status: newStatus })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
