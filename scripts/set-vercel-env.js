const { spawnSync } = require('child_process')

const secret = 'POS-APP-TONIZZ-MASTER-2026-X9kQmR7vNpL3wE8sY4jF6hD1bA5cU0tG'

// Verifikasi tidak ada BOM
const buf = Buffer.from(secret, 'utf8')
console.log('Panjang secret:', buf.length)
console.log('Byte pertama (hex):', buf[0].toString(16), '(harus 50 = P, bukan EF)')
console.log('3 karakter pertama:', secret.substring(0, 3))

// Gunakan shell: true agar .cmd bisa jalan di Windows
const result = spawnSync(
  'vercel',
  ['env', 'add', 'LICENSE_MASTER_SECRET', 'production'],
  {
    input: secret,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
    cwd: process.cwd(),
    shell: true,
  }
)

console.log('stdout:', result.stdout)
if (result.stderr) console.log('stderr:', result.stderr)
console.log('status:', result.status)
if (result.error) console.log('error:', result.error.message)
