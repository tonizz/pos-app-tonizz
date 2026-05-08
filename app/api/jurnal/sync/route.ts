import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { createSalesInvoice, transactionToJurnalPayload } from '@/lib/jurnal'

export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token || !verifyToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') // 'synced' | 'pending' | 'error'
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = 20

  const where: any = {}
  if (status === 'synced') where.jurnalSynced = true
  else if (status === 'pending') { where.jurnalSynced = false; where.jurnalError = null }
  else if (status === 'error') { where.jurnalError = { not: null } }

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      select: {
        id: true, invoiceNo: true, total: true, createdAt: true,
        jurnalSynced: true, jurnalId: true, jurnalError: true,
        cashier: { select: { name: true } },
        customer: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: (page - 1) * limit,
    }),
    prisma.transaction.count({ where }),
  ])

  // Summary stats
  const [synced, pending, error] = await Promise.all([
    prisma.transaction.count({ where: { jurnalSynced: true } }),
    prisma.transaction.count({ where: { jurnalSynced: false, jurnalError: null } }),
    prisma.transaction.count({ where: { jurnalError: { not: null } } }),
  ])

  return NextResponse.json({ transactions, total, stats: { synced, pending, error } })
}

// Manual retry sync untuk transaksi yang error
export async function POST(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token || !verifyToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { transactionId } = await request.json()

  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: { items: { include: { product: true } }, customer: true }
  })

  if (!transaction) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  try {
    const payload = transactionToJurnalPayload(transaction)
    const result = await createSalesInvoice(payload)
    await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        jurnalSynced: true,
        jurnalId: String(result?.sales_invoice?.id ?? result?.id ?? ''),
        jurnalError: null,
      }
    })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    await prisma.transaction.update({
      where: { id: transactionId },
      data: { jurnalError: err.message?.slice(0, 500) }
    })
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
