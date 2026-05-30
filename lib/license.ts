import jwt from 'jsonwebtoken'

// MASTER_SECRET hanya ada di .env.local developer — JANGAN push ke GitHub
const MASTER_SECRET = process.env.LICENSE_MASTER_SECRET || 'CHANGE_THIS_IN_ENV'

export type FeatureCode =
  | 'pos'
  | 'inventory'
  | 'reports'
  | 'analytics'
  | 'owner_dashboard'
  | 'analytics_hourly'
  | 'purchase_orders'
  | 'loyalty'
  | 'promotions'
  | 'credits'
  | 'attendance'
  | 'jurnal_sync'
  | 'multi_warehouse'
  | 'backup'

// Fitur yang GRATIS tanpa license key
export const FREE_FEATURES: FeatureCode[] = ['pos', 'inventory', 'reports']

export const ALL_FEATURE_LABELS: Record<FeatureCode, string> = {
  pos: 'POS Kasir',
  inventory: 'Inventory',
  reports: 'Laporan',
  analytics: 'Advanced Analytics',
  owner_dashboard: 'Owner Dashboard',
  analytics_hourly: 'Produk Terlaris Per Jam',
  purchase_orders: 'Purchase Order',
  loyalty: 'Loyalty Program',
  promotions: 'Promosi & Voucher',
  credits: 'Kredit / Hutang',
  attendance: 'Absensi Sales',
  jurnal_sync: 'Jurnal.id Sync',
  multi_warehouse: 'Multi Gudang',
  backup: 'Backup Data',
}

export interface LicensePayload {
  customerName: string
  customerId: string
  features: FeatureCode[]
  expiresAt: string | null  // ISO date string, null = lifetime
  issuedAt: string
  licenseType: 'lifetime' | 'subscription'
}

export interface LicenseInfo extends LicensePayload {
  isValid: boolean
  isExpired: boolean
  daysRemaining: number | null
}

/**
 * Generate a license key. Hanya digunakan oleh developer.
 * Butuh LICENSE_MASTER_SECRET di environment.
 */
export function generateLicense(options: {
  customerName: string
  customerId: string
  features: FeatureCode[]
  expiresAt: Date | null
  licenseType: 'lifetime' | 'subscription'
}): string {
  const payload: LicensePayload = {
    customerName: options.customerName,
    customerId: options.customerId,
    features: options.features,
    expiresAt: options.expiresAt ? options.expiresAt.toISOString() : null,
    issuedAt: new Date().toISOString(),
    licenseType: options.licenseType,
  }

  const signOptions: jwt.SignOptions = {}
  if (options.expiresAt) {
    signOptions.expiresIn = Math.floor((options.expiresAt.getTime() - Date.now()) / 1000)
  }

  return jwt.sign(payload, MASTER_SECRET, signOptions)
}

/**
 * Validasi dan decode license key.
 * Return null jika key tidak valid atau expired.
 */
export function validateLicense(key: string): LicenseInfo | null {
  try {
    const decoded = jwt.verify(key, MASTER_SECRET) as LicensePayload
    const now = new Date()
    const isExpired = decoded.expiresAt ? new Date(decoded.expiresAt) < now : false
    const daysRemaining = decoded.expiresAt
      ? Math.max(0, Math.ceil((new Date(decoded.expiresAt).getTime() - now.getTime()) / 86400000))
      : null

    return {
      ...decoded,
      isValid: true,
      isExpired,
      daysRemaining,
    }
  } catch {
    return null
  }
}

/**
 * Decode tanpa verify (untuk tampilan saja, tidak untuk keputusan akses).
 */
export function decodeLicenseUnsafe(key: string): LicensePayload | null {
  try {
    return jwt.decode(key) as LicensePayload
  } catch {
    return null
  }
}

/**
 * Cek apakah suatu fitur aktif berdasarkan license info.
 * Fitur gratis selalu aktif.
 */
export function hasFeature(licenseInfo: LicenseInfo | null, feature: FeatureCode): boolean {
  // Fitur gratis selalu aktif
  if (FREE_FEATURES.includes(feature)) return true
  // Tanpa license → hanya fitur gratis
  if (!licenseInfo || !licenseInfo.isValid || licenseInfo.isExpired) return false
  return licenseInfo.features.includes(feature)
}

/**
 * Parse license key string dan cek fitur (convenience function).
 */
export function checkFeature(licenseKey: string | null | undefined, feature: FeatureCode): boolean {
  if (FREE_FEATURES.includes(feature)) return true
  if (!licenseKey) return false
  const info = validateLicense(licenseKey)
  return hasFeature(info, feature)
}
