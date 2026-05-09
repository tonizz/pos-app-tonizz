import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

// GET: riwayat PO supplier
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token || !verifyToken(token)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const orders = await prisma.purchaseOrder.findMany({
    where: { supplierId: id },
    include: { warehouse: { select: { name: true } }, items: { include: { product: { select: { name: true } } } } },
    orderBy: { createdAt: 'desc' }
  })

  return NextResponse.json(orders)
}

// POST: bayar hutang supplier
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const decoded = verifyToken(token)
  if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

  const { id } = await params
  const { amount, notes } = await request.json()

  if (!amount || amount <= 0) return NextResponse.json({ error: 'Jumlah pembayaran tidak valid' }, { status: 400 })

  const supplier = await prisma.supplier.findUnique({ where: { id } })
  if (!supplier) return NextResponse.json({ error: 'Supplier tidak ditemukan' }, { status: 404 })
  if (amount > supplier.debt) return NextResponse.json({ error: 'Pembayaran melebihi hutang' }, { status: 400 })

  await prisma.$transaction(async (tx) => {
    await tx.supplier.update({
      where: { id },
      data: { debt: { decrement: amount } }
    })
    await tx.auditLog.create({
      data: {
        userId: decoded.userId,
        action: 'PAYMENT',
        entity: 'Supplier',
        entityId: id,
        details: `Bayar hutang ${supplier.name}: Rp ${amount.toLocaleString('id-ID')}${notes ? ` - ${notes}` : ''}`
      }
    })
  })

  return NextResponse.json({ success: true, remainingDebt: supplier.debt - amount })
}
