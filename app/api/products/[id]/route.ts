import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

// Update Product
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
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

    const params = await context.params
    const body = await request.json()
    const {
      name,
      sku,
      barcode,
      buyPrice,
      sellPrice,
      wholesalePrice,
      autoDiscount,
      autoDiscountType
    } = body

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id: params.id }
    })

    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Update product
    const product = await prisma.product.update({
      where: { id: params.id },
      data: {
        name,
        sku,
        barcode,
        buyPrice: parseFloat(buyPrice),
        sellPrice: parseFloat(sellPrice),
        wholesalePrice: parseFloat(wholesalePrice),
        autoDiscount: autoDiscount ? parseFloat(autoDiscount) : null,
        autoDiscountType: autoDiscount ? autoDiscountType : null
      }
    })

    // Log the update
    await prisma.auditLog.create({
      data: {
        userId: decoded.userId,
        action: 'UPDATE_PRODUCT',
        entity: 'Product',
        entityId: product.id,
        details: `Updated product ${product.name} (SKU: ${product.sku})`
      }
    })

    return NextResponse.json(product)
  } catch (error: any) {
    console.error('Update product error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// Delete Product
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
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

    const params = await context.params

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id: params.id }
    })

    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Soft delete by setting isActive to false
    const product = await prisma.product.update({
      where: { id: params.id },
      data: { isActive: false }
    })

    // Log the deletion
    await prisma.auditLog.create({
      data: {
        userId: decoded.userId,
        action: 'DELETE_PRODUCT',
        entity: 'Product',
        entityId: product.id,
        details: `Deleted product ${product.name} (SKU: ${product.sku})`
      }
    })

    return NextResponse.json({ message: 'Product deleted successfully' })
  } catch (error: any) {
    console.error('Delete product error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
