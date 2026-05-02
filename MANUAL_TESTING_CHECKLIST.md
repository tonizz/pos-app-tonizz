# 🧪 Manual Testing Checklist - POS Application

**Date:** 2026-05-01  
**Time:** 07:31 WIB  
**Status:** IN PROGRESS  
**Tester:** User

---

## 📋 Testing Overview

**Total Features:** 24 fitur  
**Estimated Time:** 2-3 jam  
**Browser:** Chrome/Edge (recommended)  
**URL:** http://localhost:3000

---

## 🔐 Test Credentials

```
Email: admin@pos.com
Password: admin123
Role: SUPER_ADMIN
```

---

## ✅ Testing Checklist

### **1. Authentication & Authorization** (5 tests)

#### **1.1 Login Page**
- [ ] Buka http://localhost:3000
- [ ] Redirect otomatis ke /login
- [ ] Form login tampil dengan benar
- [ ] Demo credentials terlihat
- [ ] Input email: "test" → Error: "Invalid email address"
- [ ] Input password: "123" → Error: "Password must be at least 6 characters"
- [ ] Login dengan credentials benar → Berhasil masuk dashboard
- [ ] Token tersimpan di localStorage

**Expected Result:** ✅ Login berhasil, redirect ke dashboard

#### **1.2 Logout**
- [ ] Klik tombol "Logout" di dashboard
- [ ] Redirect ke /login
- [ ] Token dihapus dari localStorage
- [ ] Tidak ada error di console
- [ ] Coba akses /dashboard tanpa login → Redirect ke /login

**Expected Result:** ✅ Logout berhasil, tidak bisa akses dashboard

#### **1.3 Session Persistence**
- [ ] Login
- [ ] Refresh browser (F5)
- [ ] Masih tetap login
- [ ] Dashboard masih tampil

**Expected Result:** ✅ Session tetap aktif setelah refresh

#### **1.4 Protected Routes**
- [ ] Logout
- [ ] Coba akses /dashboard → Redirect ke /login
- [ ] Coba akses /products → Redirect ke /login
- [ ] Coba akses /reports → Redirect ke /login

**Expected Result:** ✅ Semua protected routes redirect ke login

#### **1.5 Role-Based Access**
- [ ] Login sebagai SUPER_ADMIN
- [ ] Bisa akses /backup
- [ ] Bisa create/edit/delete semua data

**Expected Result:** ✅ SUPER_ADMIN punya akses penuh

---

### **2. Dashboard** (3 tests)

#### **2.1 Dashboard Stats**
- [ ] Total Revenue tampil dengan benar
- [ ] Total Transactions tampil
- [ ] Total Products tampil
- [ ] Low Stock Items tampil
- [ ] Angka sesuai dengan data

**Expected Result:** ✅ Semua stats tampil dengan benar

#### **2.2 Period Filter**
- [ ] Pilih "Today" → Stats update
- [ ] Pilih "This Week" → Stats update
- [ ] Pilih "This Month" → Stats update
- [ ] Pilih "This Year" → Stats update

**Expected Result:** ✅ Stats berubah sesuai period

#### **2.3 Recent Transactions**
- [ ] Tabel recent transactions tampil
- [ ] Text terlihat jelas (tidak putih di putih)
- [ ] Invoice number tampil
- [ ] Customer name tampil
- [ ] Cashier name tampil
- [ ] Total tampil dengan format Rp
- [ ] Status badge tampil (hijau)

**Expected Result:** ✅ Tabel tampil dengan kontras yang baik

---

### **3. Products Management** (8 tests)

#### **3.1 View Products**
- [ ] Klik "Products" dari dashboard
- [ ] List products tampil
- [ ] Search bar ada
- [ ] Category filter ada
- [ ] Add Product button ada

**Expected Result:** ✅ Products page tampil lengkap

#### **3.2 Search Products**
- [ ] Ketik nama produk di search
- [ ] List filter sesuai search
- [ ] Clear search → List kembali normal

**Expected Result:** ✅ Search berfungsi dengan baik

#### **3.3 Filter by Category**
- [ ] Pilih category dari dropdown
- [ ] List filter sesuai category
- [ ] Pilih "All Categories" → List kembali normal

**Expected Result:** ✅ Filter berfungsi dengan baik

#### **3.4 Add Product (Validation)**
- [ ] Klik "Add Product"
- [ ] Modal terbuka
- [ ] Isi nama: "AB" → Error: "Minimal 3 karakter"
- [ ] Isi nama: "ABC" → Error hilang
- [ ] Isi SKU: "abc" → Error: "Harus huruf besar"
- [ ] Isi SKU: "ABC-123" → Error hilang
- [ ] Isi buy price: 10000
- [ ] Isi sell price: 8000 → Error: "Harus >= harga beli"
- [ ] Isi sell price: 12000 → Error hilang
- [ ] Klik "Generate SKU" → SKU auto-generate
- [ ] Profit margin tampil

**Expected Result:** ✅ Validation berfungsi dengan baik

#### **3.5 Add Product (Success)**
- [ ] Isi semua field dengan benar
- [ ] Klik "Create Product"
- [ ] Loading spinner tampil
- [ ] Toast success muncul
- [ ] Modal tertutup
- [ ] Product baru muncul di list

**Expected Result:** ✅ Product berhasil ditambahkan

#### **3.6 Edit Product**
- [ ] Klik icon edit di product
- [ ] Modal edit terbuka
- [ ] Data product ter-load
- [ ] Ubah nama product
- [ ] Klik "Update"
- [ ] Toast success muncul
- [ ] Product ter-update di list

**Expected Result:** ✅ Product berhasil di-update

#### **3.7 Delete Product**
- [ ] Klik icon delete
- [ ] Konfirmasi dialog muncul
- [ ] Klik "Cancel" → Tidak terhapus
- [ ] Klik delete lagi
- [ ] Klik "Confirm" → Product terhapus
- [ ] Toast success muncul

**Expected Result:** ✅ Product berhasil dihapus

#### **3.8 Barcode Scanner**
- [ ] Klik icon barcode
- [ ] Scanner modal terbuka
- [ ] Camera permission diminta
- [ ] Scan barcode → Barcode terdeteksi
- [ ] Add product modal terbuka dengan barcode

**Expected Result:** ✅ Barcode scanner berfungsi

---

### **4. Categories Management** (4 tests)

#### **4.1 View Categories**
- [ ] Klik "Categories" dari dashboard
- [ ] List categories tampil
- [ ] Add Category button ada

**Expected Result:** ✅ Categories page tampil

#### **4.2 Add Category**
- [ ] Klik "Add Category"
- [ ] Modal terbuka
- [ ] Isi nama category
- [ ] Isi description (optional)
- [ ] Klik "Create"
- [ ] Category baru muncul di list

**Expected Result:** ✅ Category berhasil ditambahkan

#### **4.3 Edit Category**
- [ ] Klik edit category
- [ ] Modal edit terbuka
- [ ] Ubah nama
- [ ] Klik "Update"
- [ ] Category ter-update

**Expected Result:** ✅ Category berhasil di-update

#### **4.4 Delete Category**
- [ ] Klik delete category
- [ ] Konfirmasi muncul
- [ ] Klik "Confirm"
- [ ] Category terhapus

**Expected Result:** ✅ Category berhasil dihapus

---

### **5. POS Transaction** (6 tests)

#### **5.1 Open POS**
- [ ] Klik "New Sale" dari dashboard
- [ ] POS page terbuka
- [ ] Product list tampil di kiri
- [ ] Cart kosong di kanan
- [ ] Search bar ada

**Expected Result:** ✅ POS page tampil lengkap

#### **5.2 Add Items to Cart**
- [ ] Klik product → Masuk ke cart
- [ ] Quantity = 1
- [ ] Subtotal terhitung
- [ ] Klik lagi → Quantity +1
- [ ] Subtotal update

**Expected Result:** ✅ Items masuk cart dengan benar

#### **5.3 Update Quantity**
- [ ] Klik + button → Quantity bertambah
- [ ] Klik - button → Quantity berkurang
- [ ] Input manual quantity → Update
- [ ] Subtotal selalu update

**Expected Result:** ✅ Quantity update dengan benar

#### **5.4 Remove Item**
- [ ] Klik icon trash di cart item
- [ ] Item terhapus dari cart
- [ ] Total update

**Expected Result:** ✅ Item berhasil dihapus

#### **5.5 Apply Discount**
- [ ] Klik "Add Discount"
- [ ] Pilih type: Percentage
- [ ] Isi value: 10
- [ ] Discount teraplikasi
- [ ] Total berkurang 10%
- [ ] Ganti type: Fixed
- [ ] Isi value: 5000
- [ ] Total berkurang Rp 5.000

**Expected Result:** ✅ Discount berfungsi dengan baik

#### **5.6 Complete Transaction**
- [ ] Pilih payment method: CASH
- [ ] Isi paid amount
- [ ] Change terhitung otomatis
- [ ] Klik "Complete Payment"
- [ ] Receipt modal muncul
- [ ] Invoice number tampil
- [ ] Items tampil
- [ ] Total tampil
- [ ] Klik "Print" → Print dialog
- [ ] Klik "New Transaction" → Cart clear

**Expected Result:** ✅ Transaction berhasil

---

### **6. Reports & Analytics** (10 tests)

#### **6.1 Open Reports**
- [ ] Klik "Reports" dari dashboard
- [ ] Reports page terbuka
- [ ] Date range filter ada
- [ ] Warehouse filter ada
- [ ] View mode selector ada

**Expected Result:** ✅ Reports page tampil

#### **6.2 Date Range Filter**
- [ ] Pilih start date
- [ ] Pilih end date
- [ ] Data update sesuai range
- [ ] Summary cards update

**Expected Result:** ✅ Filter berfungsi

#### **6.3 Warehouse Filter**
- [ ] Pilih warehouse
- [ ] Data filter sesuai warehouse
- [ ] Pilih "All Warehouses" → Data semua warehouse

**Expected Result:** ✅ Filter berfungsi

#### **6.4 View Mode Toggle**
- [ ] Pilih "Daily View" → Chart per hari
- [ ] Pilih "Weekly View" → Chart per minggu
- [ ] Pilih "Monthly View" → Chart per bulan
- [ ] Data aggregate dengan benar

**Expected Result:** ✅ View mode berfungsi

#### **6.5 Sales Trend Chart**
- [ ] Chart tampil
- [ ] Line chart dengan data
- [ ] Hover → Tooltip muncul
- [ ] Tooltip format Rp
- [ ] X-axis: tanggal
- [ ] Y-axis: revenue

**Expected Result:** ✅ Chart tampil dengan benar

#### **6.6 Top Products Chart**
- [ ] Bar chart tampil
- [ ] Top 10 products
- [ ] Sorted by revenue
- [ ] Hover → Tooltip
- [ ] Labels terbaca

**Expected Result:** ✅ Chart tampil dengan benar

#### **6.7 Payment Methods Chart**
- [ ] Pie chart tampil
- [ ] Percentage labels
- [ ] Colors berbeda
- [ ] Hover → Tooltip
- [ ] Total per method

**Expected Result:** ✅ Chart tampil dengan benar

#### **6.8 Category Performance Chart**
- [ ] Bar chart tampil
- [ ] Categories sorted by revenue
- [ ] Hover → Tooltip
- [ ] Colors: orange

**Expected Result:** ✅ Chart tampil dengan benar

#### **6.9 Cashier Performance Chart**
- [ ] Bar chart tampil
- [ ] Cashiers sorted by revenue
- [ ] Hover → Tooltip
- [ ] Colors: purple

**Expected Result:** ✅ Chart tampil dengan benar

#### **6.10 Export Charts**
- [ ] Klik download icon di chart → PNG download
- [ ] Klik "Export Charts" (purple) → All charts download
- [ ] Klik "Excel" (green) → Excel download
- [ ] Klik "PDF" (red) → PDF download
- [ ] Files download dengan timestamp

**Expected Result:** ✅ Export berfungsi

---

### **7. Inventory Management** (4 tests)

#### **7.1 View Inventory**
- [ ] Klik "Inventory" dari dashboard
- [ ] List inventory tampil
- [ ] Stock quantity tampil
- [ ] Warehouse tampil
- [ ] Low stock highlighted

**Expected Result:** ✅ Inventory page tampil

#### **7.2 Add Stock**
- [ ] Klik "Add Stock"
- [ ] Modal terbuka
- [ ] Pilih product
- [ ] Pilih warehouse
- [ ] Isi quantity
- [ ] Klik "Add"
- [ ] Stock bertambah

**Expected Result:** ✅ Stock berhasil ditambah

#### **7.3 Adjust Stock**
- [ ] Klik "Adjust Stock"
- [ ] Modal terbuka
- [ ] Pilih product
- [ ] Isi new quantity
- [ ] Isi reason
- [ ] Klik "Adjust"
- [ ] Stock ter-adjust

**Expected Result:** ✅ Stock berhasil di-adjust

#### **7.4 Stock History**
- [ ] Klik "View History"
- [ ] History modal terbuka
- [ ] List movements tampil
- [ ] Type tampil (IN/OUT/ADJUST)
- [ ] Quantity tampil
- [ ] Date tampil

**Expected Result:** ✅ History tampil

---

### **8. Customers Management** (4 tests)

#### **8.1 View Customers**
- [ ] Klik "Customers" dari dashboard
- [ ] List customers tampil
- [ ] Search bar ada
- [ ] Add Customer button ada

**Expected Result:** ✅ Customers page tampil

#### **8.2 Add Customer**
- [ ] Klik "Add Customer"
- [ ] Modal terbuka
- [ ] Isi nama
- [ ] Isi phone
- [ ] Isi email (optional)
- [ ] Isi address (optional)
- [ ] Klik "Create"
- [ ] Customer baru muncul

**Expected Result:** ✅ Customer berhasil ditambah

#### **8.3 Edit Customer**
- [ ] Klik edit customer
- [ ] Modal edit terbuka
- [ ] Ubah data
- [ ] Klik "Update"
- [ ] Customer ter-update

**Expected Result:** ✅ Customer berhasil di-update

#### **8.4 Delete Customer**
- [ ] Klik delete customer
- [ ] Konfirmasi muncul
- [ ] Klik "Confirm"
- [ ] Customer terhapus

**Expected Result:** ✅ Customer berhasil dihapus

---

### **9. Backup & Restore** (4 tests)

#### **9.1 Access Backup Page**
- [ ] Klik "Backup" dari dashboard
- [ ] Backup page terbuka
- [ ] Warning banner tampil
- [ ] Create Backup section ada
- [ ] Restore Backup section ada

**Expected Result:** ✅ Backup page tampil (SUPER_ADMIN only)

#### **9.2 Create Backup**
- [ ] Klik "Create Backup Now"
- [ ] Loading spinner tampil
- [ ] File JSON download otomatis
- [ ] Filename: pos-backup-YYYY-MM-DD.json
- [ ] Toast success muncul

**Expected Result:** ✅ Backup berhasil dibuat

#### **9.3 Restore Backup**
- [ ] Klik "Select Backup File"
- [ ] Pilih file backup JSON
- [ ] File name tampil
- [ ] Klik "Restore from Backup"
- [ ] Warning dialog muncul
- [ ] Klik "Cancel" → Tidak restore
- [ ] Klik "Restore" lagi
- [ ] Klik "OK" → Restore process
- [ ] Loading spinner tampil
- [ ] Toast success muncul
- [ ] Page reload otomatis

**Expected Result:** ✅ Restore berhasil

#### **9.4 Restore Validation**
- [ ] Coba upload file non-JSON → Error
- [ ] Coba upload JSON invalid → Error
- [ ] Coba restore tanpa SUPER_ADMIN → Forbidden

**Expected Result:** ✅ Validation berfungsi

---

### **10. Export Data** (4 tests)

#### **10.1 Export Transactions**
- [ ] Di Transactions page
- [ ] Klik "Export Excel"
- [ ] File Excel download
- [ ] Filename: transactions-YYYY-MM-DD.xlsx
- [ ] Buka file → Data lengkap
- [ ] Format Rp benar
- [ ] Klik "Export CSV"
- [ ] File CSV download

**Expected Result:** ✅ Export berhasil

#### **10.2 Export Products**
- [ ] Di Products page
- [ ] Klik "Export Excel"
- [ ] File download
- [ ] Data lengkap

**Expected Result:** ✅ Export berhasil

#### **10.3 Export Customers**
- [ ] Di Customers page
- [ ] Klik "Export Excel"
- [ ] File download
- [ ] Data lengkap

**Expected Result:** ✅ Export berhasil

#### **10.4 Export Reports**
- [ ] Di Reports page
- [ ] Klik "Excel" button
- [ ] File download dengan summary
- [ ] Klik "PDF" button
- [ ] PDF download

**Expected Result:** ✅ Export berhasil

---

### **11. Additional Features** (6 tests)

#### **11.1 Employees**
- [ ] View employees list
- [ ] Add employee
- [ ] Edit employee
- [ ] Delete employee

**Expected Result:** ✅ CRUD berfungsi

#### **11.2 Attendance**
- [ ] View attendance list
- [ ] Clock in
- [ ] Clock out
- [ ] View history

**Expected Result:** ✅ Attendance berfungsi

#### **11.3 Suppliers**
- [ ] View suppliers list
- [ ] Add supplier
- [ ] Edit supplier
- [ ] Delete supplier

**Expected Result:** ✅ CRUD berfungsi

#### **11.4 Purchase Orders**
- [ ] View PO list
- [ ] Create PO
- [ ] Approve PO
- [ ] Receive PO

**Expected Result:** ✅ PO flow berfungsi

#### **11.5 Stock Transfer**
- [ ] View transfers list
- [ ] Create transfer
- [ ] Approve transfer
- [ ] Complete transfer

**Expected Result:** ✅ Transfer berfungsi

#### **11.6 Promotions**
- [ ] View promotions list
- [ ] Add promotion
- [ ] Edit promotion
- [ ] Delete promotion
- [ ] Promotion apply di POS

**Expected Result:** ✅ Promotions berfungsi

---

## 🐛 Bug Tracking

### **Critical Bugs (Must Fix):**
| No | Feature | Bug Description | Status |
|----|---------|-----------------|--------|
| 1  |         |                 |        |

### **Major Bugs (Should Fix):**
| No | Feature | Bug Description | Status |
|----|---------|-----------------|--------|
| 1  |         |                 |        |

### **Minor Bugs (Nice to Fix):**
| No | Feature | Bug Description | Status |
|----|---------|-----------------|--------|
| 1  |         |                 |        |

---

## 📊 Testing Summary

**Total Tests:** 80+ tests  
**Passed:** ___  
**Failed:** ___  
**Bugs Found:** ___

**Categories:**
- Authentication: ___ / 5
- Dashboard: ___ / 3
- Products: ___ / 8
- Categories: ___ / 4
- POS: ___ / 6
- Reports: ___ / 10
- Inventory: ___ / 4
- Customers: ___ / 4
- Backup: ___ / 4
- Export: ___ / 4
- Additional: ___ / 6

**Overall Pass Rate:** ____%

---

## 📝 Notes & Observations

### **Performance:**
- Page load time: ___
- Chart render time: ___
- Transaction speed: ___

### **UI/UX:**
- Dark theme consistency: ___
- Mobile responsiveness: ___
- Loading states: ___
- Error messages: ___

### **Suggestions:**
1. 
2. 
3. 

---

**Tested By:** User  
**Date:** 2026-05-01  
**Browser:** Chrome/Edge  
**Status:** IN PROGRESS
