import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Get single promotion
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const decoded = verifyToken(token)

    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const promotion = await prisma.promotion.findUnique({
      where: { id }
    })

    if (!promotion) {
      return NextResponse.json({ error: 'Promotion not found' }, { status: 404 })
    }

    return NextResponse.json(promotion)
  } catch (error: any) {
    console.error('Get promotion error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT - Update promotion
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const decoded = verifyToken(token)

    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Check if user has permission
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

    // Check if promotion exists
    const existing = await prisma.promotion.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Promotion not found' }, { status: 404 })
    }

    // Check if voucher code already exists (if changed)
    if (voucherCode && voucherCode !== existing.voucherCode) {
      const duplicate = await prisma.promotion.findUnique({
        where: { voucherCode }
      })

      if (duplicate) {
        return NextResponse.json(
          { error: 'Voucher code already exists' },
          { status: 400 }
        )
      }
    }

    const promotion = await prisma.promotion.update({
      where: { id },
      data: {
        name: name || existing.name,
        type: type || existing.type,
        value: value ? parseFloat(value) : existing.value,
        startDate: startDate ? new Date(startDate) : existing.startDate,
        endDate: endDate ? new Date(endDate) : existing.endDate,
        isActive: isActive !== undefined ? isActive : existing.isActive,
        minPurchase: minPurchase !== undefined ? (minPurchase ? parseFloat(minPurchase) : null) : existing.minPurchase,
        maxDiscount: maxDiscount !== undefined ? (maxDiscount ? parseFloat(maxDiscount) : null) : existing.maxDiscount,
        voucherCode: voucherCode !== undefined ? (voucherCode || null) : existing.voucherCode
      }
    })

    return NextResponse.json(promotion)
  } catch (error: any) {
    console.error('Update promotion error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - Delete promotion
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const decoded = verifyToken(token)

    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Check if user has permission
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    })

    if (!user || !['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if promotion exists
    const existing = await prisma.promotion.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Promotion not found' }, { status: 404 })
    }

    await prisma.promotion.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Promotion deleted successfully' })
  } catch (error: any) {
    console.error('Delete promotion error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
