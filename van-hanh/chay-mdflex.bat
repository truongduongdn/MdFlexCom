@echo off
rem Khoi dong MdFlex tren may that: kiem tra nhanh -> sao luu -> chay 2 may chu -> mo trinh duyet.
rem Bam dup tep nay, hoac dat loi tat vao shell:startup de tu chay khi dang nhap Windows.
chcp 65001 >nul
setlocal
cd /d "%~dp0.."
set "PORT="

where node >nul 2>nul
if errorlevel 1 (
  echo Chua cai Node.js 18+. Tai tai https://nodejs.org roi chay lai.
  pause
  exit /b 1
)

node van-hanh\kiem-tra.js --nhanh
if errorlevel 1 (
  echo.
  echo Kiem tra co LOI - sua theo cac dong danh dau X o tren roi chay lai.
  pause
  exit /b 1
)

node van-hanh\sao-luu.js
if errorlevel 1 (
  echo Sao luu that bai - van khoi dong, nhung hay xem lai SAO_LUU_DIR.
)

netstat -ano | findstr /R /C:"127.0.0.1:3100 .*LISTENING" >nul
if errorlevel 1 (
  start "MdFlex - Khung chat Phieu yeu cau (3100)" /d "%~dp0..\apps\ceo-intake" cmd /k node server.js
) else (
  echo Khung chat da chay san o cong 3100.
)

netstat -ano | findstr /R /C:"127.0.0.1:3200 .*LISTENING" >nul
if errorlevel 1 (
  start "MdFlex - Mo hinh 3D (3200)" /d "%~dp0..\apps\mo-hinh-3d" cmd /k node server.js
) else (
  echo Mo hinh 3D da chay san o cong 3200.
)

ping -n 3 127.0.0.1 >nul
start "" http://localhost:3200/ceo.html
start "" http://localhost:3100
echo.
echo Da mo Bang CEO (3200/ceo.html) va Khung chat (3100). Tat may chu: dong 2 cua so MdFlex.
endlocal
