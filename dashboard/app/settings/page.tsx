'use client';

import { ProtectedRoute } from '@/components/auth';
import { DashboardLayout } from '@/components/layout';
import { useToastContext } from '@/components/providers/ToastProvider';

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <SettingsContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}

function SettingsContent() {
  const toast = useToastContext();

  // Download trigger_sync.ps1
  const downloadTriggerSync = () => {
    const scriptContent = `# Script PowerShell per triggerare sync - replica il tasto "Sync Now"
# Uso: .\\trigger_sync.ps1 -AppName "nome_app"

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
`;
    downloadFile(scriptContent, 'trigger_sync.ps1');
    toast.success("Download avviato!", "trigger_sync.ps1 scaricato");
  };

  // Download sync_logs.ps1
  const downloadSyncLogs = () => {
    const scriptContent = `# Script PowerShell per esportare i sync logs da Convex Dashboard a SQL Server
# Uso: .\\sync_logs.ps1
# Uso con filtro giorni: .\\sync_logs.ps1 -Days 30

param(
    [int]$Days = 0  # 0 = tutti i log
)

$PYTHON_PATH = "C:\\Users\\Fabrizio Fantinel\\AppData\\Local\\Programs\\Python\\Python311\\python.exe"
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
`;
    downloadFile(scriptContent, 'sync_logs.ps1');
    toast.success("Download avviato!", "sync_logs.ps1 scaricato");
  };

  // Helper function to download file
  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiato!", "Codice copiato negli appunti");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-sm text-gray-600">
          Script PowerShell per schedulare sync e esportare log
        </p>
      </div>

      {/* Script trigger_sync.ps1 */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-green-900">
            📅 Script trigger_sync.ps1
          </h3>
          <button
            onClick={downloadTriggerSync}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download
          </button>
        </div>
        
        <p className="text-sm text-green-800 mb-4">
          Questo script permette di avviare la sincronizzazione di un&apos;app da riga di comando o da Windows Task Scheduler.
          Replica il tasto &quot;Sync Now&quot; della dashboard.
        </p>

        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-green-900 mb-2">Uso:</h4>
            <code className="block bg-gray-900 text-gray-100 px-3 py-2 rounded text-sm">
              .\trigger_sync.ps1 -AppName &quot;nome_app&quot;
            </code>
          </div>

          <div>
            <h4 className="font-medium text-green-900 mb-2">Task Scheduler - Configurazione:</h4>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-green-800 font-medium">Program/script:</span>
                <code className="block bg-gray-900 text-gray-100 px-3 py-2 rounded text-sm mt-1">
                  powershell.exe
                </code>
              </div>
              <div>
                <span className="text-green-800 font-medium">Arguments:</span>
                <code className="block bg-gray-900 text-gray-100 px-3 py-2 rounded text-sm mt-1">
                  -ExecutionPolicy Bypass -File &quot;C:\path\to\trigger_sync.ps1&quot; -AppName &quot;nome_app&quot;
                </code>
              </div>
            </div>
          </div>
        </div>

        {/* Script code */}
        <div className="mt-4 relative">
          <button
            onClick={() => copyToClipboard(`# Script PowerShell per triggerare sync
param([Parameter(Mandatory=$true)][string]$AppName)
$VERCEL_URL = "https://import-convex-dwh.vercel.app"
$body = @{ app_name = $AppName } | ConvertTo-Json
$response = Invoke-RestMethod -Uri "$VERCEL_URL/api/trigger-sync-by-name" -Method Post -Body $body -ContentType "application/json"
Write-Host "Job ID: $($response.job_id)"`)}
            className="absolute top-2 right-2 px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs transition-colors"
          >
            Copia
          </button>
          <pre className="bg-gray-900 text-gray-100 px-4 py-3 rounded-lg text-xs overflow-x-auto max-h-48 overflow-y-auto">
{`# Script PowerShell per triggerare sync - replica il tasto "Sync Now"
# Uso: .\\trigger_sync.ps1 -AppName "nome_app"

param(
    [Parameter(Mandatory=$true)]
    [string]$AppName
)

$VERCEL_URL = "https://import-convex-dwh.vercel.app"
$body = @{ app_name = $AppName } | ConvertTo-Json
$response = Invoke-RestMethod -Uri "$VERCEL_URL/api/trigger-sync-by-name" \\
    -Method Post -Body $body -ContentType "application/json"
Write-Host "Job ID: $($response.job_id)"`}
          </pre>
        </div>
      </div>

      {/* Script sync_logs.ps1 */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-purple-900">
            📊 Script sync_logs.ps1
          </h3>
          <button
            onClick={downloadSyncLogs}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-sm font-medium transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download
          </button>
        </div>
        
        <p className="text-sm text-purple-800 mb-4">
          Questo script esporta i log di sincronizzazione (sync_jobs) da Convex Dashboard alla tabella SQL Server 
          <code className="bg-purple-100 px-1 py-0.5 rounded mx-1">convex_dashboard_sync_jobs</code>.
          Utile per analisi e reportistica nel DWH.
        </p>

        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-purple-900 mb-2">Uso:</h4>
            <div className="space-y-2">
              <code className="block bg-gray-900 text-gray-100 px-3 py-2 rounded text-sm">
                .\sync_logs.ps1                  # Esporta tutti i log
              </code>
              <code className="block bg-gray-900 text-gray-100 px-3 py-2 rounded text-sm">
                .\sync_logs.ps1 -Days 30         # Esporta ultimi 30 giorni
              </code>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-purple-900 mb-2">Tabella SQL creata:</h4>
            <code className="block bg-gray-900 text-gray-100 px-3 py-2 rounded text-sm">
              [dbo].[convex_dashboard_sync_jobs]
            </code>
            <p className="text-xs text-purple-700 mt-2">
              Contiene: _id, app_id, app_name, status, triggered_by, started_at, completed_at, duration_seconds, tables_processed, rows_imported, error_message
            </p>
          </div>

          <div>
            <h4 className="font-medium text-purple-900 mb-2">Requisiti:</h4>
            <ul className="list-disc list-inside text-sm text-purple-800 space-y-1">
              <li>Python 3.11+ installato</li>
              <li>Libreria <code className="bg-purple-100 px-1 py-0.5 rounded">pyodbc</code> installata</li>
              <li>File <code className="bg-purple-100 px-1 py-0.5 rounded">sync_logs.py</code> nella stessa cartella</li>
            </ul>
          </div>
        </div>

        {/* Script code */}
        <div className="mt-4 relative">
          <button
            onClick={() => copyToClipboard(`# Script PowerShell per esportare sync logs
param([int]$Days = 0)
$PYTHON_PATH = "python"
if ($Days -gt 0) { & $PYTHON_PATH sync_logs.py --days $Days }
else { & $PYTHON_PATH sync_logs.py }`)}
            className="absolute top-2 right-2 px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs transition-colors"
          >
            Copia
          </button>
          <pre className="bg-gray-900 text-gray-100 px-4 py-3 rounded-lg text-xs overflow-x-auto max-h-48 overflow-y-auto">
{`# Script PowerShell per esportare i sync logs
# Uso: .\\sync_logs.ps1 [-Days 30]

param([int]$Days = 0)

$PYTHON_PATH = "C:\\path\\to\\python.exe"
Set-Location (Split-Path -Parent $MyInvocation.MyCommand.Path)

if ($Days -gt 0) {
    & $PYTHON_PATH sync_logs.py --days $Days
} else {
    & $PYTHON_PATH sync_logs.py
}`}
          </pre>
        </div>
      </div>

      {/* Info box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">
          ℹ️ Informazioni
        </h3>
        <ul className="list-disc list-inside space-y-2 text-sm text-blue-800">
          <li>Gli script sono progettati per Windows Task Scheduler</li>
          <li>Assicurati che webhook server e ngrok siano attivi per trigger_sync</li>
          <li>sync_logs non richiede webhook server (si connette direttamente a Convex)</li>
          <li>Modifica il percorso Python negli script se necessario</li>
        </ul>
      </div>
    </div>
  );
}
