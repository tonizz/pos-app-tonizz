import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

// Close Shift
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
    const { shiftId, actualAmount, notes } = body

    if (!shiftId) {
      return NextResponse.json(
        { error: 'Shift ID is required' },
        { status: 400 }
      )
    }

    if (actualAmount === undefined || actualAmount === null) {
      return NextResponse.json(
        { error: 'Actual amount is required' },
        { status: 400 }
      )
    }

    // Get shift
    const shift = await prisma.cashSession.findUnique({
      where: { id: shiftId },
      include: {
        transactions: true
      }
    })

    if (!shift) {
      return NextResponse.json(
        { error: 'Shift not found' },
        { status: 404 }
      )
    }

    if (shift.cashierId !== decoded.userId) {
      return NextResponse.json(
        { error: 'You can only close your own shift' },
        { status: 403 }
      )
    }

    if (shift.status === 'CLOSED') {
      return NextResponse.json(
        { error: 'Shift is already closed' },
        { status: 400 }
      )
    }

    // Calculate totals
    const totalSales = shift.transactions.reduce((sum, t) => sum + t.total, 0)
    const totalCash = shift.transactions.reduce((sum, t) => sum + t.paidAmount, 0)
    const expectedAmount = shift.openAmount + totalCash
    const difference = parseFloat(actualAmount) - expectedAmount

    // Close shift
    const closedShift = await prisma.cashSession.update({
      where: { id: shiftId },
      data: {
        status: 'CLOSED',
        closedAt: new Date(),
        actualAmount: parseFloat(actualAmount),
        expectedAmount,
        totalSales,
        totalCash,
        difference,
        notes
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
        action: 'CLOSE_SHIFT',
        entity: 'CashSession',
        entityId: shift.id,
        details: `Closed shift ${shift.code}. Expected: ${expectedAmount}, Actual: ${actualAmount}, Difference: ${difference}`
      }
    })

    return NextResponse.json(closedShift)
  } catch (error: any) {
    console.error('Close shift error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
