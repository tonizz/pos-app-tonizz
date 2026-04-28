import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { generateInvoiceNumber } from '@/lib/utils'

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
      items,
      customerId,
      warehouseId,
      discount,
      tax,
      paymentMethod,
      paidAmount,
      payments
    } = body

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'Cart is empty' },
        { status: 400 }
      )
    }

    if (!warehouseId) {
      return NextResponse.json(
        { error: 'Warehouse is required' },
        { status: 400 }
      )
    }

    const subtotal = items.reduce((sum: number, item: any) => sum + item.subtotal, 0)
    const total = subtotal - (discount || 0) + (tax || 0)
    const changeAmount = paidAmount - total

    if (changeAmount < 0) {
      return NextResponse.json(
        { error: 'Insufficient payment' },
        { status: 400 }
      )
    }

    const invoiceNo = generateInvoiceNumber()

    const transaction = await prisma.$transaction(async (tx) => {
      const newTransaction = await tx.transaction.create({
        data: {
          invoiceNo,
          cashierId: decoded.userId,
          customerId: customerId || null,
          warehouseId,
          subtotal,
          discount: discount || 0,
          tax: tax || 0,
          total,
          paymentMethod,
          paidAmount,
          changeAmount,
          status: 'COMPLETED',
          items: {
            create: items.map((item: any) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
              discount: item.discount || 0,
              subtotal: item.subtotal
            }))
          },
          payments: {
            create: payments || [{
              method: paymentMethod,
              amount: paidAmount
            }]
          }
        },
        include: {
          items: {
            include: {
              product: true
            }
          },
          customer: true,
          cashier: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          payments: true
        }
      })

      for (const item of items) {
        const stock = await tx.stock.findFirst({
          where: {
            productId: item.productId,
            warehouseId
          }
        })

        if (!stock) {
          throw new Error(`Stock not found for product ${item.productId}`)
        }

        if (stock.quantity < item.quantity) {
          throw new Error(`Insufficient stock for product ${item.productId}`)
        }

        await tx.stock.update({
          where: { id: stock.id },
          data: {
            quantity: stock.quantity - item.quantity
          }
        })

        await tx.stockMovement.create({
          data: {
            stockId: stock.id,
            warehouseId,
            type: 'OUT',
            quantity: item.quantity,
            reference: invoiceNo,
            notes: 'Sale transaction'
          }
        })
      }

      if (customerId) {
        await tx.customer.update({
          where: { id: customerId },
          data: {
            totalSpent: { increment: total },
            points: { increment: Math.floor(total / 10000) }
          }
        })
      }

      await tx.auditLog.create({
        data: {
          userId: decoded.userId,
          action: 'CREATE',
          entity: 'Transaction',
          entityId: newTransaction.id,
          details: `Created transaction: ${invoiceNo}`
        }
      })

      return newTransaction
    })

    return NextResponse.json(transaction, { status: 201 })
  } catch (error: any) {
    console.error('Create transaction error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

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
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const skip = (page - 1) * limit

    const where: any = {}

    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          items: {
            include: {
              product: true
            }
          },
          customer: true,
          cashier: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.transaction.count({ where })
    ])

    return NextResponse.json({
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Get transactions error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
