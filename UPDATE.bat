@echo off
title POS App - Update
color 0E
cls

echo.
echo  ╔══════════════════════════════════════════════╗
echo  ║           POS App - Update Versi             ║
echo  ╚══════════════════════════════════════════════╝
echo.
echo  ⚠️  PERHATIAN: Pastikan tidak ada transaksi yang sedang
echo  berjalan sebelum melakukan update!
echo.
set /p confirm="Lanjutkan update? (Y/N): "
if /i "%confirm%" neq "Y" (
    echo  Update dibatalkan.
    pause
    exit /b 0
)

echo.
echo  [1/4] Mematikan aplikasi sementara...
docker-compose down

echo.
echo  [2/4] Mengambil update terbaru dari developer...
git pull origin main
if errorlevel 1 (
    echo  ❌ Gagal mengambil update. Cek koneksi internet.
    pause
    exit /b 1
)

echo.
echo  [3/4] Membangun ulang aplikasi (5-10 menit)...
docker-compose build --no-cache
if errorlevel 1 (
    echo  ❌ Gagal build. Hubungi developer.
    pause
    exit /b 1
)

echo.
echo  [4/4] Menjalankan kembali...
docker-compose up -d

timeout /t 10 /nobreak >nul

echo.
echo  ╔══════════════════════════════════════════════╗
echo  ║              ✅ UPDATE SELESAI!              ║
echo  ╚══════════════════════════════════════════════╝
echo.
echo   Aplikasi sudah diupdate ke versi terbaru!
echo.
start http://localhost:3000
pause
