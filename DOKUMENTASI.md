# Dokumentasi Sistem POS & Attendance
**Versi:** 1.0 | **Terakhir diperbarui:** Mei 2026

---

## Daftar Isi
1. [Gambaran Umum Sistem](#1-gambaran-umum-sistem)
2. [Akses & Autentikasi](#2-akses--autentikasi)
3. [Master Data](#3-master-data)
4. [Manajemen Inventory](#4-manajemen-inventory)
5. [Proses Pembelian (Purchase Order)](#5-proses-pembelian-purchase-order)
6. [Point of Sale (Kasir)](#6-point-of-sale-kasir)
7. [Return & Refund](#7-return--refund)
8. [Manajemen Customer & Loyalty](#8-manajemen-customer--loyalty)
9. [Laporan & Analitik](#9-laporan--analitik)
10. [Sistem Absensi Sales](#10-sistem-absensi-sales)
11. [Integrasi Jurnal.id](#11-integrasi-jurnalid)
12. [Manajemen Pengguna](#12-manajemen-pengguna)

---

## 1. Gambaran Umum Sistem

Sistem ini terdiri dari dua komponen utama:

| Komponen | Platform | URL / Lokasi |
|----------|----------|--------------|
| **Web Admin** | Browser (Next.js) | https://pos-app-tau-liard.vercel.app |
| **Aplikasi Sales** | Android APK (Flutter) | `app-release.apk` |

### Arsitektur
```
APK Android (Sales)
      ↕ REST API
Web Admin (Next.js)
      ↕ Prisma ORM
PostgreSQL (Neon Cloud)
      ↕ Cloudinary
Foto Absensi & Kunjungan
      ↕ Mekari API (HMAC)
Jurnal.id (Accounting)
```

---

## 2. Akses & Autentikasi

### Role Pengguna

| Role | Akses |
|------|-------|
| **SUPER_ADMIN** | Semua fitur termasuk manajemen user |
| **ADMIN** | Semua fitur kecuali manajemen user |
| **MANAGER** | Laporan, approval diskon, PO |
| **CASHIER** | POS, transaksi |
| **WAREHOUSE** | Inventory, stock transfer |
| **SALES** | Aplikasi APK (absensi + kunjungan toko) |

### Alur Login Web Admin
```
Buka URL → Masukkan email & password → Dashboard
```

### Alur Registrasi Sales (APK)
```
Buka APK → "Buat Akun Pengguna" → Isi form (nama, email, password, NRP, posisi)
→ Status: Menunggu Persetujuan
→ Admin buka Web → Users → Approval Registrasi → Setujui/Tolak
→ Sales bisa login setelah disetujui
```

### Akun Default
| Email | Password | Role |
|-------|----------|------|
| admin@pos.com | admin123 | SUPER_ADMIN |
| cashier@pos.com | cashier123 | CASHIER |
| sales@pos.com | sales123 | SALES |

---

## 3. Master Data

### 3.1 Kategori Produk

**Hierarki:**
```
Kategori Utama (contoh: Mainan)
  └── Sub-Kategori (contoh: Mainan Remote)
        └── Produk (contoh: Mobil Remote RC)
```

**Alur Pembuatan:**
1. Dashboard → **Categories**
2. Klik **"Tambah Kategori"** → isi nama kategori utama → Tambah
3. Klik **"Tambah Sub-Kategori"** → isi nama → pilih parent → Tambah
4. Atau klik ikon `+` di baris kategori utama untuk langsung tambah sub-kategori

### 3.2 Produk

**Field Wajib:** Nama, SKU, Kategori, Harga Beli, Harga Jual, Satuan

**Field Opsional:** Barcode, Harga Grosir, Deskripsi, Auto Diskon

**Alur Pembuatan:**
1. Dashboard → **Products** → **Add Product**
2. Isi nama produk → pilih kategori (tampil hierarki: `Mainan › Mainan Remote`)
3. SKU di-generate otomatis berdasarkan kategori (bisa diubah manual)
4. Isi harga beli, harga jual, satuan
5. Opsional: scan barcode, isi harga grosir, auto diskon

### 3.3 Gudang (Warehouse)

Digunakan untuk memisahkan stok per lokasi (contoh: Gudang Utama, Toko Cabang A).

### 3.4 Supplier

**Alur Pembuatan:**
1. Dashboard → **Suppliers** → **Add Supplier**
2. Isi nama, telepon, email, alamat

**Fitur Detail Supplier:**
- Klik **"Detail"** di card supplier
- Tab **Riwayat PO** — semua purchase order dari supplier
- Tab **Bayar Hutang** — form pelunasan hutang dengan shortcut 25/50/75/100%

---

## 4. Manajemen Inventory

### 4.1 Stok Produk

**Tampilan Kolom:**
| Kolom | Keterangan |
|-------|-----------|
| Stock | Total stok fisik di gudang |
| Reserved | Stok yang sedang dalam proses transfer (PENDING/IN_TRANSIT) |
| Tersedia | Stock - Reserved = stok yang bisa dijual |
| Min Stock | Batas minimum, jika Tersedia ≤ Min Stock → alert merah |

**Tambah/Kurangi Stok Manual:**
1. Dashboard → **Inventory**
2. Klik `+` (tambah) atau `−` (kurangi) di baris produk
3. Isi jumlah dan keterangan → Simpan

### 4.2 Riwayat Mutasi Stok

1. Dashboard → **Inventory** → Tab **"Riwayat Mutasi"**
2. Menampilkan semua perubahan stok dengan detail:
   - Waktu, Produk, Gudang, Tipe (IN/OUT/TRANSFER/ADJUSTMENT/RETURN)
   - Jumlah (+/-), Referensi (nomor PO/invoice), Keterangan

### 4.3 Stock Transfer (Antar Gudang)

**Alur:**
```
Buat Transfer (PENDING)
      ↓
Start Transfer (IN_TRANSIT) — stok belum berubah, tapi tercatat sebagai Reserved
      ↓
Complete Transfer (COMPLETED) — stok gudang asal berkurang, gudang tujuan bertambah
```

**Catatan:** Stok hanya berubah saat status COMPLETED. Saat PENDING/IN_TRANSIT, stok tampil sebagai "Reserved" di halaman Inventory.

---

## 5. Proses Pembelian (Purchase Order)

### Alur Lengkap
```
DRAFT → PENDING → APPROVED → RECEIVED (atau partial)
                           ↘ CANCELLED
```

| Status | Keterangan |
|--------|-----------|
| DRAFT | PO dibuat, belum dikirim ke supplier |
| PENDING | PO dikirim, menunggu approval |
| APPROVED | PO disetujui, menunggu barang datang |
| RECEIVED | Semua barang diterima, stok bertambah |
| CANCELLED | PO dibatalkan |

### Partial Receiving (Terima Sebagian)
Jika barang datang tidak lengkap:
1. Klik **"Terima Barang"** di PO berstatus APPROVED
2. Modal menampilkan semua item dengan kolom: Dipesan | Diterima | Selisih
3. Ubah qty "Diterima" sesuai barang yang datang
4. Klik **"Konfirmasi Penerimaan"**
   - Jika semua qty terpenuhi → status RECEIVED
   - Jika ada kekurangan → status tetap APPROVED (bisa terima sisanya nanti)
5. Stok langsung bertambah sesuai qty yang diterima

### Efek ke Stok
Saat PO RECEIVED/partial receive:
- Stok produk di gudang tujuan **bertambah** sesuai qty diterima
- Riwayat mutasi tercatat dengan tipe **IN** dan referensi nomor PO

---

## 6. Point of Sale (Kasir)

### Prasyarat
- Shift kasir harus **dibuka** sebelum transaksi
- Pilih gudang yang akan digunakan

### Alur Transaksi
```
Buka Shift → Pilih Gudang → Cari/Scan Produk → Tambah ke Keranjang
→ Atur Qty & Diskon → Pilih Metode Pembayaran → Proses → Cetak Struk
```

### Fitur Kasir
| Fitur | Keterangan |
|-------|-----------|
| **Barcode Scanner** | Scan produk via kamera HP |
| **Multiple Payment** | Bisa bayar dengan beberapa metode sekaligus (Cash + Transfer) |
| **Diskon Transaksi** | Nominal atau persentase, butuh approval jika melebihi batas |
| **Voucher/Promo** | Input kode voucher untuk diskon otomatis |
| **Pajak** | Kalkulasi otomatis (inclusive/exclusive) |
| **Poin Customer** | Poin otomatis bertambah setelah transaksi |
| **Email Struk** | Struk dikirim ke email customer jika ada |

### Shift Management
- **Buka Shift:** Isi saldo awal kas
- **Tutup Shift:** Isi saldo akhir, sistem menghitung selisih
- Semua transaksi terikat ke shift aktif

---

## 7. Return & Refund

### Alur
```
Dashboard → Return/Refund → Cari nomor invoice
→ Pilih item yang di-return + qty
→ Pilih gudang tujuan pengembalian stok
→ Isi alasan return
→ Proses Return
→ Tampil total refund yang harus dikembalikan ke customer
```

### Efek Return
- Stok produk **bertambah** kembali di gudang yang dipilih
- Riwayat mutasi tercatat dengan tipe **RETURN**
- Status transaksi:
  - Semua item di-return → **REFUNDED**
  - Sebagian item di-return → tetap **COMPLETED**

---

## 8. Manajemen Customer & Loyalty

### Member Tier
| Tier | Warna |
|------|-------|
| BRONZE | Default |
| SILVER | Total belanja ≥ threshold |
| GOLD | Total belanja lebih tinggi |
| PLATINUM | Total belanja tertinggi |

Tier naik otomatis berdasarkan total spending.

### Sistem Poin
- Poin dihitung otomatis dari setiap transaksi
- Poin bisa ditukar diskon saat transaksi berikutnya
- Bonus poin: ulang tahun, referral

---

## 9. Laporan & Analitik

### Dashboard
- Total revenue & transaksi hari ini
- Produk stok rendah
- Transaksi terbaru

### Laporan Tersedia
| Laporan | Lokasi |
|---------|--------|
| Laporan Penjualan | Reports → filter tanggal & gudang |
| Riwayat Transaksi | Transactions |
| Mutasi Stok | Inventory → tab Riwayat Mutasi |
| Analitik | Analytics |

### Export
- Export ke Excel (XLSX)
- Export ke PDF

---

## 10. Sistem Absensi Sales (APK Android)

### Alur Harian Sales
```
Buka APK → Login
→ Tab "Absen" → Clock In (foto selfie + GPS otomatis)
→ Tracking rute dimulai otomatis
→ Tab "Kunjungan" → Check-in per toko (nama toko, foto, catatan)
→ Tab "Absen" → Clock Out
→ Rute & kunjungan pending di-sync ke server
```

### Fitur APK
| Fitur | Keterangan |
|-------|-----------|
| **Clock In/Out** | Foto selfie dengan timestamp + alamat GPS |
| **Check-in Toko** | Catat kunjungan per toko dengan foto, lokasi, catatan |
| **Tracking Rute** | Rekam jejak perjalanan otomatis (setiap 30 meter) |
| **Laporan Kunjungan** | Ringkasan harian: jumlah toko, jarak, durasi |
| **Offline Mode** | Data tersimpan lokal jika tidak ada internet, sync saat online |
| **Dark Mode** | Toggle di menu Profil |
| **Notifikasi Reminder** | Pengingat clock in (07:00) dan clock out (17:00) |

### Monitoring di Web Admin
1. Buka `https://pos-app-tau-liard.vercel.app/attendance-admin`
2. Tab **Absensi** — status clock in/out semua sales + peta lokasi real-time
3. Tab **Kunjungan Toko** — semua check-in toko hari ini dengan foto
4. Filter by tanggal
5. Export ke Excel

---

## 11. Integrasi Jurnal.id

### Alur Otomatis
```
Transaksi POS selesai
      ↓ (background, tidak delay kasir)
Kirim Sales Invoice ke Jurnal.id via HMAC API
      ↓
Jurnal.id catat sebagai Sales Invoice
```

### Monitoring Sync
1. Dashboard → **Jurnal Sync**
2. Filter: Semua / Tersinkron / Pending / Error
3. Tombol **Sync** untuk retry transaksi yang gagal
4. Link langsung ke invoice di Jurnal.id

### Status Sync
| Status | Keterangan |
|--------|-----------|
| ✅ Synced | Berhasil dikirim ke Jurnal.id |
| ⏳ Pending | Belum diproses (baru dibuat) |
| ❌ Error | Gagal, bisa di-retry manual |

---

## 12. Manajemen Pengguna

### Tambah User Baru (oleh Admin)
1. Dashboard → **User Management** → **Add User**
2. Isi email, nama, password, role
3. User langsung aktif

### Registrasi Mandiri (Sales via APK)
1. Sales buka APK → **"Buat Akun Pengguna"**
2. Isi form → submit → status **Pending**
3. Admin buka Web → **User Management** → **Approval Registrasi**
4. Klik **Setujui** → akun aktif, sales bisa login
5. Klik **Tolak** → data dihapus

### Approval Registrasi
- Filter: Pending / Disetujui / Semua
- Akses: Dashboard → User Management → Approval Registrasi
- Atau: `/attendance-admin` → tombol **Approval Registrasi**

---

## Catatan Teknis

### Environment Variables (Vercel)
```
DATABASE_URL          — Neon PostgreSQL connection string
JWT_SECRET            — Secret untuk JWT token
JURNAL_CLIENT_ID      — Client ID Mekari/Jurnal.id
JURNAL_CLIENT_SECRET  — Client Secret Mekari/Jurnal.id
CLOUDINARY_*          — Konfigurasi upload foto
```

### Tech Stack
| Layer | Teknologi |
|-------|-----------|
| Web Frontend | Next.js 14, React, TypeScript, Tailwind CSS |
| Web Backend | Next.js API Routes, Prisma ORM |
| Database | PostgreSQL (Neon Cloud) |
| APK | Flutter (Android) |
| Foto | Cloudinary |
| Accounting | Mekari Jurnal.id API |
| Deploy | Vercel (web), APK manual |

---

*Dokumentasi ini mencakup semua fitur yang telah diimplementasikan per Mei 2026.*
