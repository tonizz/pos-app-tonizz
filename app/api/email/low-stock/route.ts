import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { sendEmail, generateLowStockAlert } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || (decoded.role !== 'SUPER_ADMIN' && decoded.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Get low stock products
    const stocks = await prisma.stock.findMany({
      include: {
        product: true
      }
    })

    const lowStockProducts = stocks
      .filter(stock => stock.quantity <= stock.minStock)
      .map(stock => ({
        name: stock.product.name,
        currentStock: stock.quantity,
        minStock: stock.minStock
      }))

    if (lowStockProducts.length === 0) {
      return NextResponse.json({ message: 'No low stock products' })
    }

    // Send email
    const emailHtml = generateLowStockAlert(lowStockProducts)
    const result = await sendEmail({
      to: email,
      subject: `⚠️ Low Stock Alert - ${lowStockProducts.length} Products`,
      html: emailHtml
    })

    if (result.success) {
      return NextResponse.json({
        message: 'Low stock alert sent successfully',
        count: lowStockProducts.length
      })
    } else {
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Low stock alert error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
