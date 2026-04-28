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

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    })

    if (user?.role !== 'SUPER_ADMIN' && user?.role !== 'ADMIN' && user?.role !== 'MANAGER') {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 403 }
      )
    }

    // Get all sales users
    const salesUsers = await prisma.user.findMany({
      where: {
        role: 'SALES',
        isActive: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        nrp: true,
        phone: true,
        department: true,
        position: true
      }
    })

    // Get latest location for each sales user
    const salesLocations = await Promise.all(
      salesUsers.map(async (sales) => {
        const latestLocation = await prisma.location.findFirst({
          where: { userId: sales.id },
          orderBy: { createdAt: 'desc' }
        })

        const todayAttendance = await prisma.attendance.findMany({
          where: {
            userId: sales.id,
            createdAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0))
            }
          },
          orderBy: { createdAt: 'asc' }
        })

        const clockIn = todayAttendance.find(a => a.type === 'CLOCK_IN')
        const clockOut = todayAttendance.find(a => a.type === 'CLOCK_OUT')

        return {
          user: sales,
          location: latestLocation,
          attendance: {
            clockIn,
            clockOut,
            status: clockOut ? 'CLOCKED_OUT' : clockIn ? 'CLOCKED_IN' : 'NOT_CLOCKED_IN'
          }
        }
      })
    )

    return NextResponse.json(salesLocations)
  } catch (error: any) {
    console.error('Get sales locations error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
