import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import cloudinary from '@/lib/cloudinary'

// POST: Upload kunjungan dari APK
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const contentType = request.headers.get('content-type') || ''

    let storeName: string, storeAddress: string | null, latitude: number,
      longitude: number, notes: string | null, visitTime: Date, photoUrl: string | null = null

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      storeName = formData.get('storeName') as string
      storeAddress = formData.get('storeAddress') as string | null
      latitude = parseFloat(formData.get('latitude') as string)
      longitude = parseFloat(formData.get('longitude') as string)
      notes = formData.get('notes') as string | null
      visitTime = new Date(formData.get('visitTime') as string)
      const photo = formData.get('photo') as File | null

      if (photo) {
        const bytes = await photo.arrayBuffer()
        const base64 = `data:${photo.type};base64,${Buffer.from(bytes).toString('base64')}`
        const result = await cloudinary.uploader.upload(base64, {
          folder: 'store_visits',
          public_id: `${decoded.userId}-${Date.now()}`,
        })
        photoUrl = result.secure_url
      }
    } else {
      const body = await request.json()
      storeName = body.storeName
      storeAddress = body.storeAddress ?? null
      latitude = body.latitude
      longitude = body.longitude
      notes = body.notes ?? null
      visitTime = new Date(body.visitTime)
    }

    if (!storeName || !latitude || !longitude || !visitTime) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const visit = await prisma.storeVisit.create({
      data: {
        userId: decoded.userId,
        storeName,
        storeAddress,
        latitude,
        longitude,
        photoUrl,
        notes,
        visitTime,
      }
    })

    return NextResponse.json(visit, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// GET: Ambil kunjungan untuk web admin
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
      visitTime: { gte: start, lt: end }
    }
    if (userId) where.userId = userId

    const visits = await prisma.storeVisit.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, nrp: true, position: true } }
      },
      orderBy: { visitTime: 'asc' }
    })

    return NextResponse.json(visits)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
