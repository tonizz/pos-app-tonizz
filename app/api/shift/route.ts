import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

// Open Shift
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
    const { openAmount } = body

    if (!openAmount || openAmount < 0) {
      return NextResponse.json(
        { error: 'Open amount is required and must be positive' },
        { status: 400 }
      )
    }

    // Check if user already has an open shift today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const existingShift = await prisma.cashSession.findFirst({
      where: {
        cashierId: decoded.userId,
        status: 'OPEN',
        openedAt: {
          gte: today,
          lt: tomorrow
        }
      }
    })

    if (existingShift) {
      return NextResponse.json(
        { error: 'You already have an open shift today', shift: existingShift },
        { status: 400 }
      )
    }

    // Generate shift code
    const now = new Date()
    const dateStr = now.toISOString().split('T')[0].replace(/-/g, '')
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '')
    const code = `SHIFT-${dateStr}-${timeStr}`

    // Create new shift
    const shift = await prisma.cashSession.create({
      data: {
        code,
        cashierId: decoded.userId,
        openAmount: parseFloat(openAmount),
        status: 'OPEN'
      },
      include: {
        cashier: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    await prisma.auditLog.create({
      data: {
        userId: decoded.userId,
        action: 'OPEN_SHIFT',
        entity: 'CashSession',
        entityId: shift.id,
        details: `Opened shift ${code} with amount ${openAmount}`
      }
    })

    return NextResponse.json(shift, { status: 201 })
  } catch (error: any) {
    console.error('Open shift error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// Get Active Shift
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

    const activeShift = await prisma.cashSession.findFirst({
      where: {
        cashierId: decoded.userId,
        status: 'OPEN'
      },
      include: {
        cashier: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        transactions: {
          select: {
            id: true,
            total: true
          }
        }
      }
    })

    if (!activeShift) {
      return NextResponse.json({ shift: null })
    }

    // Calculate totals
    const totalSales = activeShift.transactions.reduce((sum, t) => sum + t.total, 0)
    const expectedAmount = activeShift.openAmount + totalSales

    return NextResponse.json({
      shift: {
        ...activeShift,
        totalSales,
        expectedAmount
      }
    })
  } catch (error: any) {
    console.error('Get shift error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
