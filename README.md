# POS System - Point of Sale Application

Aplikasi Point of Sale (POS) modern dan lengkap dengan manajemen inventory, built with Next.js 14, Prisma, SQLite, dan TypeScript.

## 🚀 Fitur Utama

### 📱 Platform
- ✅ Web Application (Browser)
- ✅ Progressive Web App (PWA) - dapat di-install di Android
- ✅ Responsive Design (Desktop, Tablet, Mobile)
- ✅ Offline-first dengan SQLite

### 🏪 Fitur Merchandising
- ✅ Manajemen Produk (CRUD)
- ✅ Kategori Produk (dengan sub-kategori)
- ✅ SKU & Barcode
- ✅ Harga Beli, Jual, dan Grosir
- ✅ Multi Satuan Unit

### 📦 Inventory Management
- ✅ Manajemen Stok Real-time
- ✅ Multi Warehouse/Gudang
- ✅ Stock Movement Tracking
- ✅ Low Stock Alert
- ✅ Expired Date Tracking

### 💰 Point of Sale (Kasir)
- ✅ Interface Kasir Cepat & Intuitif
- ✅ Pencarian Produk
- ✅ Keranjang Belanja
- ✅ Multiple Payment Methods
- ✅ Diskon Transaksi
- ✅ Perhitungan Kembalian Otomatis

### 👥 Customer Management
- ✅ Data Pelanggan
- ✅ Member Tier (Bronze, Silver, Gold, Platinum)
- ✅ Sistem Poin
- ✅ Total Spending Tracking

### 📊 Dashboard & Reports
- ✅ Dashboard Admin dengan Statistik
- ✅ Total Revenue & Transactions
- ✅ Top Products
- ✅ Recent Transactions
- ✅ Low Stock Alerts

### 🔐 User Management
- ✅ Authentication (Login/Register)
- ✅ Role-based Access Control (RBAC)
  - Super Admin
  - Admin
  - Manager
  - Cashier
  - Warehouse
- ✅ Audit Log

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **Database**: SQLite dengan Prisma ORM
- **State Management**: Zustand
- **Authentication**: JWT + bcryptjs
- **Icons**: Lucide React
- **Notifications**: React Hot Toast
- **Charts**: Recharts (ready to use)
- **Export**: jsPDF, xlsx (ready to use)

## 📋 Prerequisites

- Node.js 18+ 
- npm atau yarn

## 🚀 Installation & Setup

### 1. Clone atau Extract Project

```bash
cd pos-app
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Database

```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed database dengan data sample
npm run prisma:seed
```

### 4. Run Development Server

```bash
npm run dev
```

Aplikasi akan berjalan di `http://localhost:3000`

## 👤 Default Login Credentials

### Admin Account
- Email: `admin@pos.com`
- Password: `admin123`
- Role: Super Admin

### Cashier Account
- Email: `cashier@pos.com`
- Password: `cashier123`
- Role: Cashier

## 📁 Project Structure

```
pos-app/
├── app/
│   ├── api/              # API Routes
│   │   ├── auth/         # Authentication endpoints
│   │   ├── products/     # Product management
│   │   ├── transactions/ # Transaction/sales
│   │   ├── customers/    # Customer management
│   │   ├── stocks/       # Inventory management
│   │   ├── categories/   # Category management
│   │   ├── warehouses/   # Warehouse management
│   │   └── dashboard/    # Dashboard data
│   ├── dashboard/        # Dashboard page
│   ├── pos/              # Point of Sale page
│   ├── login/            # Login page
│   ├── register/         # Register page
│   ├── store/            # Zustand stores
│   │   ├── authStore.ts  # Authentication state
│   │   └── cartStore.ts  # Shopping cart state
│   └── components/       # React components
├── lib/
│   ├── prisma.ts         # Prisma client
│   ├── auth.ts           # Auth utilities
│   └── utils.ts          # Helper functions
├── prisma/
│   ├── schema.prisma     # Database schema
│   ├── seed.ts           # Database seeder
│   └── migrations/       # Database migrations
└── public/               # Static files
```

## 🎯 Usage Guide

### 1. Login
- Buka `http://localhost:3000`
- Login dengan credentials di atas

### 2. Dashboard
- Lihat statistik penjualan
- Monitor stok produk
- Lihat transaksi terbaru

### 3. Point of Sale (Kasir)
- Klik tombol "New Sale" di dashboard
- Pilih warehouse
- Cari dan tambahkan produk ke cart
- Atur quantity dan diskon
- Klik "Proceed to Payment"
- Masukkan jumlah pembayaran
- Klik "Complete" untuk menyelesaikan transaksi

### 4. Manajemen Produk
- Tambah produk baru dengan kategori
- Set harga beli, jual, dan grosir
- Upload foto produk (ready)
- Generate SKU otomatis

### 5. Manajemen Stok
- Monitor stok per warehouse
- Tambah/kurangi stok
- Set minimum stock alert
- Track expired date

## 🔧 Available Scripts

```bash
# Development
npm run dev              # Start dev server

# Build
npm run build            # Build for production
npm run start            # Start production server

# Database
npm run prisma:generate  # Generate Prisma Client
npm run prisma:migrate   # Run migrations
npm run prisma:seed      # Seed database
npm run prisma:studio    # Open Prisma Studio

# Lint
npm run lint             # Run ESLint
```

## 📱 PWA Installation (Android)

1. Buka aplikasi di browser Chrome/Edge di HP Android
2. Klik menu (3 titik) di browser
3. Pilih "Add to Home Screen" atau "Install App"
4. Aplikasi akan ter-install seperti aplikasi native

## 🔮 Fitur yang Bisa Dikembangkan

- [ ] Barcode Scanner (kamera HP)
- [ ] Print Struk (Bluetooth/USB printer)
- [ ] Kirim Struk via WhatsApp/Email
- [ ] Promo & Diskon Management
- [ ] Supplier Management
- [ ] Purchase Order
- [ ] Return/Refund
- [ ] Cash Session Management
- [ ] Multi-branch Sync
- [ ] Export Reports (PDF/Excel)
- [ ] Charts & Analytics
- [ ] Payment Gateway Integration (QRIS, E-wallet)
- [ ] Dark Mode
- [ ] Multi-language (i18n)

## 🐛 Troubleshooting

### Database Error
```bash
# Reset database
rm prisma/dev.db
npm run prisma:migrate
npm run prisma:seed
```

### Port Already in Use
```bash
# Change port
npm run dev -- -p 3001
```

## 📝 Environment Variables

File `.env` sudah include dengan default values:

```env
DATABASE_URL="file:./prisma/dev.db"
NEXTAUTH_SECRET="your-secret-key-change-this-in-production"
NEXTAUTH_URL="http://localhost:3000"
JWT_SECRET="your-jwt-secret-change-this-in-production"
```

⚠️ **PENTING**: Ganti secret keys untuk production!

## 🚀 Deployment

### Vercel (Recommended untuk Web)
```bash
npm run build
# Deploy ke Vercel
```

### Build APK (untuk Android)
Gunakan Capacitor:
```bash
npm install @capacitor/cli @capacitor/core @capacitor/android
npx cap init
npx cap add android
npm run build
npx cap sync
npx cap open android
# Build APK di Android Studio
```

## 📄 License

MIT License - Free to use for personal and commercial projects.

## 👨‍💻 Developer

Built with ❤️ using Next.js, Prisma, and TypeScript.

---

**Happy Coding! 🎉**
