import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { sendEmail, generateDailySalesReport } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Get today's data
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Get transactions
    const transactions = await prisma.transaction.findMany({
      where: {
        createdAt: {
          gte: today,
          lt: tomorrow
        },
        status: 'COMPLETED'
      },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    })

    // Calculate stats
    const totalSales = transactions.reduce((sum, t) => sum + t.total, 0)
    const totalTransactions = transactions.length

    // Top products
    const productSales: { [key: string]: { name: string; quantity: number } } = {}
    transactions.forEach(t => {
      t.items.forEach(item => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = {
            name: item.product.name,
            quantity: 0
          }
        }
        productSales[item.productId].quantity += item.quantity
      })
    })

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5)

    // Payment methods
    const paymentMethods: { [key: string]: number } = {}
    transactions.forEach(t => {
      if (!paymentMethods[t.paymentMethod]) {
        paymentMethods[t.paymentMethod] = 0
      }
      paymentMethods[t.paymentMethod] += t.total
    })

    const reportData = {
      totalSales,
      totalTransactions,
      topProducts,
      paymentMethods
    }

    // Send email
    const emailHtml = generateDailySalesReport(reportData)
    const result = await sendEmail({
      to: email,
      subject: `Daily Sales Report - ${today.toLocaleDateString('id-ID')}`,
      html: emailHtml
    })

    if (result.success) {
      return NextResponse.json({ message: 'Daily report sent successfully' })
    } else {
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Daily report error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
