#!/usr/bin/env tsx
/**
 * License Key Generator — HANYA UNTUK DEVELOPER
 *
 * Cara pakai:
 *   npx tsx scripts/generate-license.ts
 *
 * Butuh: LICENSE_MASTER_SECRET di .env.local
 */

import { generateLicense, FeatureCode, ALL_FEATURE_LABELS, FREE_FEATURES } from '../lib/license'
import * as readline from 'readline'
import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const ask = (q: string): Promise<string> => new Promise(resolve => rl.question(q, resolve))

const ALL_FEATURES: FeatureCode[] = [
  'pos', 'inventory', 'reports', 'analytics', 'owner_dashboard',
  'analytics_hourly', 'purchase_orders', 'loyalty', 'promotions',
  'credits', 'attendance', 'jurnal_sync', 'multi_warehouse', 'backup',
]

const PACKAGES: Record<string, { label: string; features: FeatureCode[] }> = {
  '1': {
    label: 'Starter (Gratis)',
    features: ['pos', 'inventory', 'reports'],
  },
  '2': {
    label: 'Business',
    features: ['pos', 'inventory', 'reports', 'analytics', 'owner_dashboard', 'analytics_hourly', 'purchase_orders', 'loyalty', 'promotions'],
  },
  '3': {
    label: 'Enterprise (Semua Fitur)',
    features: ALL_FEATURES,
  },
  '4': {
    label: 'Custom (Pilih sendiri)',
    features: [],
  },
}

async function main() {
  console.log('\n╔══════════════════════════════════════════════╗')
  console.log('║       POS App — License Key Generator        ║')
  console.log('╚══════════════════════════════════════════════╝\n')

  if (!process.env.LICENSE_MASTER_SECRET || process.env.LICENSE_MASTER_SECRET === 'CHANGE_THIS_IN_ENV') {
    console.error('❌ ERROR: LICENSE_MASTER_SECRET tidak ditemukan di .env.local!')
    console.error('   Tambahkan: LICENSE_MASTER_SECRET=your_secret_key_here')
    process.exit(1)
  }

  // Customer info
  const customerName = await ask('📋 Nama pelanggan: ')
  const customerId = await ask('🆔 ID pelanggan (contoh: CUST-001): ')

  // Package
  console.log('\n📦 Pilih paket:')
  Object.entries(PACKAGES).forEach(([k, v]) => {
    console.log(`   ${k}. ${v.label}`)
  })
  const pkgChoice = (await ask('\nPilih nomor paket (1-4): ')).trim()
  const selectedPkg = PACKAGES[pkgChoice] || PACKAGES['2']

  let features: FeatureCode[] = [...selectedPkg.features]

  if (pkgChoice === '4') {
    console.log('\n✨ Pilih fitur (pisahkan dengan koma):')
    ALL_FEATURES.forEach((f, i) => {
      const isFree = FREE_FEATURES.includes(f)
      console.log(`   ${String(i + 1).padStart(2)}. ${ALL_FEATURE_LABELS[f]}${isFree ? ' (gratis)' : ''}`)
    })
    const featureInput = await ask('\nNomor fitur yang diaktifkan: ')
    const indices = featureInput.split(',').map(s => parseInt(s.trim()) - 1)
    features = indices
      .filter(i => i >= 0 && i < ALL_FEATURES.length)
      .map(i => ALL_FEATURES[i])
    // Tambahkan free features
    FREE_FEATURES.forEach(f => { if (!features.includes(f)) features.push(f) })
  }

  // License type
  console.log('\n⏰ Tipe lisensi:')
  console.log('   1. Lifetime (selamanya)')
  console.log('   2. Berlangganan (ada tanggal expired)')
  const typeChoice = (await ask('\nPilih (1/2): ')).trim()

  let expiresAt: Date | null = null
  let licenseType: 'lifetime' | 'subscription' = 'lifetime'

  if (typeChoice === '2') {
    licenseType = 'subscription'
    const expInput = await ask('📅 Tanggal expired (format: YYYY-MM-DD): ')
    expiresAt = new Date(expInput)
    if (isNaN(expiresAt.getTime())) {
      console.error('❌ Format tanggal tidak valid!')
      process.exit(1)
    }
  }

  // Generate
  const key = generateLicense({ customerName, customerId, features, expiresAt, licenseType })

  console.log('\n╔══════════════════════════════════════════════╗')
  console.log('║           LICENSE KEY BERHASIL DIBUAT         ║')
  console.log('╚══════════════════════════════════════════════╝')
  console.log(`\n👤 Pelanggan : ${customerName} (${customerId})`)
  console.log(`📦 Paket     : ${selectedPkg.label}`)
  console.log(`⏰ Tipe      : ${licenseType === 'lifetime' ? 'Lifetime' : `Berlangganan s/d ${expiresAt?.toLocaleDateString('id-ID')}`}`)
  console.log('\n✅ Fitur aktif:')
  features.forEach(f => console.log(`   • ${ALL_FEATURE_LABELS[f]}`))
  console.log('\n🔑 LICENSE KEY:')
  console.log('─'.repeat(60))
  console.log(key)
  console.log('─'.repeat(60))

  // Simpan ke file
  const outputDir = path.resolve(process.cwd(), 'licenses')
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir)
  const filename = path.join(outputDir, `${customerId}-${Date.now()}.txt`)
  fs.writeFileSync(filename, [
    `Pelanggan  : ${customerName}`,
    `ID         : ${customerId}`,
    `Paket      : ${selectedPkg.label}`,
    `Tipe       : ${licenseType}`,
    `Expired    : ${expiresAt ? expiresAt.toISOString() : 'Lifetime'}`,
    `Generated  : ${new Date().toISOString()}`,
    ``,
    `Fitur Aktif:`,
    ...features.map(f => `  - ${ALL_FEATURE_LABELS[f]}`),
    ``,
    `LICENSE KEY:`,
    key,
  ].join('\n'))
  console.log(`\n💾 Key tersimpan di: ${filename}`)

  rl.close()
}

main().catch(console.error)
