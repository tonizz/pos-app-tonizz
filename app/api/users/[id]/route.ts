import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { hasPermission, Permission, canManageRole } from '@/lib/rbac'
import bcrypt from 'bcryptjs'

// Get single user
export async function GET(
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

    const currentUser = await prisma.user.findUnique({
      where: { id: decoded.userId }
    })

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check permission
    if (!hasPermission(currentUser.role, Permission.VIEW_USERS)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        nrp: true,
        phone: true,
        address: true,
        department: true,
        position: true,
        joinDate: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error: any) {
    console.error('Get user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Update user
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

    const currentUser = await prisma.user.findUnique({
      where: { id: decoded.userId }
    })

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check permission
    if (!hasPermission(currentUser.role, Permission.MANAGE_USERS)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { email, name, password, role, nrp, phone, address, department, position, joinDate, isActive } = body

    // Get target user
    const targetUser = await prisma.user.findUnique({
      where: { id }
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if current user can manage the target role
    if (role && !canManageRole(currentUser.role, role)) {
      return NextResponse.json(
        { error: 'You cannot assign this role' },
        { status: 403 }
      )
    }

    if (!canManageRole(currentUser.role, targetUser.role)) {
      return NextResponse.json(
        { error: 'You cannot edit this user' },
        { status: 403 }
      )
    }

    // Check if email already exists (if changing email)
    if (email && email !== targetUser.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email }
      })

      if (existingUser) {
        return NextResponse.json(
          { error: 'Email already exists' },
          { status: 400 }
        )
      }
    }

    // Check if NRP already exists (if changing NRP)
    if (nrp && nrp !== targetUser.nrp) {
      const existingNrp = await prisma.user.findUnique({
        where: { nrp }
      })

      if (existingNrp) {
        return NextResponse.json(
          { error: 'NRP already exists' },
          { status: 400 }
        )
      }
    }

    // Prepare update data
    const updateData: any = {
      email,
      name,
      role,
      nrp,
      phone,
      address,
      department,
      position,
      joinDate: joinDate ? new Date(joinDate) : null,
      isActive
    }

    // Hash password if provided
    if (password) {
      updateData.password = await bcrypt.hash(password, 10)
    }

    // Update user
    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        nrp: true,
        phone: true,
        address: true,
        department: true,
        position: true,
        joinDate: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    // Log action
    await prisma.auditLog.create({
      data: {
        userId: decoded.userId,
        action: 'UPDATE',
        entity: 'User',
        entityId: user.id,
        details: `Updated user: ${user.name} (${user.role})`
      }
    })

    return NextResponse.json(user)
  } catch (error: any) {
    console.error('Update user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Delete user
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

    const currentUser = await prisma.user.findUnique({
      where: { id: decoded.userId }
    })

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check permission
    if (!hasPermission(currentUser.role, Permission.MANAGE_USERS)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Cannot delete yourself
    if (id === decoded.userId) {
      return NextResponse.json(
        { error: 'Cannot delete yourself' },
        { status: 400 }
      )
    }

    // Get target user
    const targetUser = await prisma.user.findUnique({
      where: { id }
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if current user can manage the target role
    if (!canManageRole(currentUser.role, targetUser.role)) {
      return NextResponse.json(
        { error: 'You cannot delete this user' },
        { status: 403 }
      )
    }

    // Soft delete by setting isActive to false
    await prisma.user.update({
      where: { id },
      data: { isActive: false }
    })

    // Log action
    await prisma.auditLog.create({
      data: {
        userId: decoded.userId,
        action: 'DELETE',
        entity: 'User',
        entityId: id,
        details: `Deactivated user: ${targetUser.name} (${targetUser.role})`
      }
    })

    return NextResponse.json({ message: 'User deactivated successfully' })
  } catch (error: any) {
    console.error('Delete user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
