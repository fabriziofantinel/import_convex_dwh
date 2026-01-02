@echo off
echo ========================================
echo Convex to SQL Server Sync - Setup
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python non trovato. Installare Python 3.8 o superiore.
    echo Download: https://www.python.org/downloads/
    pause
    exit /b 1
)

echo [1/4] Creazione ambiente virtuale...
if exist venv (
    echo Ambiente virtuale gia esistente. Rimuovere? (S/N)
    set /p remove=
    if /i "%remove%"=="S" (
        rmdir /s /q venv
        python -m venv venv
    )
) else (
    python -m venv venv
)

if not exist venv (
    echo ERROR: Impossibile creare ambiente virtuale.
    pause
    exit /b 1
)

echo [2/4] Attivazione ambiente virtuale...
call venv\Scripts\activate.bat

echo [3/4] Installazione dipendenze...
pip install --upgrade pip
pip install -r requirements.txt

if errorlevel 1 (
    echo ERROR: Installazione dipendenze fallita.
    pause
    exit /b 1
)

echo [4/4] Creazione directory logs...
if not exist logs mkdir logs

echo.
echo ========================================
echo Setup completato con successo!
echo ========================================
echo.
echo Prossimi passi:
echo 1. Copiare config.example.json in config.json
echo 2. Configurare i parametri in config.json
echo 3. Eseguire: python sync.py ^<app_name^>
echo.
echo Per attivare l'ambiente virtuale:
echo   venv\Scripts\activate
echo.
pause
