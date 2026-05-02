import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { redeemPoints, calculateDiscountFromPoints } from '@/lib/loyalty'

// Redeem points for discount
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
    const { customerId, points } = body

    if (!customerId || !points) {
      return NextResponse.json(
        { error: 'Customer ID and points are required' },
        { status: 400 }
      )
    }

    if (points < 100) {
      return NextResponse.json(
        { error: 'Minimum 100 points required to redeem' },
        { status: 400 }
      )
    }

    // Calculate discount
    const discount = calculateDiscountFromPoints(points)

    // Redeem points
    const reference = `redeem-${Date.now()}`
    await redeemPoints(customerId, points, reference)

    // Get updated customer
    const customer = await prisma.customer.findUnique({
      where: { id: customerId }
    })

    return NextResponse.json({
      message: 'Points redeemed successfully',
      discount,
      pointsRedeemed: points,
      remainingPoints: customer?.points || 0
    })
  } catch (error: any) {
    console.error('Redeem points error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
