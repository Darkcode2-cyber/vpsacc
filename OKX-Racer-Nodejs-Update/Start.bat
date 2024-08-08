@echo off
title Tool OKX Racer X86

setlocal

:: Mở terminal tại thư mục hiện tại
cd /d %~dp0

:: In ra câu chào X86
echo Tool OKX Racer

:: Kiểm tra phiên bản Node.js
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo Node.js chua duoc cai dat. Vui long cai dat Node.js truoc.
    exit /b 1
)

:: Chạy lệnh npm install
if not exist node_modules (
    echo Thu muc node_modules khong ton tai. Dang chay npm install...
    npm install
) else (
    echo Da cai dat thanh cong
)

:: Chạy tập tin okx.js bằng Node.js
echo Dang chay okx.js...
node okx.js

:: pause
pause

endlocal
