import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

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
    const { creditTransactionId, amount, paymentMethod, reference, notes } = body

    if (!creditTransactionId || !amount || !paymentMethod) {
      return NextResponse.json(
        { error: 'Credit transaction, amount, and payment method are required' },
        { status: 400 }
      )
    }

    // Get credit transaction
    const creditTransaction = await prisma.creditTransaction.findUnique({
      where: { id: creditTransactionId },
      include: {
        customer: true,
        payments: true
      }
    })

    if (!creditTransaction) {
      return NextResponse.json(
        { error: 'Credit transaction not found' },
        { status: 404 }
      )
    }

    if (creditTransaction.status === 'PAID') {
      return NextResponse.json(
        { error: 'Credit transaction already paid' },
        { status: 400 }
      )
    }

    // Calculate total paid
    const totalPaid = creditTransaction.payments.reduce((sum, p) => sum + p.amount, 0)
    const remaining = creditTransaction.amount - totalPaid

    if (amount > remaining) {
      return NextResponse.json(
        { error: `Payment amount exceeds remaining balance. Remaining: ${remaining}` },
        { status: 400 }
      )
    }

    // Create payment
    const payment = await prisma.creditPayment.create({
      data: {
        creditTransactionId,
        customerId: creditTransaction.customerId,
        amount,
        paymentMethod,
        reference: reference || null,
        notes: notes || null
      },
      include: {
        customer: true,
        creditTransaction: true
      }
    })

    // Update credit transaction status
    const newTotalPaid = totalPaid + amount
    let newStatus: 'UNPAID' | 'PARTIAL' | 'PAID' | 'OVERDUE' = creditTransaction.status

    if (newTotalPaid >= creditTransaction.amount) {
      newStatus = 'PAID'
    } else if (newTotalPaid > 0) {
      newStatus = 'PARTIAL'
    }

    await prisma.creditTransaction.update({
      where: { id: creditTransactionId },
      data: {
        status: newStatus,
        paidDate: newStatus === 'PAID' ? new Date() : null
      }
    })

    // Update customer credit balance
    const newBalance = creditTransaction.customer.creditBalance - amount
    await prisma.customer.update({
      where: { id: creditTransaction.customerId },
      data: {
        creditBalance: Math.max(0, newBalance)
      }
    })

    await prisma.auditLog.create({
      data: {
        userId: decoded.userId,
        action: 'CREATE',
        entity: 'CreditPayment',
        entityId: payment.id,
        details: `Payment ${amount} for credit transaction ${creditTransaction.id}`
      }
    })

    return NextResponse.json(payment, { status: 201 })
  } catch (error) {
    console.error('Create credit payment error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
