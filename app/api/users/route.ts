import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { hasPermission, Permission, canManageRole } from '@/lib/rbac'
import bcrypt from 'bcryptjs'

// Get all users
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

    // Get current user to check permissions
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

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''

    const where: any = {}
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { nrp: { contains: search, mode: 'insensitive' } }
      ]
    }

    const users = await prisma.user.findMany({
      where,
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
        // Don't return password
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(users)
  } catch (error: any) {
    console.error('Get users error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Create new user
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

    // Get current user to check permissions
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
    const { email, name, password, role, nrp, phone, address, department, position, joinDate } = body

    if (!email || !name || !password || !role) {
      return NextResponse.json(
        { error: 'Email, name, password, and role are required' },
        { status: 400 }
      )
    }

    // Check if current user can manage the target role
    if (!canManageRole(currentUser.role, role)) {
      return NextResponse.json(
        { error: 'You cannot create users with this role' },
        { status: 403 }
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

    // Create user
    const user = await prisma.user.create({
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
        isActive: true
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
        createdAt: true,
        updatedAt: true,
      }
    })

    // Log action
    await prisma.auditLog.create({
      data: {
        userId: decoded.userId,
        action: 'CREATE',
        entity: 'User',
        entityId: user.id,
        details: `Created user: ${user.name} (${user.role})`
      }
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error: any) {
    console.error('Create user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
