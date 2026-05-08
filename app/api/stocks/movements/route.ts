import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token || !verifyToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const warehouseId = searchParams.get('warehouseId')
  const productId = searchParams.get('productId')
  const limit = parseInt(searchParams.get('limit') ?? '50')

  const where: any = {}
  if (warehouseId) where.warehouseId = warehouseId
  if (productId) where.stock = { productId }

  const movements = await prisma.stockMovement.findMany({
    where,
    include: {
      stock: {
        include: {
          product: { select: { name: true, sku: true, unit: true } },
          warehouse: { select: { name: true } }
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: limit
  })

  return NextResponse.json(movements)
}
