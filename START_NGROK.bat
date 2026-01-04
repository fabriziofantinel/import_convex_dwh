@echo off
echo ========================================
echo    AVVIO NGROK TUNNEL
echo ========================================
echo.
echo Avvio ngrok per esporre il webhook server...
echo URL locale: http://localhost:5000
echo.
echo IMPORTANTE: Copia il nuovo URL https://xxx.ngrok-free.dev
echo e aggiornalo su Vercel in NEXT_PUBLIC_WEBHOOK_URL
echo.
pause
echo.
echo Avvio ngrok...
ngrok http 5000