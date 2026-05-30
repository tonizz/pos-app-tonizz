@echo off
title POS App - Backup Data
color 0B
cls

echo.
echo  ╔══════════════════════════════════════════════╗
echo  ║           POS App - Backup Data              ║
echo  ╚══════════════════════════════════════════════╝
echo.

:: Buat folder backup
if not exist "backup_data" mkdir backup_data

:: Nama file dengan tanggal
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set dt=%%I
set backup_file=backup_data\pos_backup_%dt:~0,8%_%dt:~8,6%.sql

echo  ⏳ Membuat backup database...
docker exec pos_database pg_dump -U pos_user pos_db > "%backup_file%"

if errorlevel 1 (
    echo  ❌ Gagal backup! Pastikan aplikasi sedang berjalan.
    pause
    exit /b 1
)

echo.
echo  ╔══════════════════════════════════════════════╗
echo  ║              ✅ BACKUP SELESAI!              ║
echo  ╚══════════════════════════════════════════════╝
echo.
echo   File backup tersimpan di:
echo   %backup_file%
echo.
echo   Salin file ini ke USB/Google Drive untuk keamanan!
echo.
explorer backup_data
pause
