@echo off
title POS App - Instalasi Pertama
color 0A
cls

echo.
echo  ╔══════════════════════════════════════════════╗
echo  ║        POS App - Wizard Instalasi            ║
echo  ╚══════════════════════════════════════════════╝
echo.

:: Cek Docker
echo  [1/5] Mengecek Docker...
docker --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo  ❌ Docker belum terinstall!
    echo.
    echo  Silakan install Docker Desktop terlebih dahulu:
    echo  https://www.docker.com/products/docker-desktop
    echo.
    echo  Setelah install Docker, jalankan INSTALL.bat lagi.
    echo.
    pause
    exit /b 1
)
echo  ✅ Docker ditemukan!

:: Cek Docker berjalan
docker info >nul 2>&1
if errorlevel 1 (
    echo.
    echo  ❌ Docker tidak berjalan!
    echo  Buka Docker Desktop terlebih dahulu, tunggu sampai icon-nya
    echo  muncul di taskbar, lalu jalankan INSTALL.bat lagi.
    echo.
    pause
    exit /b 1
)
echo  ✅ Docker berjalan!

:: Cek file .env
echo.
echo  [2/5] Mengecek konfigurasi...
if not exist ".env" (
    echo.
    echo  ⚠️  File .env belum ada!
    echo.
    echo  Membuat file .env dari template...
    copy .env.example .env >nul
    echo.
    echo  ═══════════════════════════════════════════════
    echo   PENTING: Edit file .env sebelum melanjutkan!
    echo  ═══════════════════════════════════════════════
    echo.
    echo  Buka file .env dan isi nilai yang benar.
    echo  Hubungi developer untuk mendapatkan LICENSE_MASTER_SECRET.
    echo.
    echo  Setelah selesai edit .env, jalankan INSTALL.bat lagi.
    echo.
    start notepad .env
    pause
    exit /b 1
)

:: Validasi .env tidak ada nilai placeholder
findstr /C:"GANTI_INI" .env >nul 2>&1
if not errorlevel 1 (
    echo.
    echo  ⚠️  File .env belum diisi lengkap!
    echo  Masih ada nilai "GANTI_INI" yang belum diganti.
    echo.
    start notepad .env
    pause
    exit /b 1
)

findstr /C:"ISI_DARI_DEVELOPER" .env >nul 2>&1
if not errorlevel 1 (
    echo.
    echo  ⚠️  LICENSE_MASTER_SECRET belum diisi!
    echo  Hubungi developer untuk mendapatkan nilai ini.
    echo.
    pause
    exit /b 1
)
echo  ✅ Konfigurasi OK!

:: Build Docker image
echo.
echo  [3/5] Membangun aplikasi (butuh 3-10 menit, tergantung internet)...
echo  Mohon tunggu...
echo.
docker-compose build --no-cache
if errorlevel 1 (
    echo.
    echo  ❌ Gagal build aplikasi! Cek koneksi internet.
    echo.
    pause
    exit /b 1
)
echo  ✅ Aplikasi berhasil dibangun!

:: Jalankan pertama kali
echo.
echo  [4/5] Menjalankan database dan aplikasi...
docker-compose up -d
if errorlevel 1 (
    echo.
    echo  ❌ Gagal menjalankan aplikasi!
    echo.
    pause
    exit /b 1
)

:: Tunggu app siap
echo.
echo  [5/5] Menunggu aplikasi siap (30 detik)...
timeout /t 30 /nobreak >nul

echo.
echo  ╔══════════════════════════════════════════════╗
echo  ║           ✅ INSTALASI SELESAI!              ║
echo  ╚══════════════════════════════════════════════╝
echo.
echo   Aplikasi POS sudah berjalan!
echo.
echo   🌐 Buka browser dan ketik:
echo      http://localhost:3000
echo.
echo   📋 Login pertama kali:
echo      Email   : admin@pos.com
echo      Password: admin123
echo.
echo   ⚠️  PENTING: Ganti password setelah login pertama!
echo.
echo   Untuk menjalankan aplikasi di hari berikutnya:
echo   Klik 2x file START.bat
echo.

:: Buka browser otomatis
timeout /t 3 /nobreak >nul
start http://localhost:3000

pause
