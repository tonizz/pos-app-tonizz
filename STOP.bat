@echo off
title POS App - Mematikan...
color 0C
cls

echo.
echo  ╔══════════════════════════════════════════════╗
echo  ║           POS App - Mematikan...             ║
echo  ╚══════════════════════════════════════════════╝
echo.
echo  ⏳ Mematikan aplikasi dan database...
echo.

docker-compose down

echo.
echo  ╔══════════════════════════════════════════════╗
echo  ║           ✅ APLIKASI DIMATIKAN              ║
echo  ╚══════════════════════════════════════════════╝
echo.
echo   Data Anda tersimpan dengan aman.
echo   Untuk menjalankan lagi: klik 2x START.bat
echo.
timeout /t 5 /nobreak >nul
