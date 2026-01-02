@echo off
REM ============================================
REM Convex to SQL Server Sync - Esecuzione Rapida
REM ============================================

echo.
echo ========================================
echo CONVEX TO SQL SERVER SYNC
echo ========================================
echo.

REM Verifica argomento app_name
if "%~1"=="" (
    echo ERRORE: Specificare nome applicazione
    echo.
    echo Uso: RUN.bat ^<app_name^>
    echo.
    echo Esempio:
    echo   RUN.bat appclinics
    echo.
    pause
    exit /b 1
)

REM Trova Python
set PYTHON_EXE=
if exist "C:\Users\Fabrizio Fantinel\AppData\Local\Programs\Python\Python311\python.exe" (
    set PYTHON_EXE="C:\Users\Fabrizio Fantinel\AppData\Local\Programs\Python\Python311\python.exe"
    goto :run_sync
)

REM Prova py
where py >nul 2>&1
if not errorlevel 1 (
    set PYTHON_EXE=py
    goto :run_sync
)

REM Prova python
where python >nul 2>&1
if not errorlevel 1 (
    set PYTHON_EXE=python
    goto :run_sync
)

echo ERRORE: Python non trovato!
echo Installa Python o aggiungi al PATH
pause
exit /b 1

:run_sync
echo Esecuzione sync per: %1
echo.

%PYTHON_EXE% sync.py %1

set EXIT_CODE=%ERRORLEVEL%

echo.
echo ========================================
if %EXIT_CODE%==0 (
    echo SYNC COMPLETATO CON SUCCESSO
    echo ========================================
) else (
    echo SYNC FALLITO - Exit Code: %EXIT_CODE%
    echo ========================================
    if %EXIT_CODE%==1 echo Tipo Errore: Configuration Error
    if %EXIT_CODE%==2 echo Tipo Errore: Authentication Error
    if %EXIT_CODE%==3 echo Tipo Errore: Network Error
    if %EXIT_CODE%==4 echo Tipo Errore: Data Error
    if %EXIT_CODE%==5 echo Tipo Errore: Import Error
)
echo.

pause
exit /b %EXIT_CODE%
