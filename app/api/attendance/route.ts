import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

// DELETE - Delete all attendance records (admin only)
export async function DELETE(request: NextRequest) {
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

    // Check if user is super admin
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    })

    if (user?.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Only super admin can delete all attendance' },
        { status: 403 }
      )
    }

    // Delete all attendance records
    const result = await prisma.attendance.deleteMany({})

    // Delete related audit logs
    await prisma.auditLog.deleteMany({
      where: { entity: 'Attendance' }
    })

    // Log this action
    await prisma.auditLog.create({
      data: {
        userId: decoded.userId,
        action: 'DELETE_ALL',
        entity: 'Attendance',
        details: `Deleted all ${result.count} attendance records`
      }
    })

    return NextResponse.json({ 
      message: 'All attendance records deleted',
      count: result.count 
    })
  } catch (error: any) {
    console.error('Delete all attendance error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
