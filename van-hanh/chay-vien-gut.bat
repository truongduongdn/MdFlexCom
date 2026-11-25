@echo off
rem Khoi dong voi co cau Vien Gut (CO_CAU=vien-gut) - dung tren may phu H:\VGC.
rem May chinh chay co cau MdFlex: dung chay-mdflex.bat, KHONG dung tep nay.
setlocal
set "CO_CAU=vien-gut"
call "%~dp0chay-mdflex.bat"
endlocal
