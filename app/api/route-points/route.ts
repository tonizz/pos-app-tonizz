import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

// POST: Upload batch route points dari APK
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const body = await request.json()
    // Terima array points: [{ latitude, longitude, recordedAt }]
    const points: { latitude: number; longitude: number; recordedAt: string }[] = body.points || [body]

    if (!points.length) {
      return NextResponse.json({ error: 'No points provided' }, { status: 400 })
    }

    await prisma.routePoint.createMany({
      data: points.map(p => ({
        userId: decoded.userId,
        latitude: p.latitude,
        longitude: p.longitude,
        recordedAt: new Date(p.recordedAt),
      })),
      skipDuplicates: true,
    })

    return NextResponse.json({ synced: points.length }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// GET: Ambil rute untuk web admin
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
    const userId = searchParams.get('userId')

    const start = new Date(`${date}T00:00:00+07:00`)
    const end = new Date(`${date}T00:00:00+07:00`)
    end.setDate(end.getDate() + 1)

    const where: any = {
      recordedAt: { gte: start, lt: end }
    }
    if (userId) where.userId = userId

    const points = await prisma.routePoint.findMany({
      where,
      orderBy: { recordedAt: 'asc' },
      select: { userId: true, latitude: true, longitude: true, recordedAt: true }
    })

    return NextResponse.json(points)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
