import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { hasPermission, Permission } from '@/lib/rbac'

// Get all settings or by category
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
    const category = searchParams.get('category')

    const where: any = {}
    if (category) {
      where.category = category
    }

    const settings = await prisma.settings.findMany({
      where,
      orderBy: { key: 'asc' }
    })

    // Convert to key-value object
    const settingsObject: { [key: string]: any } = {}
    settings.forEach(setting => {
      let value: any = setting.value

      // Parse value based on type
      if (setting.type === 'number') {
        value = parseFloat(setting.value)
      } else if (setting.type === 'boolean') {
        value = setting.value === 'true'
      } else if (setting.type === 'json') {
        try {
          value = JSON.parse(setting.value)
        } catch (e) {
          value = setting.value
        }
      }

      settingsObject[setting.key] = value
    })

    return NextResponse.json(settingsObject)
  } catch (error: any) {
    console.error('Get settings error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Update settings
export async function PUT(request: NextRequest) {
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
    if (!hasPermission(currentUser.role, Permission.MANAGE_SETTINGS)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const updates = body.settings // { key: value, key2: value2, ... }

    if (!updates || typeof updates !== 'object') {
      return NextResponse.json(
        { error: 'Invalid settings format' },
        { status: 400 }
      )
    }

    // Update each setting
    const updatePromises = Object.entries(updates).map(async ([key, value]) => {
      // Convert value to string based on type
      let stringValue: string
      let type = 'string'

      if (typeof value === 'number') {
        stringValue = value.toString()
        type = 'number'
      } else if (typeof value === 'boolean') {
        stringValue = value.toString()
        type = 'boolean'
      } else if (typeof value === 'object') {
        stringValue = JSON.stringify(value)
        type = 'json'
      } else {
        stringValue = String(value)
      }

      // Upsert setting
      return prisma.settings.upsert({
        where: { key },
        update: {
          value: stringValue,
          type,
          updatedAt: new Date()
        },
        create: {
          key,
          value: stringValue,
          type,
          category: getCategoryFromKey(key)
        }
      })
    })

    await Promise.all(updatePromises)

    // Log action
    await prisma.auditLog.create({
      data: {
        userId: decoded.userId,
        action: 'UPDATE',
        entity: 'Settings',
        entityId: 'settings',
        details: `Updated ${Object.keys(updates).length} settings`
      }
    })

    return NextResponse.json({ message: 'Settings updated successfully' })
  } catch (error: any) {
    console.error('Update settings error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to determine category from key
function getCategoryFromKey(key: string): string {
  if (key.startsWith('store_')) return 'store'
  if (key.startsWith('loyalty_')) return 'loyalty'
  if (key.startsWith('receipt_')) return 'receipt'
  if (key.startsWith('system_')) return 'system'
  if (key.startsWith('notification_')) return 'notification'
  return 'general'
}
