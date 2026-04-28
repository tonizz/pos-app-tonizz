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
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const categoryId = searchParams.get('categoryId')

    const skip = (page - 1) * limit

    const where: any = {
      isActive: true,
      ...(search && {
        OR: [
          { name: { contains: search } },
          { sku: { contains: search } },
          { barcode: { contains: search } }
        ]
      }),
      ...(categoryId && { categoryId })
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: true,
          stocks: {
            include: {
              warehouse: true
            }
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.product.count({ where })
    ])

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Get products error:', error)
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
    const {
      name,
      sku,
      barcode,
      categoryId,
      description,
      unit,
      buyPrice,
      sellPrice,
      wholesalePrice,
      autoDiscount,
      autoDiscountType,
      images
    } = body

    if (!name || !sku || !categoryId || !buyPrice || !sellPrice) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const product = await prisma.product.create({
      data: {
        name,
        sku,
        barcode,
        categoryId,
        description,
        unit: unit || 'pcs',
        buyPrice: parseFloat(buyPrice),
        sellPrice: parseFloat(sellPrice),
        wholesalePrice: wholesalePrice ? parseFloat(wholesalePrice) : null,
        autoDiscount: autoDiscount ? parseFloat(autoDiscount) : null,
        autoDiscountType: autoDiscount ? autoDiscountType : null,
        images
      },
      include: {
        category: true
      }
    })

    await prisma.auditLog.create({
      data: {
        userId: decoded.userId,
        action: 'CREATE',
        entity: 'Product',
        entityId: product.id,
        details: `Created product: ${product.name}`
      }
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error('Create product error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
