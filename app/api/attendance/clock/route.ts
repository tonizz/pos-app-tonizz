import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export const config = {
  api: {
    bodyParser: false,
  },
}

// Clock In/Out
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

    // Check if user is SALES
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    })

    if (user?.role !== 'SALES') {
      return NextResponse.json(
        { error: 'Only sales can use attendance' },
        { status: 403 }
      )
    }

    const formData = await request.formData()
    const type = formData.get('type') as string
    const latitude = parseFloat(formData.get('latitude') as string)
    const longitude = parseFloat(formData.get('longitude') as string)
    const address = formData.get('address') as string
    const photo = formData.get('photo') as File

    if (!type || !latitude || !longitude || !photo) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check today's attendance
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const todayAttendance = await prisma.attendance.findMany({
      where: {
        userId: decoded.userId,
        createdAt: {
          gte: today,
          lt: tomorrow
        }
      },
      orderBy: { createdAt: 'asc' }
    })

    // Validate clock in/out
    if (type === 'CLOCK_IN') {
      const hasClockIn = todayAttendance.some(a => a.type === 'CLOCK_IN')
      if (hasClockIn) {
        return NextResponse.json(
          { error: 'Already clocked in today' },
          { status: 400 }
        )
      }
    } else if (type === 'CLOCK_OUT') {
      const hasClockIn = todayAttendance.some(a => a.type === 'CLOCK_IN')
      const hasClockOut = todayAttendance.some(a => a.type === 'CLOCK_OUT')

      if (!hasClockIn) {
        return NextResponse.json(
          { error: 'Must clock in first' },
          { status: 400 }
        )
      }
      if (hasClockOut) {
        return NextResponse.json(
          { error: 'Already clocked out today' },
          { status: 400 }
        )
      }
    }

    // Save photo
    const bytes = await photo.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Create uploads directory if not exists
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'attendance')
    await mkdir(uploadsDir, { recursive: true })

    // Generate filename
    const timestamp = Date.now()
    const filename = `${decoded.userId}-${timestamp}.jpg`
    const filepath = path.join(uploadsDir, filename)

    await writeFile(filepath, buffer)

    const photoUrl = `/uploads/attendance/${filename}`

    // Create attendance record
    const attendance = await prisma.attendance.create({
      data: {
        userId: decoded.userId,
        type: type as 'CLOCK_IN' | 'CLOCK_OUT',
        photo: photoUrl,
        latitude,
        longitude,
        address: address || null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    // Log activity
    await prisma.auditLog.create({
      data: {
        userId: decoded.userId,
        action: type,
        entity: 'Attendance',
        entityId: attendance.id,
        details: `${type} at ${address || 'Unknown location'}`
      }
    })

    return NextResponse.json(attendance, { status: 201 })
  } catch (error: any) {
    console.error('Attendance error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
