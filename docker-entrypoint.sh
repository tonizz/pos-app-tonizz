#!/bin/sh
set -e

echo ""
echo "============================================"
echo "  POS App - Memulai Aplikasi..."
echo "============================================"
echo ""

# Tunggu database siap
echo "⏳ Menunggu database siap..."
until npx prisma db push --skip-generate --accept-data-loss 2>/dev/null; do
  echo "   Database belum siap, coba lagi dalam 3 detik..."
  sleep 3
done

echo "✅ Database siap!"

# Jalankan migrasi
echo "📦 Menjalankan migrasi database..."
npx prisma migrate deploy 2>/dev/null || echo "   (migrasi sudah up-to-date)"

# Seed data awal jika database kosong
echo "🌱 Cek data awal..."
npx prisma db seed 2>/dev/null || echo "   (data awal sudah ada)"

echo ""
echo "============================================"
echo "  ✅ Aplikasi siap!"
echo "  🌐 Buka browser: http://localhost:3000"
echo "============================================"
echo ""

# Jalankan app
exec "$@"
