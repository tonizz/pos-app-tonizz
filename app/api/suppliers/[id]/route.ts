import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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
    const { name, phone, email, address } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Supplier name is required' },
        { status: 400 }
      )
    }

    const supplier = await prisma.supplier.update({
      where: { id: id },
      data: {
        name,
        phone: phone || null,
        email: email || null,
        address: address || null
      }
    })

    await prisma.auditLog.create({
      data: {
        userId: decoded.userId,
        action: 'UPDATE',
        entity: 'Supplier',
        entityId: supplier.id,
        details: `Updated supplier: ${supplier.name}`
      }
    })

    return NextResponse.json(supplier)
  } catch (error) {
    console.error('Update supplier error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Check if supplier has products
    const supplier = await prisma.supplier.findUnique({
      where: { id: id },
      include: {
        _count: {
          select: { products: true }
        }
      }
    })

    if (!supplier) {
      return NextResponse.json(
        { error: 'Supplier not found' },
        { status: 404 }
      )
    }

    if (supplier._count.products > 0) {
      return NextResponse.json(
        { error: 'Cannot delete supplier with associated products. Please remove products first.' },
        { status: 400 }
      )
    }

    await prisma.supplier.delete({
      where: { id: id }
    })

    await prisma.auditLog.create({
      data: {
        userId: decoded.userId,
        action: 'DELETE',
        entity: 'Supplier',
        entityId: id,
        details: `Deleted supplier: ${supplier.name}`
      }
    })

    return NextResponse.json({ message: 'Supplier deleted successfully' })
  } catch (error) {
    console.error('Delete supplier error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
