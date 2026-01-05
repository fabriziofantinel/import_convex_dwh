# Script PowerShell per esportare i sync logs da Convex Dashboard a SQL Server
# Uso: .\sync_logs.ps1
# Uso con filtro giorni: .\sync_logs.ps1 -Days 30

param(
    [int]$Days = 0  # 0 = tutti i log
)

$PYTHON_PATH = "C:\Users\Fabrizio Fantinel\AppData\Local\Programs\Python\Python311\python.exe"
$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "=== Sync Logs Export ===" -ForegroundColor Cyan
Write-Host ""

# Cambia directory allo script
Set-Location $SCRIPT_DIR

try {
    if ($Days -gt 0) {
        Write-Host "Esportazione log ultimi $Days giorni..." -ForegroundColor Yellow
        & $PYTHON_PATH sync_logs.py --days $Days
    } else {
        Write-Host "Esportazione tutti i log..." -ForegroundColor Yellow
        & $PYTHON_PATH sync_logs.py
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "[OK] Esportazione completata!" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "ERRORE: Esportazione fallita (exit code: $LASTEXITCODE)" -ForegroundColor Red
        exit 1
    }
}
catch {
    Write-Host "ERRORE: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== Completato ===" -ForegroundColor Green
exit 0
