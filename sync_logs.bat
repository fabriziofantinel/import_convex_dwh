@echo off
REM Script per esportare i sync logs da Convex Dashboard a SQL Server
REM Uso: sync_logs.bat [days]

cd /d "%~dp0"

if "%1"=="" (
    python sync_logs.py
) else (
    python sync_logs.py --days %1
)

pause
