@echo off
echo ======================================================================
echo Starting Webhook Server
echo ======================================================================
echo.

REM Check if .env exists
if not exist .env (
    echo ERROR: .env file not found!
    echo.
    echo Please create .env file from .env.webhook.example:
    echo   copy .env.webhook.example .env
    echo.
    echo Then edit .env with your configuration.
    echo.
    pause
    exit /b 1
)

REM Check if Flask is installed
"C:\Users\Fabrizio Fantinel\AppData\Local\Programs\Python\Python311\python.exe" -c "import flask" 2>nul
if errorlevel 1 (
    echo ERROR: Flask not installed!
    echo.
    echo Please install dependencies:
    echo   pip install -r requirements.txt
    echo.
    pause
    exit /b 1
)

echo Starting webhook server...
echo Press Ctrl+C to stop
echo.

"C:\Users\Fabrizio Fantinel\AppData\Local\Programs\Python\Python311\python.exe" webhook_server.py

pause
