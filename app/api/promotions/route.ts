import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - List all promotions
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const decoded = verifyToken(token)

    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const isActive = searchParams.get('isActive')

    const where: any = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { voucherCode: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true'
    }

    const promotions = await prisma.promotion.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ promotions })
  } catch (error: any) {
    console.error('Get promotions error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Create new promotion
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const decoded = verifyToken(token)

    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Check if user has permission (ADMIN, MANAGER, SUPER_ADMIN)
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    })

    if (!user || !['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const {
      name,
      type,
      value,
      startDate,
      endDate,
      isActive,
      minPurchase,
      maxDiscount,
      voucherCode
    } = body

    // Validation
    if (!name || !type || !value || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if voucher code already exists
    if (voucherCode) {
      const existing = await prisma.promotion.findUnique({
        where: { voucherCode }
      })

      if (existing) {
        return NextResponse.json(
          { error: 'Voucher code already exists' },
          { status: 400 }
        )
      }
    }

    const promotion = await prisma.promotion.create({
      data: {
        name,
        type,
        value: parseFloat(value),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isActive: isActive !== undefined ? isActive : true,
        minPurchase: minPurchase ? parseFloat(minPurchase) : null,
        maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
        voucherCode: voucherCode || null
      }
    })

    return NextResponse.json(promotion, { status: 201 })
  } catch (error: any) {
    console.error('Create promotion error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
