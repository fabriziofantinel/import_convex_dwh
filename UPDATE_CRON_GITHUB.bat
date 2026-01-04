@echo off
echo ========================================
echo    AGGIORNAMENTO CRON JOB SU GITHUB
echo ========================================
echo.
echo Aggiornamento vercel.json per orario 01:27 Roma (00:27 UTC)
echo.
echo Eseguendo git add...
git add dashboard/vercel.json

echo.
echo Eseguendo git commit...
git commit -m "Update cron schedule to 01:27 Rome time (00:27 UTC)"

echo.
echo Eseguendo git push...
git push origin main

echo.
echo ========================================
echo    AGGIORNAMENTO COMPLETATO!
echo ========================================
echo.
echo Prossimi passi:
echo 1. Vercel farà il deployment automaticamente
echo 2. Il nuovo cron job sarà attivo tra 1-2 minuti
echo 3. Il prossimo sync sarà alle 01:27 (domani)
echo.
pause