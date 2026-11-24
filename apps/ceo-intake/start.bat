@echo off
chcp 65001 >nul
cd /d %~dp0
echo Dang chay Khung chat Phieu yeu cau tai http://localhost:3100
start "" http://localhost:3100
node server.js
pause
