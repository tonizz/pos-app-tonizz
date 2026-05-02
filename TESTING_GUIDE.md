# 🧪 PANDUAN TESTING - FASE 2 PRIORITY 2

**Server**: http://localhost:3000
**Date**: 2026-05-01

---

## 📋 PERSIAPAN TESTING

### 1. Login ke Aplikasi
1. Buka browser: **http://localhost:3000**
2. Klik "Login" atau langsung ke **http://localhost:3000/login**
3. Login dengan akun Admin:
   - Email: `admin@pos.com`
   - Password: `admin123`
4. Anda akan masuk ke Dashboard

---

## ✅ TEST 1: CATEGORY MANAGEMENT (Bonus Feature)

### Tujuan
Memastikan sistem kategori berfungsi dengan baik sebelum menambah produk.

### Langkah Testing

**A. Lihat Kategori yang Ada**
1. Dari Dashboard, klik tombol **"Categories"** (warna kuning)
2. Anda akan melihat daftar kategori yang sudah ada (dari seed data)
3. Perhatikan kolom: Name, Parent Category, Products, Sub-categories

**B. Tambah Kategori Baru (Main Category)**
1. Klik tombol **"Add Category"** (kanan atas)
2. Isi form:
   - Name: `Elektronik`
   - Parent Category: `(None - Main Category)`
3. Klik **"Add Category"**
4. ✅ **Expected**: Toast success muncul, kategori baru muncul di list

**C. Tambah Sub-Category**
1. Klik tombol **"Add Category"** lagi
2. Isi form:
   - Name: `Smartphone`
   - Parent Category: `Elektronik` (pilih dari dropdown)
3. Klik **"Add Category"**
4. ✅ **Expected**: Sub-category muncul dengan parent "Elektronik"

**D. Edit Kategori**
1. Cari kategori "Smartphone"
2. Klik tombol **"Edit"** (icon pensil)
3. Ubah name menjadi: `Handphone`
4. Klik **"Update Category"**
5. ✅ **Expected**: Nama berubah menjadi "Handphone"

**E. Coba Delete Kategori dengan Produk**
1. Cari kategori yang memiliki produk (lihat kolom Products > 0)
2. Klik tombol **"Delete"** (icon trash)
3. ✅ **Expected**: Error muncul "Cannot delete category with products"

**F. Delete Kategori Kosong**
1. Cari kategori "Handphone" (yang baru dibuat, belum ada produk)
2. Klik tombol **"Delete"**
3. Konfirmasi delete
4. ✅ **Expected**: Kategori terhapus

**G. Search Kategori**
1. Ketik di search box: `Makanan`
2. ✅ **Expected**: Hanya kategori yang mengandung "Makanan" yang muncul

---

## ✅ TEST 2: SUPPLIER MANAGEMENT

### Tujuan
Memastikan CRUD supplier berfungsi dengan baik.

### Langkah Testing

**A. Lihat Halaman Suppliers**
1. Dari Dashboard, klik tombol **"Suppliers"** (warna hijau emerald)
2. Anda akan melihat daftar supplier dalam bentuk card

**B. Tambah Supplier Baru**
1. Klik tombol **"Add Supplier"** (kanan atas)
2. Isi form:
   - Name: `PT Maju Jaya`
   - Phone: `081234567890`
   - Email: `majujaya@example.com`
   - Address: `Jl. Raya No. 123, Jakarta`
3. Klik **"Add Supplier"**
4. ✅ **Expected**: Toast success, supplier baru muncul di list

**C. Edit Supplier**
1. Cari supplier "PT Maju Jaya"
2. Klik tombol **"Edit"**
3. Ubah phone menjadi: `081234567899`
4. Klik **"Update Supplier"**
5. ✅ **Expected**: Phone number berubah

**D. Search Supplier**
1. Ketik di search box: `Maju`
2. ✅ **Expected**: Hanya supplier "PT Maju Jaya" yang muncul

**E. Delete Supplier**
1. Klik tombol **"Delete"** pada supplier "PT Maju Jaya"
2. Konfirmasi delete
3. ✅ **Expected**: Supplier terhapus (karena belum ada produk terkait)

---

## ✅ TEST 3: STOCK TRANSFER SYSTEM

### Tujuan
Memastikan transfer stok antar gudang berfungsi dengan workflow yang benar.

### Langkah Testing

**A. Lihat Halaman Stock Transfers**
1. Dari Dashboard, klik tombol **"Stock Transfer"** (warna violet)
2. Anda akan melihat daftar transfer (jika ada)

**B. Buat Transfer Baru**
1. Klik tombol **"New Transfer"** (kanan atas)
2. Isi form:
   - From Warehouse: `Main Warehouse` (pilih dari dropdown)
   - To Warehouse: Pilih gudang lain (jika ada, atau buat dulu di Inventory)
   - Notes: `Transfer untuk testing`
3. Klik **"Add Item"**
4. Pilih produk yang ada stoknya di Main Warehouse
5. Isi quantity: `5` (pastikan tidak melebihi stok yang tersedia)
6. Klik **"Create Transfer"**
7. ✅ **Expected**: Transfer dibuat dengan status **PENDING**

**C. Update Status Transfer**
1. Cari transfer yang baru dibuat
2. Klik tombol **"Mark In Transit"**
3. ✅ **Expected**: Status berubah menjadi **IN_TRANSIT**
4. Klik tombol **"Mark Completed"**
5. ✅ **Expected**: 
   - Status berubah menjadi **COMPLETED**
   - Stok di gudang asal berkurang
   - Stok di gudang tujuan bertambah

**D. Cek Stock Movement**
1. Pergi ke halaman **"Inventory"**
2. Cari produk yang ditransfer
3. ✅ **Expected**: Ada record stock movement untuk transfer tersebut

**E. Search Transfer**
1. Ketik di search box: nomor transfer (contoh: `TRF-`)
2. ✅ **Expected**: Transfer yang dicari muncul

**F. Filter by Status**
1. Pilih filter status: `COMPLETED`
2. ✅ **Expected**: Hanya transfer dengan status COMPLETED yang muncul

---

## ✅ TEST 4: PURCHASE ORDER SYSTEM

### Tujuan
Memastikan sistem PO dari supplier berfungsi dengan auto-update stok.

### Langkah Testing

**A. Lihat Halaman Purchase Orders**
1. Dari Dashboard, klik tombol **"Purchase Orders"** (warna lime)
2. Anda akan melihat daftar PO (jika ada)

**B. Buat PO Baru**
1. Klik tombol **"New Purchase Order"** (kanan atas)
2. Isi form:
   - Supplier: Pilih supplier yang ada
   - Warehouse: `Main Warehouse`
   - Expected Delivery: Pilih tanggal (contoh: 7 hari dari sekarang)
   - Notes: `PO untuk testing`
3. Klik **"Add Item"**
4. Pilih produk dari dropdown
5. Isi:
   - Quantity: `10`
   - Buy Price: Akan auto-fill dari produk (bisa diubah)
6. Perhatikan **Subtotal** otomatis terhitung
7. Tambah item lain jika mau (klik "Add Item" lagi)
8. Klik **"Create Purchase Order"**
9. ✅ **Expected**: PO dibuat dengan status **DRAFT**

**C. Update Status PO (Workflow)**
1. Cari PO yang baru dibuat
2. Klik tombol **"Submit"**
3. ✅ **Expected**: Status berubah menjadi **PENDING**
4. Klik tombol **"Approve"**
5. ✅ **Expected**: Status berubah menjadi **APPROVED**
6. Klik tombol **"Mark Received"**
7. ✅ **Expected**: 
   - Status berubah menjadi **RECEIVED**
   - Stok produk di warehouse bertambah sesuai quantity PO
   - Stock movement tercatat

**D. Cek Stok Setelah PO Received**
1. Pergi ke halaman **"Inventory"**
2. Cari produk yang ada di PO
3. ✅ **Expected**: Stok bertambah sesuai quantity PO

**E. Search PO**
1. Ketik di search box: nomor PO (contoh: `PO-`)
2. ✅ **Expected**: PO yang dicari muncul

**F. Filter by Status**
1. Pilih filter status: `RECEIVED`
2. ✅ **Expected**: Hanya PO dengan status RECEIVED yang muncul

---

## ✅ TEST 5: CUSTOMER CREDIT/HUTANG SYSTEM

### Tujuan
Memastikan sistem kredit pelanggan berfungsi dengan tracking pembayaran.

### Langkah Testing

**A. Setup Credit Limit Customer**
1. Dari Dashboard, klik tombol **"Customers"**
2. Pilih customer atau buat customer baru
3. Edit customer
4. Set **Credit Limit**: `10000000` (Rp 10 juta)
5. Save
6. ✅ **Expected**: Credit limit tersimpan

**B. Lihat Halaman Credits**
1. Dari Dashboard, klik tombol **"Credits"** (warna rose/pink)
2. Anda akan melihat daftar credit transactions

**C. Buat Credit Transaction Baru**
1. Klik tombol **"Add Credit"** (kanan atas)
2. Isi form:
   - Customer: Pilih customer yang sudah ada credit limit
   - Amount: `5000000` (Rp 5 juta)
   - Due Date: Pilih tanggal (contoh: 30 hari dari sekarang)
   - Notes: `Kredit untuk testing`
3. Klik **"Create Credit"**
4. ✅ **Expected**: 
   - Credit transaction dibuat dengan status **UNPAID**
   - Customer credit balance bertambah Rp 5 juta

**D. Validasi Credit Limit**
1. Coba buat credit lagi untuk customer yang sama
2. Isi amount: `6000000` (Rp 6 juta)
3. ✅ **Expected**: Error muncul "Exceeds credit limit" (karena total akan jadi 11 juta, melebihi limit 10 juta)

**E. Process Payment (Partial)**
1. Cari credit transaction yang baru dibuat
2. Klik tombol **"Process Payment"**
3. Isi form:
   - Amount: `2000000` (Rp 2 juta - partial payment)
   - Payment Method: `CASH`
   - Reference: `TRX-001`
   - Notes: `Pembayaran pertama`
4. Klik **"Process Payment"**
5. ✅ **Expected**: 
   - Status berubah menjadi **PARTIAL**
   - Remaining balance: Rp 3 juta
   - Customer credit balance berkurang Rp 2 juta
   - Payment history muncul

**F. Process Payment (Full)**
1. Klik tombol **"Process Payment"** lagi
2. Isi amount: `3000000` (Rp 3 juta - sisa hutang)
3. Payment Method: `BANK_TRANSFER`
4. Klik **"Process Payment"**
5. ✅ **Expected**: 
   - Status berubah menjadi **PAID**
   - Remaining balance: Rp 0
   - Customer credit balance menjadi 0
   - Paid date tercatat

**G. Cek Overdue Detection**
1. Buat credit baru dengan due date kemarin (sudah lewat)
2. ✅ **Expected**: Status otomatis menjadi **OVERDUE** (dengan icon merah)

**H. Search Credit**
1. Ketik di search box: nama customer
2. ✅ **Expected**: Credit transactions customer tersebut muncul

**I. Filter by Status**
1. Pilih filter status: `PAID`
2. ✅ **Expected**: Hanya credit dengan status PAID yang muncul

---

## ✅ TEST 6: TAX CALCULATION SYSTEM

### Tujuan
Memastikan sistem pajak berfungsi dengan mode Exclusive dan Inclusive.

### Langkah Testing

**A. Lihat Tax Settings**
1. Dari Dashboard, klik tombol **"Tax Settings"** (warna sky blue)
2. Anda akan melihat form tax settings

**B. Set Tax Rate (Tax Exclusive)**
1. Isi **Tax Rate**: `11` (untuk PPN 11%)
2. Pilih mode: **Tax Exclusive** (tax ditambahkan di atas harga)
3. Perhatikan **Example Calculation**:
   - Base Price: Rp 100,000
   - Tax (11%): Rp 11,000
   - Total: Rp 111,000
4. Klik **"Save Settings"**
5. ✅ **Expected**: Settings tersimpan, toast success muncul

**C. Test Tax Exclusive di POS**
1. Pergi ke halaman **"POS"** (kasir)
2. Tambahkan produk dengan harga Rp 100,000
3. ✅ **Expected**: 
   - Subtotal: Rp 100,000
   - Tax (11%): Rp 11,000
   - Total: Rp 111,000

**D. Set Tax Rate (Tax Inclusive)**
1. Kembali ke **"Tax Settings"**
2. Ubah mode menjadi: **Tax Inclusive** (harga sudah termasuk pajak)
3. Perhatikan **Example Calculation**:
   - Total Price: Rp 100,000
   - Net Price: Rp 90,090
   - Tax (11%): Rp 9,910
4. Klik **"Save Settings"**
5. ✅ **Expected**: Settings tersimpan

**E. Test Tax Inclusive di POS**
1. Pergi ke halaman **"POS"** (kasir)
2. Tambahkan produk dengan harga Rp 100,000
3. ✅ **Expected**: 
   - Total: Rp 100,000 (harga sudah termasuk pajak)
   - Net Price: Rp 90,090
   - Tax (11%): Rp 9,910

**F. Test Different Tax Rates**
1. Kembali ke **"Tax Settings"**
2. Coba ubah tax rate menjadi: `10` (10%)
3. Save dan cek example calculation
4. ✅ **Expected**: Perhitungan berubah sesuai rate baru

**G. Test Zero Tax**
1. Set tax rate menjadi: `0` (no tax)
2. Save
3. Test di POS
4. ✅ **Expected**: Tidak ada pajak yang ditambahkan

---

## 🎯 INTEGRATION TEST (End-to-End)

### Skenario: Complete Business Flow

**1. Setup Awal**
- Login sebagai Admin
- Buat kategori baru: `Gadget`
- Buat supplier baru: `PT Tech Supplier`
- Set tax rate: 11% (Tax Exclusive)

**2. Purchase Order Flow**
- Buat PO dari PT Tech Supplier
- Order 20 unit produk "Laptop" @ Rp 5,000,000
- Submit → Approve → Mark Received
- ✅ Cek stok Laptop bertambah 20 unit

**3. Stock Transfer Flow**
- Transfer 10 unit Laptop dari Main Warehouse ke Warehouse lain
- Mark In Transit → Mark Completed
- ✅ Cek stok di kedua warehouse

**4. Sales with Credit**
- Buat customer baru dengan credit limit Rp 50 juta
- Buat credit transaction Rp 20 juta
- Process payment Rp 10 juta (partial)
- ✅ Cek status PARTIAL dan remaining balance

**5. POS Transaction with Tax**
- Jual 1 unit Laptop (Rp 5,000,000)
- ✅ Cek tax calculation (11% = Rp 550,000)
- ✅ Total: Rp 5,550,000
- Complete transaction
- ✅ Cek stok berkurang 1 unit

**6. Reports & Analytics**
- Pergi ke halaman Reports
- Filter by today
- ✅ Cek revenue, profit, transactions
- Export to PDF
- Export to Excel

---

## 📊 CHECKLIST TESTING

### Category Management
- [ ] View categories
- [ ] Add main category
- [ ] Add sub-category
- [ ] Edit category
- [ ] Delete validation (with products)
- [ ] Delete empty category
- [ ] Search categories

### Supplier Management
- [ ] View suppliers
- [ ] Add supplier
- [ ] Edit supplier
- [ ] Delete supplier
- [ ] Search suppliers

### Stock Transfer
- [ ] Create transfer
- [ ] Update status (PENDING → IN_TRANSIT → COMPLETED)
- [ ] Stock auto-update
- [ ] Stock movement tracking
- [ ] Search transfers
- [ ] Filter by status

### Purchase Order
- [ ] Create PO
- [ ] Update status (DRAFT → PENDING → APPROVED → RECEIVED)
- [ ] Stock auto-update when received
- [ ] Stock movement tracking
- [ ] Search POs
- [ ] Filter by status

### Customer Credit
- [ ] Set customer credit limit
- [ ] Create credit transaction
- [ ] Credit limit validation
- [ ] Process partial payment
- [ ] Process full payment
- [ ] Status updates (UNPAID → PARTIAL → PAID)
- [ ] Overdue detection
- [ ] Search credits
- [ ] Filter by status

### Tax Calculation
- [ ] Set tax rate
- [ ] Tax Exclusive mode
- [ ] Tax Inclusive mode
- [ ] Example calculation accuracy
- [ ] Tax in POS transactions
- [ ] Zero tax

---

## 🐛 COMMON ISSUES & SOLUTIONS

### Issue 1: Server tidak running
**Solution**: 
```bash
cd C:\script\pos-app
npm run dev
```

### Issue 2: Database error
**Solution**: 
```bash
npm run prisma:generate
npm run prisma:migrate
```

### Issue 3: Data tidak muncul
**Solution**: 
```bash
npm run prisma:seed
```

### Issue 4: Port 3000 sudah digunakan
**Solution**: 
- Stop process yang menggunakan port 3000
- Atau ubah port di package.json

---

## ✅ HASIL TESTING YANG DIHARAPKAN

Setelah semua testing selesai, Anda harus bisa:

1. ✅ Mengelola kategori dengan parent/child
2. ✅ Mengelola supplier dengan CRUD lengkap
3. ✅ Transfer stok antar gudang dengan workflow
4. ✅ Membuat PO dan auto-update stok saat received
5. ✅ Mengelola kredit pelanggan dengan payment tracking
6. ✅ Mengatur pajak dengan 2 mode (Exclusive/Inclusive)
7. ✅ Semua fitur terintegrasi dengan baik
8. ✅ Tidak ada error di console browser
9. ✅ Tidak ada error di terminal server

---

## 📞 SUPPORT

Jika menemukan bug atau error:
1. Cek console browser (F12)
2. Cek terminal server
3. Screenshot error
4. Catat langkah-langkah yang menyebabkan error

---

**Happy Testing! 🎉**

**Last Updated**: 2026-05-01
**FASE 2 Priority 2**: 100% Complete
