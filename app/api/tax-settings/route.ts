import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Get tax settings
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const decoded = verifyToken(token)

    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const taxSettings = await prisma.taxSetting.findMany({
      orderBy: { createdAt: 'desc' }
    })

    // Get active tax setting
    const activeTax = taxSettings.find(t => t.isActive)

    return NextResponse.json({
      taxSettings,
      activeTax: activeTax || null
    })
  } catch (error: any) {
    console.error('Get tax settings error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Create tax setting
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const decoded = verifyToken(token)

    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Check if user has permission
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    })

    if (!user || !['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const {
      name,
      rate,
      type,
      isActive,
      applyToAll,
      categories,
      description
    } = body

    // Validation
    if (!name || rate === undefined || rate === null) {
      return NextResponse.json(
        { error: 'Name and rate are required' },
        { status: 400 }
      )
    }

    if (rate < 0 || rate > 100) {
      return NextResponse.json(
        { error: 'Tax rate must be between 0 and 100' },
        { status: 400 }
      )
    }

    // If setting as active, deactivate others
    if (isActive) {
      await prisma.taxSetting.updateMany({
        where: { isActive: true },
        data: { isActive: false }
      })
    }

    const taxSetting = await prisma.taxSetting.create({
      data: {
        name,
        rate: parseFloat(rate),
        type: type || 'INCLUSIVE',
        isActive: isActive !== undefined ? isActive : true,
        applyToAll: applyToAll !== undefined ? applyToAll : true,
        categories: categories || null,
        description: description || null
      }
    })

    return NextResponse.json(taxSetting, { status: 201 })
  } catch (error: any) {
    console.error('Create tax setting error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
