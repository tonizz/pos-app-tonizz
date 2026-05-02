import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { generateReferralCode } from '@/lib/loyalty'

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

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''

    const where: any = {}
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { phone: { contains: search } },
        { email: { contains: search } }
      ]
    }

    const customers = await prisma.customer.findMany({
      where,
      orderBy: { totalSpent: 'desc' }
    })

    return NextResponse.json(customers)
  } catch (error) {
    console.error('Get customers error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

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

    const body = await request.json()
    const { name, phone, email, address, memberTier, birthday } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    // Generate unique referral code
    const referralCode = await generateReferralCode(name)

    const customer = await prisma.customer.create({
      data: {
        name,
        phone,
        email,
        address,
        birthday: birthday ? new Date(birthday) : null,
        referralCode,
        memberTier: memberTier || 'BRONZE'
      }
    })

    await prisma.auditLog.create({
      data: {
        userId: decoded.userId,
        action: 'CREATE',
        entity: 'Customer',
        entityId: customer.id,
        details: `Created customer: ${customer.name}`
      }
    })

    return NextResponse.json(customer, { status: 201 })
  } catch (error) {
    console.error('Create customer error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
