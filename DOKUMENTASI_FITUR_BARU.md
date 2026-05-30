# Dokumentasi Fitur Terbaru — POS App
**Versi:** 2.0 | **Terakhir diperbarui:** 30 Mei 2026

> Dokumen ini mencatat **3 fitur baru** yang ditambahkan pada sesi pengembangan Mei 2026.
> Untuk dokumentasi fitur lama, lihat [DOKUMENTASI.md](./DOKUMENTASI.md).

---

## Daftar Isi

1. [Owner Mobile Dashboard](#1-owner-mobile-dashboard)
2. [Analisis Produk Terlaris Per Jam](#2-analisis-produk-terlaris-per-jam)
3. [Sistem Lisensi Fitur (License Key)](#3-sistem-lisensi-fitur-license-key)
4. [Cara Generate License Key](#4-cara-generate-license-key)
5. [Daftar File Baru](#5-daftar-file-baru)
6. [Paket Harga Rekomendasi](#6-paket-harga-rekomendasi)

---

## 1. Owner Mobile Dashboard

### Apa Ini?
Dashboard khusus untuk **owner / pemilik toko** yang dioptimalkan untuk layar HP.
Dirancang agar bisa dipantau kapan saja, di mana saja, cukup dari HP.

### Cara Akses
- **URL:** `https://pos-app-tau-liard.vercel.app/owner`
- **Atau:** Login → Dashboard → klik tombol **"Owner View"** (ungu) di header
- **Role yang bisa akses:** SUPER_ADMIN, ADMIN, MANAGER
- **Lisensi diperlukan:** `owner_dashboard`

### Fitur di Dalamnya

| Komponen | Keterangan |
|---|---|
| **Jam Real-time** | Jam bergerak setiap detik + tanggal hari ini |
| **Revenue Hari Ini** | Total omzet hari ini + persentase growth vs kemarin |
| **KPI Cards** | Jumlah transaksi, rata-rata per transaksi, jumlah stok kritis |
| **Shift Aktif** | Nama kasir yang sedang buka shift + jam mulai |
| **Mini Chart 7 Hari** | Bar chart omzet 7 hari terakhir (hari ini warna ungu) |
| **Top 5 Produk** | Produk terlaris hari ini berdasarkan qty + progress bar |
| **Transaksi Terbaru** | 5 transaksi terakhir: invoice, customer, kasir, total, waktu |
| **Alert Stok Kritis** | Produk yang qty ≤ minStock (card merah, ada tombol ke Inventory) |
| **Quick Actions** | Tombol Kasir, Laporan, Inventory |
| **Tombol Refresh** | Reload data terbaru tanpa refresh halaman |

### File Terkait
| File | Keterangan |
|---|---|
| `app/owner/page.tsx` | Halaman frontend |
| `app/api/owner-dashboard/route.ts` | API endpoint (1 request, semua data sekaligus) |

---

## 2. Analisis Produk Terlaris Per Jam

### Apa Ini?
Visualisasi interaktif yang menunjukkan **produk mana yang paling laku di jam tertentu**.
Berguna untuk: atur stok sebelum jam ramai, tahu produk andalan per waktu, strategi promosi.

### Cara Akses
- **URL:** `https://pos-app-tau-liard.vercel.app/analytics`
- Scroll ke bawah → section **"Produk Terlaris per Jam"**
- **Lisensi diperlukan:** `analytics`

### Cara Pakai

1. **Jam Selector** — 24 tombol (00–23)
   - Warna oranye tua = jam paling ramai
   - Warna transparan/abu = tidak ada transaksi
   - Jam puncak **otomatis terpilih** saat halaman dibuka

2. **Klik tombol jam** → muncul **Ranking Produk** di jam itu:
   - Nama produk + jumlah qty terjual
   - Revenue per produk
   - Progress bar perbandingan

3. **Heatmap Tabel** (scroll ke bawah):
   - Baris = produk (top 15 terlaris)
   - Kolom = jam (00-23)
   - Kotak makin oranye = makin banyak terjual
   - Hover kotak → tooltip detail
   - Klik kolom jam di heatmap = sama dengan klik tombol jam

### File Terkait
| File | Keterangan |
|---|---|
| `app/analytics/page.tsx` | Halaman frontend (dimodifikasi) |
| `app/api/analytics/top-products-by-hour/route.ts` | API endpoint baru |

---

## 3. Sistem Lisensi Fitur (License Key)

### Apa Ini?
Sistem untuk **mengunci fitur berbayar** di aplikasi. Setiap pelanggan mendapat
**License Key** unik dari Anda (developer). Key tersebut menentukan fitur apa yang bisa diakses.

### Cara Kerja

```
Developer (Anda)                     Pelanggan
────────────────                     ─────────────────────────────
1. Pilih fitur yang dibeli    →
2. Jalankan: npm run license:generate
3. Dapat License Key (JWT)    →      4. Masukkan key di /license
   (signed dengan secret Anda) →     5. App validasi key secara lokal
                               →     6. Fitur terbuka sesuai paket
```

> **Keamanan:** Key berupa JWT yang di-sign dengan `LICENSE_MASTER_SECRET` milik Anda.
> Tanpa secret ini, tidak ada yang bisa membuat key palsu.

### Fitur Gratis (Tanpa Key)
Fitur berikut selalu aktif tanpa perlu license key:
- ✅ **POS Kasir** (`pos`)
- ✅ **Inventory** (`inventory`)
- ✅ **Laporan** (`reports`)

### Semua Fitur Berbayar

| Kode | Nama Fitur | Halaman |
|---|---|---|
| `analytics` | Advanced Analytics | `/analytics` |
| `owner_dashboard` | Owner Dashboard | `/owner` |
| `analytics_hourly` | Produk Per Jam | bagian dari `/analytics` |
| `purchase_orders` | Purchase Order | `/purchase-orders` |
| `loyalty` | Loyalty Program | `/loyalty` |
| `promotions` | Promosi & Voucher | `/promotions` |
| `credits` | Kredit / Hutang | `/credits` |
| `attendance` | Absensi Sales | `/attendance-admin` |
| `jurnal_sync` | Jurnal.id Sync | `/jurnal-sync` |
| `multi_warehouse` | Multi Gudang | `/stock-transfers` |
| `backup` | Backup Data | `/backup` |

### Tampilan Fitur Terkunci
Jika pelanggan membuka halaman yang belum dibeli:
- Muncul halaman **"Fitur Terkunci"** dengan badge PRO
- Penjelasan cara upgrade
- Tombol **"Aktivasi Lisensi"** → redirect ke `/license`

### Halaman Aktivasi Lisensi (`/license`)
- Hanya SUPER_ADMIN yang bisa aktivasi
- Input box untuk paste license key
- Daftar semua fitur: ✅ aktif / 🔒 terkunci
- Tombol hapus lisensi (reset ke mode gratis)

### File Terkait
| File | Keterangan |
|---|---|
| `lib/license.ts` | Core: generate, validate, hasFeature |
| `scripts/generate-license.ts` | Wizard CLI untuk buat key (developer only) |
| `app/api/license/route.ts` | API: GET/POST/DELETE license |
| `app/license/page.tsx` | Halaman aktivasi untuk pelanggan |
| `components/FeatureGuard.tsx` | Component wrapper untuk halaman terkunci |
| `hooks/useLicense.tsx` | React hook + context provider |

---

## 4. Cara Generate License Key

### Persiapan (Sekali Saja)
1. Pastikan file `.env.local` ada di folder project dengan isi:
   ```
   LICENSE_MASTER_SECRET=POS-APP-TONIZZ-MASTER-2026-CHANGE-THIS-TO-SOMETHING-VERY-SECRET
   ```
2. Tambahkan juga di **Vercel** → Settings → Environment Variables:
   - Key: `LICENSE_MASTER_SECRET`
   - Value: (sama dengan di .env.local)

> ⚠️ **PENTING:** Ganti value di atas dengan string acak yang panjang dan unik.
> Simpan baik-baik. Jika hilang, semua key lama tidak bisa divalidasi lagi.

### Langkah Generate Key

```bash
# Jalankan di folder project
npm run license:generate
```

Wizard akan menanyakan:
1. **Nama pelanggan** — contoh: `Toko Maju Jaya`
2. **ID pelanggan** — contoh: `CUST-001`
3. **Pilih paket** — Starter / Business / Enterprise / Custom
4. **Tipe lisensi** — Lifetime atau Berlangganan (dengan tanggal expired)

Output: License key panjang (JWT) yang siap dikirim ke pelanggan.
Key juga disimpan otomatis ke folder `/licenses/` (tidak di-commit ke GitHub).

### Contoh Skenario

**Pelanggan beli paket Business:**
```
npm run license:generate
> Nama pelanggan: Toko Maju Jaya
> ID pelanggan: CUST-001
> Pilih paket: 2 (Business)
> Tipe: 2 (Berlangganan)
> Tanggal expired: 2027-05-30

→ Dapat license key → kirim ke pelanggan via WhatsApp/email
```

**Pelanggan beli fitur tambahan saja:**
```
npm run license:generate
> Nama pelanggan: Toko Maju Jaya
> ID pelanggan: CUST-001
> Pilih paket: 4 (Custom)
> Nomor fitur: 4,5,8 (analytics, owner_dashboard, attendance)
> Tipe: 1 (Lifetime)

→ Dapat license key baru → pelanggan replace key lama
```

---

## 5. Daftar File Baru

### File yang Dibuat (Baru)

```
app/
├── owner/
│   └── page.tsx                          ← Owner Mobile Dashboard
├── license/
│   └── page.tsx                          ← Halaman aktivasi lisensi
└── api/
    ├── owner-dashboard/
    │   └── route.ts                      ← API owner dashboard
    ├── license/
    │   └── route.ts                      ← API license (GET/POST/DELETE)
    └── analytics/
        └── top-products-by-hour/
            └── route.ts                  ← API heatmap produk per jam

components/
└── FeatureGuard.tsx                      ← Component "Fitur Terkunci"

hooks/
└── useLicense.tsx                        ← License context + hook

lib/
└── license.ts                            ← Core license functions

scripts/
└── generate-license.ts                   ← CLI wizard generate key
```

### File yang Dimodifikasi

```
app/
├── layout.tsx          ← Tambah LicenseProvider
├── dashboard/page.tsx  ← Tambah tombol "Owner View"
└── analytics/page.tsx  ← Tambah section Produk Per Jam

package.json            ← Tambah script license:generate
.gitignore              ← Tambah /licenses/ dan .env.local
.env.local              ← Tambah LICENSE_MASTER_SECRET (tidak di-commit)
```

---

## 6. Paket Harga Rekomendasi

| Paket | Fitur | Rekomendasi Harga |
|---|---|---|
| **Starter** (Gratis) | POS, Inventory, Laporan | Gratis / Demo |
| **Business** | + Analytics, Owner Dashboard, PO, Loyalty, Promosi | Rp 500rb – 1jt/bln |
| **Enterprise** | Semua fitur | Rp 1.5jt – 2jt/bln |
| **Add-on Absensi** | Modul absensi sales GPS | Rp 300rb – 500rb/bln |
| **Add-on Jurnal** | Integrasi Jurnal.id | Rp 200rb – 300rb/bln |

> 💡 **Tips:** Buat paket Lifetime dengan harga 10–12x harga bulanan sebagai opsi beli putus.
> Contoh: Business Lifetime = Rp 10jt (setara 10 bulan berlangganan).

---

*Dokumentasi ini dibuat oleh sistem AI pada 30 Mei 2026.*
*Untuk pertanyaan teknis, lihat source code di masing-masing file yang disebutkan di atas.*
