# Script PowerShell per triggerare sync - replica il tasto "Sync Now"
# Uso: .\trigger_sync.ps1 -AppName "nome_app"

param(
    [Parameter(Mandatory=$true)]
    [string]$AppName
)

$VERCEL_URL = "https://import-convex-dwh.vercel.app"

Write-Host "=== Trigger Sync: $AppName ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "Avvio sincronizzazione..." -ForegroundColor Yellow

try {
    $body = @{
        app_name = $AppName
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$VERCEL_URL/api/trigger-sync-by-name" -Method Post -Body $body -ContentType "application/json"
    
    Write-Host "[OK] Sincronizzazione avviata!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Job ID: $($response.job_id)" -ForegroundColor White
    Write-Host "App: $($response.app_name)" -ForegroundColor White
    Write-Host ""
    Write-Host "Monitora su: $VERCEL_URL/logs" -ForegroundColor Cyan
    Write-Host ""
}
catch {
    $errorMessage = $_.Exception.Message
    if ($_.ErrorDetails.Message) {
        $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json
        $errorMessage = $errorDetails.error
    }
    Write-Host "ERRORE: $errorMessage" -ForegroundColor Red
    exit 1
}

Write-Host "=== Completato ===" -ForegroundColor Green
exit 0
