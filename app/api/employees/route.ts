import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import * as bcrypt from 'bcryptjs'

// GET - List all employees
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

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    })

    if (user?.role !== 'SUPER_ADMIN' && user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 403 }
      )
    }

    const employees = await prisma.user.findMany({
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(employees)
  } catch (error: any) {
    console.error('Get employees error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create new employee
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

    // Validate required fields
    if (!email || !name || !password || !role) {
      return NextResponse.json(
        { error: 'Email, name, password, and role are required' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 400 }
      )
    }

    // Check if NRP already exists
    if (nrp) {
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

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create employee
    const employee = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role,
        nrp,
        phone,
        address,
        department,
        position,
        joinDate: joinDate ? new Date(joinDate) : null,
        isActive: isActive !== undefined ? isActive : true
      },
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
        createdAt: true
      }
    })

    // Log activity
    await prisma.auditLog.create({
      data: {
        userId: decoded.userId,
        action: 'CREATE',
        entity: 'User',
        entityId: employee.id,
        details: `Created employee: ${employee.name}`
      }
    })

    return NextResponse.json(employee, { status: 201 })
  } catch (error: any) {
    console.error('Create employee error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
