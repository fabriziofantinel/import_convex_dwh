# Script per listare tutte le app disponibili in Convex (PRODUZIONE)

# Usa l'URL di produzione di Convex
$CONVEX_URL = "https://talented-meerkat-929.convex.cloud"

if (-not $CONVEX_URL) {
    Write-Host "ERRORE: NEXT_PUBLIC_CONVEX_URL non configurata" -ForegroundColor Red
    exit 1
}

Write-Host "=== App Disponibili in Convex ===" -ForegroundColor Cyan
Write-Host ""

try {
    $url = "$CONVEX_URL/api/query"
    $body = @{
        path = "queries:listSyncApps"
        args = @{}
        format = "json"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri $url -Method Post -Body $body -ContentType "application/json"
    
    if ($response.value -and $response.value.Count -gt 0) {
        Write-Host "Trovate $($response.value.Count) app:" -ForegroundColor Green
        Write-Host ""
        
        foreach ($app in $response.value) {
            Write-Host "Nome: $($app.name)" -ForegroundColor White
            Write-Host "  ID: $($app._id)" -ForegroundColor Gray
            Write-Host "  Deploy Key: $($app.deploy_key)" -ForegroundColor Gray
            Write-Host "  Tabelle: $($app.tables -join ', ')" -ForegroundColor Gray
            Write-Host ""
        }
    }
    else {
        Write-Host "Nessuna app trovata nel database" -ForegroundColor Yellow
        Write-Host "Crea una nuova app dalla dashboard: https://import-convex-dwh.vercel.app" -ForegroundColor Cyan
    }
}
catch {
    Write-Host "ERRORE: $($_.Exception.Message)" -ForegroundColor Red
}
