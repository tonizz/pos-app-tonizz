# 🧪 Panduan Testing Cepat - POS Application

**Tanggal:** 1 Mei 2026  
**Waktu:** 07:32 WIB  
**Estimasi:** 30-60 menit untuk test cepat

---

## 🚀 Quick Start

### **1. Persiapan:**
```bash
# Pastikan server running
http://localhost:3000

# Login credentials
Email: admin@pos.com
Password: admin123
```

### **2. Browser:**
- Chrome atau Edge (recommended)
- Buka Developer Console (F12) untuk cek error

---

## ✅ Testing Priority (Test Ini Dulu!)

### **🔥 CRITICAL - Harus Test (15 menit)**

#### **1. Login & Logout (2 menit)**
```
✓ Login dengan credentials benar → Masuk dashboard
✓ Logout → Kembali ke login, no error
✓ Login lagi → Berhasil
```

#### **2. Dashboard (2 menit)**
```
✓ Stats tampil (Revenue, Transactions, Products, Low Stock)
✓ Recent Transactions table terlihat jelas (tidak putih di putih)
✓ Quick Actions buttons semua ada
```

#### **3. Products - Add dengan Validation (3 menit)**
```
✓ Dashboard → Products → Add Product
✓ Isi nama: "AB" → Error muncul ✅
✓ Isi nama: "ABC" → Error hilang ✅
✓ Isi SKU: "abc" → Error muncul ✅
✓ Isi SKU: "ABC-123" → Error hilang ✅
✓ Buy price: 10000, Sell price: 8000 → Error ✅
✓ Sell price: 12000 → Error hilang ✅
✓ Submit → Product berhasil dibuat ✅
```

#### **4. POS Transaction (5 menit)**
```
✓ Dashboard → New Sale
✓ Klik product → Masuk cart
✓ Klik + → Quantity bertambah
✓ Klik - → Quantity berkurang
✓ Add discount 10% → Total berkurang
✓ Payment method: CASH
✓ Paid amount: 100000
✓ Change terhitung otomatis
✓ Complete Payment → Receipt muncul ✅
```

#### **5. Reports & Charts (3 menit)**
```
✓ Dashboard → Reports
✓ 5 charts tampil (Sales, Products, Payments, Category, Cashier)
✓ Hover chart → Tooltip muncul
✓ Switch view: Daily → Weekly → Monthly
✓ Klik download icon → Chart download PNG ✅
✓ Klik "Export Charts" → All charts download ✅
```

---

### **⚠️ IMPORTANT - Test Kalau Ada Waktu (15 menit)**

#### **6. Backup & Restore (5 menit)**
```
✓ Dashboard → Backup (red button)
✓ Create Backup → JSON file download
✓ Select backup file
✓ Restore → Warning muncul
✓ Confirm → Restore berhasil ✅
```

#### **7. Export Data (3 menit)**
```
✓ Products → Export Excel → File download
✓ Transactions → Export Excel → File download
✓ Reports → Export Excel → File download
✓ Reports → Export PDF → File download
```

#### **8. Categories (2 menit)**
```
✓ Dashboard → Categories
✓ Add Category → Berhasil
✓ Edit Category → Berhasil
✓ Delete Category → Berhasil
```

#### **9. Customers (2 menit)**
```
✓ Dashboard → Customers
✓ Add Customer → Berhasil
✓ Edit Customer → Berhasil
✓ Delete Customer → Berhasil
```

#### **10. Inventory (3 menit)**
```
✓ Dashboard → Inventory
✓ Add Stock → Berhasil
✓ Adjust Stock → Berhasil
✓ View History → Tampil
```

---

### **📝 OPTIONAL - Test Kalau Masih Ada Waktu (30 menit)**

#### **11. Employees**
```
✓ View, Add, Edit, Delete
```

#### **12. Attendance**
```
✓ Clock In, Clock Out, View History
```

#### **13. Suppliers**
```
✓ View, Add, Edit, Delete
```

#### **14. Purchase Orders**
```
✓ Create, Approve, Receive
```

#### **15. Stock Transfer**
```
✓ Create, Approve, Complete
```

#### **16. Promotions**
```
✓ View, Add, Edit, Delete
✓ Apply di POS
```

---

## 🐛 Cara Report Bug

Kalau menemukan bug, catat seperti ini:

```
Bug #1
Feature: Products - Add Product
Deskripsi: Tombol submit tidak disabled saat ada error
Steps:
1. Buka Add Product
2. Isi nama: "AB" (error)
3. Klik submit
Expected: Tombol disabled
Actual: Bisa submit
Severity: Medium
```

---

## 📊 Quick Test Result

Isi setelah testing:

### **Critical Features:**
- [ ] Login/Logout - ✅ / ❌
- [ ] Dashboard - ✅ / ❌
- [ ] Products (with validation) - ✅ / ❌
- [ ] POS Transaction - ✅ / ❌
- [ ] Reports & Charts - ✅ / ❌

### **Important Features:**
- [ ] Backup & Restore - ✅ / ❌
- [ ] Export Data - ✅ / ❌
- [ ] Categories - ✅ / ❌
- [ ] Customers - ✅ / ❌
- [ ] Inventory - ✅ / ❌

### **Bugs Found:**
```
Total: ___
Critical: ___
Major: ___
Minor: ___
```

### **Overall:**
```
Pass Rate: ____%
Status: ✅ Ready / ⚠️ Need Fixes / ❌ Major Issues
```

---

## 💡 Tips Testing

1. **Buka Console (F12)** - Cek error di console
2. **Test di Chrome** - Browser paling stabil
3. **Hard Refresh** - Ctrl + Shift + R kalau ada masalah
4. **Screenshot Bug** - Ambil screenshot kalau ada bug
5. **Catat Detail** - Catat steps untuk reproduce bug

---

## 🎯 Success Criteria

**Aplikasi dianggap PASS jika:**
- ✅ Login/Logout berfungsi tanpa error
- ✅ Dashboard tampil dengan benar
- ✅ Products validation berfungsi
- ✅ POS transaction berhasil
- ✅ Reports & charts tampil
- ✅ Backup & restore berfungsi
- ✅ Export data berhasil
- ✅ Tidak ada critical bug

**Aplikasi dianggap READY FOR PRODUCTION jika:**
- ✅ Pass rate >= 90%
- ✅ No critical bugs
- ✅ Max 2-3 major bugs
- ✅ UI/UX smooth

---

## 📞 Setelah Testing

**Kalau semua PASS:**
1. ✅ Mark task #9 as completed
2. ✅ Lanjut ke UI polish
3. ✅ Siap deploy

**Kalau ada bugs:**
1. ⚠️ Report bugs ke saya
2. ⚠️ Saya fix bugs
3. ⚠️ Test ulang

---

**Selamat Testing! 🚀**

Kalau ada pertanyaan atau menemukan bug, langsung beritahu saya.
