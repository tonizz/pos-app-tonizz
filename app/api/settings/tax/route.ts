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

    // Get store settings (should only be one)
    const store = await prisma.store.findFirst()

    if (!store) {
      return NextResponse.json(
        { error: 'Store not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      taxRate: store.taxRate,
      taxInclusive: store.taxInclusive
    })
  } catch (error) {
    console.error('Get tax settings error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
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
    const { taxRate, taxInclusive } = body

    if (taxRate === undefined) {
      return NextResponse.json(
        { error: 'Tax rate is required' },
        { status: 400 }
      )
    }

    // Get store (should only be one)
    const store = await prisma.store.findFirst()

    if (!store) {
      return NextResponse.json(
        { error: 'Store not found' },
        { status: 404 }
      )
    }

    // Update store tax settings
    const updatedStore = await prisma.store.update({
      where: { id: store.id },
      data: {
        taxRate: parseFloat(taxRate.toString()),
        taxInclusive: taxInclusive !== undefined ? taxInclusive : store.taxInclusive
      }
    })

    await prisma.auditLog.create({
      data: {
        userId: decoded.userId,
        action: 'UPDATE',
        entity: 'Store',
        entityId: store.id,
        details: `Updated tax settings: rate=${taxRate}%, inclusive=${taxInclusive}`
      }
    })

    return NextResponse.json({
      taxRate: updatedStore.taxRate,
      taxInclusive: updatedStore.taxInclusive
    })
  } catch (error) {
    console.error('Update tax settings error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
