import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const decoded = verifyToken(token)
  if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

  const { transactionId, returnItems, reason } = await request.json()
  // returnItems: [{ transactionItemId, productId, quantity, warehouseId }]

  if (!transactionId || !returnItems?.length) {
    return NextResponse.json({ error: 'Data return tidak lengkap' }, { status: 400 })
  }

  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: { items: { include: { product: true } } }
  })

  if (!transaction) return NextResponse.json({ error: 'Transaksi tidak ditemukan' }, { status: 404 })
  if (transaction.status === 'REFUNDED') return NextResponse.json({ error: 'Transaksi sudah di-refund' }, { status: 400 })

  // Hitung total refund
  let refundTotal = 0
  for (const ret of returnItems) {
    const txItem = transaction.items.find(i => i.id === ret.transactionItemId)
    if (!txItem) continue
    if (ret.quantity > txItem.quantity) {
      return NextResponse.json({ error: `Qty return melebihi qty beli untuk ${txItem.product.name}` }, { status: 400 })
    }
    refundTotal += (txItem.price - (txItem.discount || 0)) * ret.quantity
  }

  // Kembalikan stok dan buat record
  await prisma.$transaction(async (tx) => {
    for (const ret of returnItems) {
      const txItem = transaction.items.find(i => i.id === ret.transactionItemId)
      if (!txItem || ret.quantity <= 0) continue

      const stock = await tx.stock.findFirst({
        where: { productId: txItem.productId, warehouseId: ret.warehouseId }
      })

      if (stock) {
        await tx.stock.update({
          where: { id: stock.id },
          data: { quantity: { increment: ret.quantity } }
        })
        await tx.stockMovement.create({
          data: {
            stockId: stock.id,
            warehouseId: ret.warehouseId,
            type: 'RETURN',
            quantity: ret.quantity,
            reference: transaction.invoiceNo,
            notes: `Return dari transaksi ${transaction.invoiceNo}${reason ? ` - ${reason}` : ''}`
          }
        })
      }
    }

    // Update status transaksi
    const allReturned = returnItems.every((ret: any) => {
      const txItem = transaction.items.find(i => i.id === ret.transactionItemId)
      return txItem && ret.quantity >= txItem.quantity
    }) && returnItems.length === transaction.items.length

    await tx.transaction.update({
      where: { id: transactionId },
      data: { status: allReturned ? 'REFUNDED' : 'COMPLETED' }
    })

    await tx.auditLog.create({
      data: {
        userId: decoded.userId,
        action: 'RETURN',
        entity: 'Transaction',
        entityId: transactionId,
        details: `Return ${transaction.invoiceNo} - Refund Rp ${refundTotal.toLocaleString('id-ID')}`
      }
    })
  })

  return NextResponse.json({ success: true, refundTotal })
}
