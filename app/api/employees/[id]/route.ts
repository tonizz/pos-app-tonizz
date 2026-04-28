import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import * as bcrypt from 'bcryptjs'

// GET - Get employee by ID
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

    const employee = await prisma.user.findUnique({
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
        updatedAt: true
      }
    })

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    return NextResponse.json(employee)
  } catch (error: any) {
    console.error('Get employee error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update employee
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

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    })

    if (user?.role !== 'SUPER_ADMIN' && user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      email,
      name,
      password,
      role,
      nrp,
      phone,
      address,
      department,
      position,
      joinDate,
      isActive
    } = body

    // Check if employee exists
    const existingEmployee = await prisma.user.findUnique({
      where: { id }
    })

    if (!existingEmployee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    // Check if email is being changed and already exists
    if (email && email !== existingEmployee.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email }
      })

      if (emailExists) {
        return NextResponse.json(
          { error: 'Email already exists' },
          { status: 400 }
        )
      }
    }

    // Check if NRP is being changed and already exists
    if (nrp && nrp !== existingEmployee.nrp) {
      const nrpExists = await prisma.user.findUnique({
        where: { nrp }
      })

      if (nrpExists) {
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

    // Update employee
    const employee = await prisma.user.update({
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
        updatedAt: true
      }
    })

    // Log activity
    await prisma.auditLog.create({
      data: {
        userId: decoded.userId,
        action: 'UPDATE',
        entity: 'User',
        entityId: employee.id,
        details: `Updated employee: ${employee.name}`
      }
    })

    return NextResponse.json(employee)
  } catch (error: any) {
    console.error('Update employee error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete employee
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

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    })

    if (user?.role !== 'SUPER_ADMIN' && user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 403 }
      )
    }

    // Check if employee exists
    const employee = await prisma.user.findUnique({
      where: { id }
    })

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    // Prevent deleting yourself
    if (id === decoded.userId) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      )
    }

    // Delete employee
    await prisma.user.delete({
      where: { id }
    })

    // Log activity
    await prisma.auditLog.create({
      data: {
        userId: decoded.userId,
        action: 'DELETE',
        entity: 'User',
        entityId: id,
        details: `Deleted employee: ${employee.name}`
      }
    })

    return NextResponse.json({ message: 'Employee deleted successfully' })
  } catch (error: any) {
    console.error('Delete employee error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
