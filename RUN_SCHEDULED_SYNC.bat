@echo off
REM Script per eseguire il sync schedulato
REM Questo script viene chiamato dal Task Scheduler di Windows

cd /d "%~dp0"

REM Esegui lo script Python
"C:\Users\Fabrizio Fantinel\AppData\Local\Programs\Python\Python311\python.exe" scheduled_sync_runner.py

REM Exit con il codice di ritorno dello script Python
exit /b %ERRORLEVEL%
