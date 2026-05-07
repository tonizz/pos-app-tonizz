import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import cloudinary from '@/lib/cloudinary'

// DELETE - Delete photo from attendance record
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    })

    if (user?.role !== 'SUPER_ADMIN' && user?.role !== 'ADMIN' && user?.role !== 'MANAGER') {
      return NextResponse.json(
        { error: 'Only admin can delete photos' },
        { status: 403 }
      )
    }

    const { id } = await params

    // Get attendance record
    const attendance = await prisma.attendance.findUnique({
      where: { id }
    })

    if (!attendance) {
      return NextResponse.json({ error: 'Attendance not found' }, { status: 404 })
    }

    if (!attendance.photo) {
      return NextResponse.json({ error: 'No photo to delete' }, { status: 400 })
    }

    // Extract public_id from Cloudinary URL
    // URL format: https://res.cloudinary.com/{cloud}/image/upload/v{version}/{folder}/{public_id}.{ext}
    const photoUrl = attendance.photo
    const urlParts = photoUrl.split('/')
    const fileName = urlParts[urlParts.length - 1] // e.g., userId-12345.jpg
    const folder = urlParts[urlParts.length - 2] // e.g., attendance
    const publicId = `${folder}/${fileName.split('.')[0]}` // e.g., attendance/userId-12345

    // Delete from Cloudinary
    try {
      await cloudinary.uploader.destroy(publicId)
    } catch (cloudinaryError) {
      console.error('Cloudinary delete error:', cloudinaryError)
      // Continue even if Cloudinary delete fails
    }

    // Update database - set photo to null
    await prisma.attendance.update({
      where: { id },
      data: { photo: null }
    })

    // Log activity
    await prisma.auditLog.create({
      data: {
        userId: decoded.userId,
        action: 'DELETE_PHOTO',
        entity: 'Attendance',
        entityId: id,
        details: `Deleted photo for ${attendance.type} by ${user.name}`
      }
    })

    return NextResponse.json({ message: 'Photo deleted successfully' })
  } catch (error: any) {
    console.error('Delete photo error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
