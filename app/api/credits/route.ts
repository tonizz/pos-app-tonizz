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
    const customerId = searchParams.get('customerId')
    const status = searchParams.get('status')

    const where: any = {}
    if (customerId) {
      where.customerId = customerId
    }
    if (status) {
      where.status = status
    }

    const creditTransactions = await prisma.creditTransaction.findMany({
      where,
      include: {
        customer: true,
        transaction: true,
        payments: true
      },
      orderBy: { createdAt: 'desc' }
    })

    // Update overdue status
    const now = new Date()
    for (const credit of creditTransactions) {
      if (credit.status !== 'PAID' && credit.dueDate && credit.dueDate < now) {
        await prisma.creditTransaction.update({
          where: { id: credit.id },
          data: { status: 'OVERDUE' }
        })
      }
    }

    return NextResponse.json({ creditTransactions })
  } catch (error) {
    console.error('Get credit transactions error:', error)
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
    const { customerId, transactionId, amount, dueDate, notes } = body

    if (!customerId || !amount) {
      return NextResponse.json(
        { error: 'Customer and amount are required' },
        { status: 400 }
      )
    }

    // Check customer credit limit
    const customer = await prisma.customer.findUnique({
      where: { id: customerId }
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    const newBalance = customer.creditBalance + amount
    if (customer.creditLimit > 0 && newBalance > customer.creditLimit) {
      return NextResponse.json(
        { error: `Credit limit exceeded. Limit: ${customer.creditLimit}, Current: ${customer.creditBalance}` },
        { status: 400 }
      )
    }

    // Create credit transaction
    const creditTransaction = await prisma.creditTransaction.create({
      data: {
        customerId,
        transactionId: transactionId || null,
        amount,
        dueDate: dueDate ? new Date(dueDate) : null,
        notes: notes || null
      },
      include: {
        customer: true,
        transaction: true
      }
    })

    // Update customer credit balance
    await prisma.customer.update({
      where: { id: customerId },
      data: {
        creditBalance: newBalance
      }
    })

    await prisma.auditLog.create({
      data: {
        userId: decoded.userId,
        action: 'CREATE',
        entity: 'CreditTransaction',
        entityId: creditTransaction.id,
        details: `Created credit transaction for ${customer.name}: ${amount}`
      }
    })

    return NextResponse.json(creditTransaction, { status: 201 })
  } catch (error) {
    console.error('Create credit transaction error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
