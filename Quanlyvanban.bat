@echo off
chcp 65001 >nul
title Quan ly Van ban - Live Server
setlocal

REM Đường dẫn file chính
set "WEBPATH=index-offline.html"
set "PORT=5500"
set "HOST=127.0.0.1"

REM Chuyen den thu muc ung dung
cd /d "D:\Quản lý văn bản"
echo Thu muc hien tai: %CD%

REM Kiem tra file index-offline.html
if not exist "%WEBPATH%" (
    echo Loi: Khong tim thay file %WEBPATH%
    dir *.html
    pause
    exit /b
)

REM Kiem tra cổng 5500 có đang mở không
echo Kiem tra cổng %PORT%...
netstat -ano | findstr :%PORT% >nul
if %errorlevel% equ 0 (
    echo Cổng %PORT% đang được sử dụng. Chi truy cap web.
    start "" "http://%HOST%:%PORT%/%WEBPATH%"
    echo Da mo web tren cổng %PORT%.
    pause
    exit /b
) else (
    echo Cổng %PORT% chưa được sử dụng. Dang khoi dong live-server...
    live-server --port=%PORT% --open=%WEBPATH% --host=%HOST%
    echo Da khoi dong live-server tren cổng %PORT%.
    pause
    exit /b
)