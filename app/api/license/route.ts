import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { validateLicense } from '@/lib/license'

// GET — ambil license info yang tersimpan
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const setting = await prisma.settings.findUnique({
      where: { key: 'license_key' },
    })

    if (!setting) {
      return NextResponse.json({ licenseKey: null, licenseInfo: null })
    }

    const licenseInfo = validateLicense(setting.value)
    return NextResponse.json({
      licenseKey: setting.value,
      licenseInfo,
    })
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST — aktivasi license key baru
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    const decoded = token ? verifyToken(token) : null
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Hanya SUPER_ADMIN yang bisa aktivasi license
    if (decoded.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { licenseKey } = body

    if (!licenseKey) {
      return NextResponse.json({ error: 'License key diperlukan' }, { status: 400 })
    }

    // Validasi key
    const licenseInfo = validateLicense(licenseKey)
    if (!licenseInfo || !licenseInfo.isValid) {
      return NextResponse.json({ error: 'License key tidak valid atau sudah expired' }, { status: 400 })
    }
    if (licenseInfo.isExpired) {
      return NextResponse.json({ error: 'License key sudah expired' }, { status: 400 })
    }

    // Simpan ke Settings
    await prisma.settings.upsert({
      where: { key: 'license_key' },
      update: {
        value: licenseKey,
        updatedAt: new Date(),
      },
      create: {
        key: 'license_key',
        value: licenseKey,
        category: 'system',
        type: 'string',
      },
    })

    return NextResponse.json({ success: true, licenseInfo })
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE — hapus license (reset ke mode gratis)
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    const decoded = token ? verifyToken(token) : null
    if (!decoded || decoded.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.settings.deleteMany({ where: { key: 'license_key' } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
