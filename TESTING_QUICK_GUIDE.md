# 🧪 Manual Testing Guide - Quick Version

**Tanggal:** 2 Mei 2026, 11:27 WIB  
**Estimasi:** 15-20 menit  
**URL:** http://localhost:3000

---

## 🔐 Login Credentials

```
Email: admin@pos.com
Password: admin123
```

---

## ✅ Critical Features Testing (15 menit)

### **Test 1: Login & Dashboard (2 menit)**

**Steps:**
1. Buka http://localhost:3000
2. Login dengan credentials di atas
3. Cek dashboard tampil dengan benar
4. Cek stats: Revenue, Transactions, Products, Low Stock
5. Cek Recent Transactions table (text harus terlihat jelas)

**Expected:**
- ✅ Login berhasil
- ✅ Dashboard tampil
- ✅ Stats tampil dengan angka
- ✅ Table terlihat jelas (tidak putih di putih)

**Status:** [ ] Pass / [ ] Fail

---

### **Test 2: POS Transaction (5 menit)**

**Steps:**
1. Klik "New Sale" atau buka http://localhost:3000/pos
2. Tambah produk ke cart (klik produk)
3. Cek summary di kanan:
   ```
   Subtotal: Rp 100.000
   PPN (11%): Rp 11.000 (included)
   Total: Rp 100.000
   ```
4. Isi payment: Rp 100.000
5. Klik "Complete Payment"
6. Cek receipt muncul
7. Cek tax tampil di receipt

**Expected:**
- ✅ Produk masuk cart
- ✅ Tax muncul di summary
- ✅ Payment berhasil (no "Insufficient payment" error)
- ✅ Receipt muncul
- ✅ Tax tampil di receipt: "PPN (11%) Rp 11.000 (included)"

**Status:** [ ] Pass / [ ] Fail

---

### **Test 3: Products Management (3 menit)**

**Steps:**
1. Buka http://localhost:3000/products
2. Klik "Add Product"
3. Test validation:
   - Isi nama: "AB" → Error muncul ✅
   - Isi nama: "Test Product" → Error hilang ✅
   - Isi SKU: "abc" → Error muncul ✅
   - Isi SKU: "TEST-001" → Error hilang ✅
   - Buy price: 10000, Sell price: 8000 → Error ✅
   - Sell price: 12000 → Error hilang ✅
4. Isi semua field dengan benar
5. Klik "Create Product"
6. Cek product baru muncul di list

**Expected:**
- ✅ Validation berfungsi
- ✅ Product berhasil dibuat
- ✅ Product muncul di list

**Status:** [ ] Pass / [ ] Fail

---

### **Test 4: Reports & Charts (3 menit)**

**Steps:**
1. Buka http://localhost:3000/reports
2. Cek 5 charts tampil:
   - Sales Trend (line chart)
   - Top Products (bar chart)
   - Payment Methods (pie chart)
   - Category Performance (bar chart)
   - Cashier Performance (bar chart)
3. Hover chart → Tooltip muncul
4. Klik download icon di chart → PNG download
5. Klik "Export Charts" (purple button) → All charts download

**Expected:**
- ✅ 5 charts tampil dengan data
- ✅ Tooltip berfungsi
- ✅ Export chart berfungsi
- ✅ Export all charts berfungsi

**Status:** [ ] Pass / [ ] Fail

---

### **Test 5: Backup & Restore (2 menit)**

**Steps:**
1. Buka http://localhost:3000/backup
2. Klik "Create Backup Now"
3. Cek file JSON download
4. Filename: `pos-backup-YYYY-MM-DD.json`
5. Toast success muncul

**Expected:**
- ✅ Backup file download
- ✅ File format JSON
- ✅ Toast success muncul

**Status:** [ ] Pass / [ ] Fail

---

## 📊 Testing Summary

**Total Tests:** 5 critical tests  
**Passed:** ___ / 5  
**Failed:** ___ / 5  
**Pass Rate:** ____%

**Critical Bugs Found:**
1. ___
2. ___
3. ___

---

## ✅ Pass Criteria

**Application PASSES if:**
- ✅ All 5 tests pass
- ✅ No critical bugs
- ✅ Tax system works correctly
- ✅ Payment works without errors

**Application READY FOR PRODUCTION if:**
- ✅ Pass rate >= 80% (4/5 tests)
- ✅ No critical bugs
- ✅ All core features work

---

## 🐛 Bug Report Template

**If you find a bug, report like this:**

```
Bug #1
Feature: [Feature name]
Description: [What happened]
Steps to Reproduce:
1. [Step 1]
2. [Step 2]
3. [Step 3]
Expected: [What should happen]
Actual: [What actually happened]
Severity: Critical / Major / Minor
```

---

## 💬 After Testing

**If All Tests Pass:**
- ✅ Mark Task #2 as completed
- ✅ Application ready for production
- ✅ Can proceed to deployment

**If Some Tests Fail:**
- ⚠️ Report bugs to me
- ⚠️ I will fix the bugs
- ⚠️ Re-test after fixes

---

## 🎯 Quick Checklist

- [ ] Test 1: Login & Dashboard
- [ ] Test 2: POS Transaction (with tax)
- [ ] Test 3: Products Management (with validation)
- [ ] Test 4: Reports & Charts
- [ ] Test 5: Backup & Restore

**Time:** ___ minutes  
**Result:** Pass / Fail  
**Ready for Production:** Yes / No

---

**Created:** 2026-05-02 11:27 WIB  
**Status:** Ready for testing  
**Tester:** User
