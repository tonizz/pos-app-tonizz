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

    const WIB_OFFSET = 7 * 60 * 60 * 1000
    const nowWIB = new Date(Date.now() + WIB_OFFSET)
    const todayStr = nowWIB.toISOString().slice(0, 10) // YYYY-MM-DD in WIB
    const today = new Date(`${todayStr}T00:00:00+07:00`)
    const tomorrow = new Date(`${todayStr}T00:00:00+07:00`)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const attendance = await prisma.attendance.findMany({
      where: {
        userId: decoded.userId,
        createdAt: {
          gte: today,
          lt: tomorrow
        }
      },
      orderBy: { createdAt: 'asc' }
    })

    return NextResponse.json(attendance)
  } catch (error: any) {
    console.error('Get today attendance error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
