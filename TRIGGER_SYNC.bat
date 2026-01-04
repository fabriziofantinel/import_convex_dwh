@echo off
REM Script batch per triggerare una sincronizzazione tramite Vercel
REM Uso: TRIGGER_SYNC.bat nome_app

if "%1"=="" (
    echo ERRORE: Specificare il nome dell'app
    echo Uso: TRIGGER_SYNC.bat nome_app
    echo.
    echo Esempio: TRIGGER_SYNC.bat clinicsapp
    exit /b 1
)

REM Esegui lo script PowerShell
powershell -ExecutionPolicy Bypass -File "%~dp0trigger_sync.ps1" -AppName "%1"

exit /b %ERRORLEVEL%
