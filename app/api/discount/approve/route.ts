import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword } from '@/lib/auth'

// Approve Manual Discount
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password, discountPercentage } = body

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      )
    }

    // Find user by email (username)
    const user = await prisma.user.findUnique({
      where: { email: username }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Check if user has permission (SPV, Manager, Admin)
    const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'MANAGER']
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json(
        { error: 'You do not have permission to approve discounts' },
        { status: 403 }
      )
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password)
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Log approval
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'APPROVE_DISCOUNT',
        entity: 'Transaction',
        details: `Approved manual discount of ${discountPercentage}%`
      }
    })

    return NextResponse.json({
      approved: true,
      approvedBy: {
        id: user.id,
        name: user.name,
        role: user.role
      }
    })
  } catch (error: any) {
    console.error('Approve discount error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
