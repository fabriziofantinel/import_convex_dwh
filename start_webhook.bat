@echo off
echo ========================================
echo   Avvio Webhook Server
echo ========================================
echo.

cd /d "%~dp0"

echo Avvio del webhook server sulla porta 5000...
echo.
echo IMPORTANTE: Tieni questo terminale aperto!
echo.
echo Dopo aver avviato questo script:
echo 1. Apri un ALTRO terminale
echo 2. Esegui: ngrok http 5000
echo 3. Copia l'URL https da ngrok
echo 4. Aggiorna WEBHOOK_URL su Vercel
echo.

"C:\Users\Fabrizio Fantinel\AppData\Local\Programs\Python\Python311\python.exe" webhook_server.py

pause
