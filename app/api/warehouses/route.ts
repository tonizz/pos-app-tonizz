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

    const warehouses = await prisma.warehouse.findMany({
      include: {
        _count: {
          select: { stocks: true }
        }
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json(warehouses)
  } catch (error) {
    console.error('Get warehouses error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

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
    const { name, address, isMain } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    const warehouse = await prisma.warehouse.create({
      data: {
        name,
        address,
        isMain: isMain || false
      }
    })

    await prisma.auditLog.create({
      data: {
        userId: decoded.userId,
        action: 'CREATE',
        entity: 'Warehouse',
        entityId: warehouse.id,
        details: `Created warehouse: ${warehouse.name}`
      }
    })

    return NextResponse.json(warehouse, { status: 201 })
  } catch (error) {
    console.error('Create warehouse error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
