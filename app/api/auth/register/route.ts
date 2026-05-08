import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { name, nrp, email, password, position, phone } = await request.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Nama, email, dan password wajib diisi' }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'Email sudah terdaftar' }, { status: 409 })
    }

    if (nrp) {
      const existingNrp = await prisma.user.findUnique({ where: { nrp } })
      if (existingNrp) {
        return NextResponse.json({ error: 'NRP sudah terdaftar' }, { status: 409 })
      }
    }

    const hashed = await bcrypt.hash(password, 10)

    await prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
        role: 'SALES',
        nrp: nrp || null,
        position: position || null,
        phone: phone || null,
        isApproved: false, // pending approval
        isActive: false,
      }
    })

    return NextResponse.json(
      { message: 'Registrasi berhasil. Menunggu persetujuan admin.' },
      { status: 201 }
    )
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
