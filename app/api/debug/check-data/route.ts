import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Get all users
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        nrp: true
      }
    })

    // Get sales users specifically
    const salesUsers = await prisma.user.findMany({
      where: {
        role: 'SALES'
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        nrp: true
      }
    })

    // Get all attendance records
    const allAttendance = await prisma.attendance.findMany({
      take: 10,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            role: true
          }
        }
      }
    })

    // Get attendance with photos
    const attendanceWithPhotos = await prisma.attendance.findMany({
      where: {
        photo: {
          not: null
        }
      },
      take: 10,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            role: true
          }
        }
      }
    })

    return NextResponse.json({
      summary: {
        totalUsers: allUsers.length,
        totalSalesUsers: salesUsers.length,
        activeSalesUsers: salesUsers.filter(u => u.isActive).length,
        totalAttendance: allAttendance.length,
        attendanceWithPhotos: attendanceWithPhotos.length
      },
      allUsers,
      salesUsers,
      recentAttendance: allAttendance,
      attendanceWithPhotos
    })
  } catch (error: any) {
    console.error('Debug check error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
