"use client";

import { useState, useEffect } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { LoadingButton } from "@/components/ui/LoadingButton";
import { useToastContext } from "@/components/providers/ToastProvider";

/**
 * Services Control Page
 * Manage webhook server and ngrok tunnel
 */

interface ServiceStatus {
  name: string;
  status: "running" | "stopped" | "unknown";
  url?: string;
  lastCheck?: string;
}

export default function ServicesPage() {
  const toast = useToastContext();
  const [webhookStatus, setWebhookStatus] = useState<ServiceStatus>({
    name: "Webhook Server",
    status: "unknown",
  });
  const [ngrokStatus, setNgrokStatus] = useState<ServiceStatus>({
    name: "Ngrok Tunnel",
    status: "unknown",
  });
  const [isCheckingWebhook, setIsCheckingWebhook] = useState(false);
  const [isCheckingNgrok, setIsCheckingNgrok] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Check webhook server status
  const checkWebhookStatus = async () => {
    setIsCheckingWebhook(true);
    try {
      const response = await fetch("/api/check-webhook-status", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setWebhookStatus({
          name: "Webhook Server",
          status: data.status,
          url: data.url,
          lastCheck: new Date().toLocaleTimeString(),
        });
      } else {
        setWebhookStatus({
          name: "Webhook Server",
          status: "stopped",
          lastCheck: new Date().toLocaleTimeString(),
        });
      }
    } catch (error) {
      setWebhookStatus({
        name: "Webhook Server",
        status: "stopped",
        lastCheck: new Date().toLocaleTimeString(),
      });
    } finally {
      setIsCheckingWebhook(false);
    }
  };

  // Check ngrok status
  const checkNgrokStatus = async () => {
    setIsCheckingNgrok(true);
    try {
      const response = await fetch("/api/check-ngrok-status", {
        method: "GET",
      });

      if (response.ok) {
        const data = await response.json();
        setNgrokStatus({
          name: "Ngrok Tunnel",
          status: data.status,
          url: data.url,
          lastCheck: new Date().toLocaleTimeString(),
        });
      } else {
        setNgrokStatus({
          name: "Ngrok Tunnel",
          status: "stopped",
          lastCheck: new Date().toLocaleTimeString(),
        });
      }
    } catch (error) {
      setNgrokStatus({
        name: "Ngrok Tunnel",
        status: "stopped",
        lastCheck: new Date().toLocaleTimeString(),
      });
    } finally {
      setIsCheckingNgrok(false);
    }
  };

  // Check both services
  const checkAllServices = () => {
    checkWebhookStatus();
    checkNgrokStatus();
  };

  // Auto-refresh every 10 seconds
  useEffect(() => {
    checkAllServices();

    if (autoRefresh) {
      const interval = setInterval(checkAllServices, 10000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  // Copy URL to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied!", "URL copied to clipboard");
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "running":
        return "bg-green-100 text-green-800";
      case "stopped":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "running":
        return (
          <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case "stopped":
        return (
          <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Services</h1>
              <p className="text-gray-500 mt-1">
                Manage webhook server and ngrok tunnel
              </p>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                Auto-refresh
              </label>
              <LoadingButton
                onClick={checkAllServices}
                isLoading={isCheckingWebhook || isCheckingNgrok}
                variant="secondary"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </LoadingButton>
            </div>
          </div>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Webhook Server Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                {getStatusIcon(webhookStatus.status)}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {webhookStatus.name}
                  </h2>
                  <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full mt-1 ${getStatusColor(webhookStatus.status)}`}>
                    {webhookStatus.status.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {webhookStatus.url && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Local URL
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={webhookStatus.url}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
                  />
                  <button
                    onClick={() => copyToClipboard(webhookStatus.url!)}
                    className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                    title="Copy URL"
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {webhookStatus.lastCheck && (
              <p className="text-xs text-gray-500 mb-4">
                Last checked: {webhookStatus.lastCheck}
              </p>
            )}

            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                To start the webhook server, run:
              </p>
              <code className="block bg-gray-900 text-gray-100 px-3 py-2 rounded text-sm">
                python webhook_server.py
              </code>
              <p className="text-xs text-gray-500 mt-2">
                Or use: <code className="bg-gray-100 px-1 py-0.5 rounded">start_webhook_server.bat</code>
              </p>
            </div>
          </div>

          {/* Ngrok Tunnel Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                {getStatusIcon(ngrokStatus.status)}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {ngrokStatus.name}
                  </h2>
                  <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full mt-1 ${getStatusColor(ngrokStatus.status)}`}>
                    {ngrokStatus.status.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {ngrokStatus.url && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Public URL
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={ngrokStatus.url}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
                  />
                  <button
                    onClick={() => copyToClipboard(ngrokStatus.url!)}
                    className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                    title="Copy URL"
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {ngrokStatus.lastCheck && (
              <p className="text-xs text-gray-500 mb-4">
                Last checked: {ngrokStatus.lastCheck}
              </p>
            )}

            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                To start ngrok tunnel, run:
              </p>
              <code className="block bg-gray-900 text-gray-100 px-3 py-2 rounded text-sm">
                ngrok http 5000
              </code>
              <p className="text-xs text-gray-500 mt-2">
                Or use: <code className="bg-gray-100 px-1 py-0.5 rounded">START_NGROK.bat</code>
              </p>
            </div>

            {ngrokStatus.url && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">
                  <strong>Important:</strong> Update this URL in Vercel environment variable <code className="bg-yellow-100 px-1 py-0.5 rounded">NEXT_PUBLIC_WEBHOOK_URL</code>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            Quick Start Guide
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
            <li>Start the webhook server using <code className="bg-blue-100 px-1 py-0.5 rounded">start_webhook_server.bat</code></li>
            <li>Start ngrok tunnel using <code className="bg-blue-100 px-1 py-0.5 rounded">START_NGROK.bat</code></li>
            <li>Copy the ngrok public URL (https://xxx.ngrok-free.dev)</li>
            <li>Update <code className="bg-blue-100 px-1 py-0.5 rounded">NEXT_PUBLIC_WEBHOOK_URL</code> on Vercel with the new URL</li>
            <li>Redeploy the dashboard on Vercel</li>
          </ol>
        </div>

        {/* Task Scheduler Instructions */}
        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-900 mb-3">
            📅 Schedulare Sync Automatici (Windows Task Scheduler)
          </h3>
          <p className="text-sm text-green-800 mb-4">
            Usa lo script PowerShell <code className="bg-green-100 px-1 py-0.5 rounded">trigger_sync.ps1</code> per schedulare sync automatici delle app.
          </p>
          
          <div className="space-y-4">
            {/* Manual test */}
            <div>
              <h4 className="font-medium text-green-900 mb-2">1. Test manuale</h4>
              <code className="block bg-gray-900 text-gray-100 px-3 py-2 rounded text-sm">
                .\trigger_sync.ps1 -AppName &quot;nome_app&quot;
              </code>
            </div>

            {/* Create scheduled task */}
            <div>
              <h4 className="font-medium text-green-900 mb-2">2. Creare Task Schedulato</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-green-800 ml-2">
                <li>Apri <strong>Task Scheduler</strong> (taskschd.msc)</li>
                <li>Click <strong>Create Basic Task</strong></li>
                <li>Nome: <code className="bg-green-100 px-1 py-0.5 rounded">Sync [NomeApp]</code></li>
                <li>Trigger: <strong>Daily</strong> o <strong>Weekly</strong> all&apos;orario desiderato</li>
                <li>Action: <strong>Start a program</strong></li>
              </ol>
            </div>

            {/* Program settings */}
            <div>
              <h4 className="font-medium text-green-900 mb-2">3. Configurazione Programma</h4>
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
                <div>
                  <span className="text-green-800 font-medium">Start in:</span>
                  <code className="block bg-gray-900 text-gray-100 px-3 py-2 rounded text-sm mt-1">
                    C:\path\to\project
                  </code>
                </div>
              </div>
            </div>

            {/* Important notes */}
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                <strong>⚠️ Importante:</strong> Assicurati che il webhook server e ngrok siano in esecuzione quando il task viene eseguito. 
                Puoi creare task separati per avviarli all&apos;avvio del sistema.
              </p>
            </div>

            {/* List apps */}
            <div>
              <h4 className="font-medium text-green-900 mb-2">📋 Lista App Disponibili</h4>
              <p className="text-sm text-green-800 mb-2">Per vedere le app configurate:</p>
              <code className="block bg-gray-900 text-gray-100 px-3 py-2 rounded text-sm">
                .\list_apps.ps1
              </code>
            </div>
          </div>
        </div>

        {/* Script Download Section */}
        <div className="mt-6 bg-purple-50 border border-purple-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-purple-900">
              📜 Script trigger_sync.ps1
            </h3>
            <button
              onClick={() => {
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
                const blob = new Blob([scriptContent], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'trigger_sync.ps1';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                toast.success("Download avviato!", "Script scaricato");
              }}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-sm font-medium transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download Script
            </button>
          </div>
          
          <p className="text-sm text-purple-800 mb-4">
            Questo script PowerShell permette di avviare la sincronizzazione di un&apos;app da riga di comando o da Windows Task Scheduler.
          </p>

          {/* Script code */}
          <div className="relative">
            <button
              onClick={() => {
                const code = `# Script PowerShell per triggerare sync - replica il tasto "Sync Now"
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
exit 0`;
                navigator.clipboard.writeText(code);
                toast.success("Copiato!", "Script copiato negli appunti");
              }}
              className="absolute top-2 right-2 px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs transition-colors"
              title="Copia codice"
            >
              Copia
            </button>
            <pre className="bg-gray-900 text-gray-100 px-4 py-3 rounded-lg text-xs overflow-x-auto max-h-80 overflow-y-auto">
{`# Script PowerShell per triggerare sync - replica il tasto "Sync Now"
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

    $response = Invoke-RestMethod -Uri "$VERCEL_URL/api/trigger-sync-by-name" \\
        -Method Post -Body $body -ContentType "application/json"
    
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
exit 0`}
            </pre>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
