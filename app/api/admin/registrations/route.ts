import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

function adminOnly(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  const decoded = verifyToken(token)
  if (!decoded) return null
  return decoded
}

// GET: List pending registrations
export async function GET(request: NextRequest) {
  const decoded = adminOnly(request)
  if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') // 'pending' | 'approved' | 'all'

  const where: any = { role: 'SALES' }
  if (status === 'pending') where.isApproved = false
  else if (status === 'approved') where.isApproved = true

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true, name: true, email: true, nrp: true,
      position: true, phone: true, isApproved: true,
      isActive: true, createdAt: true,
    },
    orderBy: { createdAt: 'desc' }
  })

  return NextResponse.json(users)
}

// PATCH: Approve or reject
export async function PATCH(request: NextRequest) {
  const decoded = adminOnly(request)
  if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { userId, action } = await request.json() // action: 'approve' | 'reject'

  if (!userId || !['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  if (action === 'approve') {
    await prisma.user.update({
      where: { id: userId },
      data: { isApproved: true, isActive: true }
    })
    return NextResponse.json({ message: 'Akun disetujui' })
  } else {
    await prisma.user.delete({ where: { id: userId } })
    return NextResponse.json({ message: 'Registrasi ditolak dan dihapus' })
  }
}
