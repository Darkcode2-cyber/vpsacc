@echo off
:: Kiểm tra thư mục node_modules và cài đặt nếu chưa có
if not exist node_modules (
    echo Thư mục node_modules không tồn tại. Đang chạy npm install...
    npm install
) else (
    echo Thư mục node_modules đã tồn tại.
)

:: Kiểm tra từng module và cài đặt nếu chưa có
SETLOCAL EnableDelayedExpansion
SET modules=axios colors readline https-proxy-agent async
FOR %%m IN (%modules%) DO (
    npm list %%m > nul 2>&1
    IF ERRORLEVEL 1 (
        echo Đang cài đặt module %%m ...
        npm install %%m
    ) ELSE (
        echo Module %%m đã được cài đặt.
    )
)



pause
