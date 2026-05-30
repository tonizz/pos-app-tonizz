@echo off
title POS App - Memulai...
color 0A
cls

echo.
echo  ╔══════════════════════════════════════════════╗
echo  ║           POS App - Memulai...               ║
echo  ╚══════════════════════════════════════════════╝
echo.

:: Cek Docker berjalan
docker info >nul 2>&1
if errorlevel 1 (
    echo  ❌ Docker tidak berjalan!
    echo.
    echo  Buka Docker Desktop terlebih dahulu.
    echo  Tunggu sampai icon Docker muncul di taskbar.
    echo  Lalu klik 2x START.bat lagi.
    echo.
    pause
    exit /b 1
)

echo  ⏳ Memulai database dan aplikasi...
docker-compose up -d

if errorlevel 1 (
    echo.
    echo  ❌ Gagal memulai! Coba jalankan INSTALL.bat terlebih dahulu.
    echo.
    pause
    exit /b 1
)

echo.
echo  ⏳ Menunggu aplikasi siap...
timeout /t 8 /nobreak >nul

echo.
echo  ╔══════════════════════════════════════════════╗
echo  ║              ✅ APLIKASI SIAP!               ║
echo  ╚══════════════════════════════════════════════╝
echo.
echo   🌐 Membuka browser ke: http://localhost:3000
echo.
echo   Jangan tutup jendela ini selama menggunakan aplikasi!
echo   Untuk mematikan: klik 2x STOP.bat
echo.

start http://localhost:3000

:: Tampilkan log (opsional - tekan Ctrl+C untuk berhenti lihat log)
echo  ─────────────────────────────────────────────
echo  Log aplikasi (tekan Ctrl+C untuk keluar dari log,
echo  aplikasi tetap berjalan):
echo  ─────────────────────────────────────────────
echo.
docker-compose logs -f app
