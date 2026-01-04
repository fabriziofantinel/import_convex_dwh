@echo off
echo Avvio Sync Scheduler Autonomo...
echo.
echo Questo scheduler sostituisce il cron di Vercel
echo Controlla automaticamente l'orario impostato nell'app
echo e triggera il sync all'orario corretto
echo.
echo Per fermare: Ctrl+C
echo.

REM Installa schedule se non presente
pip install schedule requests python-dotenv

REM Avvia scheduler
"C:\Users\Fabrizio Fantinel\AppData\Local\Programs\Python\Python311\python.exe" cron_scheduler.py

pause