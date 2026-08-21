@echo off
setlocal

call npm ci || exit /b 1
call npm ci --prefix payload-cms || exit /b 1
call npm run verify || exit /b 1

echo Kiem tra hoan tat. Hay xem git status va commit co chu dich truoc khi push.
echo Script khong tu git add, commit hoac force-push.
