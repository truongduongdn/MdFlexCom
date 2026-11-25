@echo off
cd /d "%~dp0"
if "%PERPLEXITY_API_KEY%"=="" echo Chua dat PERPLEXITY_API_KEY - tab Thiet ke AI se chua gui duoc yeu cau.
start "" http://localhost:3200
node server.js
pause
