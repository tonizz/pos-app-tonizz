import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Get single tax setting
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const decoded = verifyToken(token)

    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const taxSetting = await prisma.taxSetting.findUnique({
      where: { id }
    })

    if (!taxSetting) {
      return NextResponse.json({ error: 'Tax setting not found' }, { status: 404 })
    }

    return NextResponse.json(taxSetting)
  } catch (error: any) {
    console.error('Get tax setting error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT - Update tax setting
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

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

    // Check if tax setting exists
    const existing = await prisma.taxSetting.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Tax setting not found' }, { status: 404 })
    }

    // Validate rate
    if (rate !== undefined && (rate < 0 || rate > 100)) {
      return NextResponse.json(
        { error: 'Tax rate must be between 0 and 100' },
        { status: 400 }
      )
    }

    // If setting as active, deactivate others
    if (isActive && !existing.isActive) {
      await prisma.taxSetting.updateMany({
        where: {
          isActive: true,
          id: { not: id }
        },
        data: { isActive: false }
      })
    }

    const taxSetting = await prisma.taxSetting.update({
      where: { id },
      data: {
        name: name || existing.name,
        rate: rate !== undefined ? parseFloat(rate) : existing.rate,
        type: type || existing.type,
        isActive: isActive !== undefined ? isActive : existing.isActive,
        applyToAll: applyToAll !== undefined ? applyToAll : existing.applyToAll,
        categories: categories !== undefined ? categories : existing.categories,
        description: description !== undefined ? description : existing.description
      }
    })

    return NextResponse.json(taxSetting)
  } catch (error: any) {
    console.error('Update tax setting error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - Delete tax setting
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

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

    // Check if tax setting exists
    const existing = await prisma.taxSetting.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Tax setting not found' }, { status: 404 })
    }

    await prisma.taxSetting.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Tax setting deleted successfully' })
  } catch (error: any) {
    console.error('Delete tax setting error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
