@echo off
echo ========================================
echo VERIFICA STATO SISTEMA COMPLETO
echo ========================================
echo.

echo 1. VERIFICA PROCESSI ATTIVI:
echo.
tasklist | findstr "python.exe"
tasklist | findstr "ngrok.exe"
echo.

echo 2. VERIFICA SCHEDULAZIONE APP:
echo.
curl -s "https://import-convex-dwh.vercel.app/api/cron/check-scheduled-syncs"
echo.
echo.

echo 3. TEST CONNETTIVITA WEBHOOK:
echo.
curl -s -X POST "https://complicative-unimplicitly-greta.ngrok-free.dev/api/fetch-tables" ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer test-token-12345" ^
  -H "ngrok-skip-browser-warning: true" ^
  -d "{\"deploy_key\":\"prod:blissful-schnauzer-295\"}"
echo.
echo.

echo 4. STATO SCHEDULER (ultimi log):
echo.
echo Controlla la finestra dello scheduler per i log in tempo reale
echo.

echo ========================================
echo VERIFICA COMPLETATA
echo ========================================
pause