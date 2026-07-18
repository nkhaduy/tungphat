@echo off
setlocal

call npm ci || exit /b 1
call npm run lint || exit /b 1
call npm run typecheck || exit /b 1
call npm test || exit /b 1
call npm run build || exit /b 1
call npm run validate:links || exit /b 1
call npm run validate:cloudflare-config || exit /b 1
git diff --check || exit /b 1

echo Kiem tra hoan tat. Hay xem git status va commit co chu dich truoc khi push.
echo Script khong tu git add, commit hoac force-push.
