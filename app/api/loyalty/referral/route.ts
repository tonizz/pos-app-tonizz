import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { processReferral } from '@/lib/loyalty'

// Process referral bonus
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
    const { customerId, referralCode } = body

    if (!customerId || !referralCode) {
      return NextResponse.json(
        { error: 'Customer ID and referral code are required' },
        { status: 400 }
      )
    }

    await processReferral(customerId, referralCode)

    return NextResponse.json({
      message: 'Referral bonus processed successfully'
    })
  } catch (error: any) {
    console.error('Process referral error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
