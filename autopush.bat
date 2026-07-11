@echo off
:loop
cls
echo ====================================================
echo    DANG CANH THU MUC TUNGPHAT TREN CODEX (WINDOWS)
echo     Tu dong commit va ghi de code len GitHub (10s)
echo ====================================================

:: Thêm tất cả thay đổi
git add .

:: Commit tự động kèm ngày giờ hiện tại
set "current_time=%date% %time%"
git commit -m "Auto sync: %current_time%" >nul 2>&1

:: Ép buộc đẩy đè từ máy lên nhánh main của GitHub
git push origin main --force

echo.
echo ====================================================
echo    DA SYNC LEN GITHUB! Dang doi 10s de tiep tuc...
echo ====================================================
timeout /t 10 >nul
goto loop