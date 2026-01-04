# 🧪 TEST MANUALE DAL BROWSER

## Test Rapido: Verifica che ngrok Funzioni

### Opzione 1: Test Health Endpoint

Apri questa URL nel browser:
```
https://complicative-unimplicitly-greta.ngrok-free.dev/health
```

**Risultato Atteso**:
1. ngrok mostra una pagina di warning (normale per free tier)
2. Clicca "Visit Site"
3. Vedi un JSON tipo:
```json
{
  "status": "healthy",
  "timestamp": "2026-01-04T02:45:00",
  "running_syncs": [],
  "python_exe": "C:\\Users\\Fabrizio Fantinel\\...",
  "sync_script": "sync.py",
  "rate_limiting": {...}
}
```

Se vedi questo → ✅ ngrok funziona!

### Opzione 2: Test con curl (se hai curl installato)

Apri PowerShell e esegui:
```powershell
curl https://complicative-unimplicitly-greta.ngrok-free.dev/health
```

**Risultato Atteso**: Vedi il JSON sopra

## Test Completo: Fetch Tables

### Con PowerShell

```powershell
$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer test-token-12345"
    "ngrok-skip-browser-warning" = "true"
}

$body = @{
    deploy_key = "dev:bold-husky-496|eyJ2MiI6ImFkNGNmOGI4YjBhYzRlYWY5NGRlYTFhZGI2Njg1NTcyIn0="
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://complicative-unimplicitly-greta.ngrok-free.dev/api/fetch-tables" -Method Post -Headers $headers -Body $body
```

**Risultato Atteso**:
```
success tables
------- ------
   True {cliniche, numbers}
```

### Con Python

```python
import requests

response = requests.post(
    "https://complicative-unimplicitly-greta.ngrok-free.dev/api/fetch-tables",
    headers={
        "Content-Type": "application/json",
        "Authorization": "Bearer test-token-12345",
        "ngrok-skip-browser-warning": "true"
    },
    json={
        "deploy_key": "dev:bold-husky-496|eyJ2MiI6ImFkNGNmOGI4YjBhYzRlYWY5NGRlYTFhZGI2Njg1NTcyIn0="
    }
)

print(response.json())
```

**Risultato Atteso**:
```python
{
    'success': True,
    'tables': ['cliniche', 'numbers']
}
```

## Test Dashboard Vercel

### 1. Apri Developer Tools nel Browser
1. Vai su: https://import-convex-dwh.vercel.app
2. Premi F12 (apre Developer Tools)
3. Vai su tab "Network"
4. Clicca "New Application"

### 2. Compila Form
- Name: `test_app`
- Deploy Key: `dev:bold-husky-496|eyJ2MiI6ImFkNGNmOGI4YjBhYzRlYWY5NGRlYTFhZGI2Njg1NTcyIn0=`

### 3. Clicca "Fetch Tables"

### 4. Guarda Network Tab
Dovresti vedere una richiesta a:
```
https://complicative-unimplicitly-greta.ngrok-free.dev/api/fetch-tables
```

**Se vedi questa richiesta**:
- Status 200 → ✅ Tutto funziona!
- Status 401 → ❌ Token sbagliato
- Status 500 → ❌ Errore nel webhook
- Nessuna richiesta → ❌ `NEXT_PUBLIC_WEBHOOK_URL` sbagliato su Vercel

**Se NON vedi questa richiesta**:
- Vedi richiesta a `http://localhost:5000` → ❌ `NEXT_PUBLIC_WEBHOOK_URL` non aggiornato
- Nessuna richiesta → ❌ JavaScript error, guarda tab "Console"

## Interpretazione Risultati

### ✅ Scenario Ideale
```
1. Richiesta parte verso ngrok URL
2. Status 200
3. Response contiene: {"success": true, "tables": ["cliniche", "numbers"]}
4. UI mostra le tabelle
```

### ❌ Scenario Problema: URL Sbagliato
```
1. Richiesta parte verso http://localhost:5000
2. Errore: "Failed to fetch" o CORS error
3. UI mostra errore
```

**Soluzione**: Aggiorna `NEXT_PUBLIC_WEBHOOK_URL` su Vercel

### ❌ Scenario Problema: ngrok Disconnesso
```
1. Richiesta parte verso ngrok URL
2. Timeout o 502 Bad Gateway
3. UI mostra errore
```

**Soluzione**: Riavvia ngrok

### ❌ Scenario Problema: Webhook Server Fermo
```
1. Richiesta parte verso ngrok URL
2. ngrok risponde ma webhook non risponde
3. Timeout
```

**Soluzione**: Riavvia webhook server

## 🎯 Cosa Fare Dopo i Test

Una volta che hai verificato:

1. **Se tutto funziona** → Dimmi "tutto ok" e procediamo con test sync completo
2. **Se fetch tables fallisce** → Dimmi cosa vedi nel Network tab
3. **Se hai dubbi** → Fai screenshot del Network tab e Console tab

## 📸 Screenshot Utili

Se qualcosa non funziona, fai screenshot di:
1. Network tab (richiesta fetch-tables)
2. Console tab (eventuali errori JavaScript)
3. Response della richiesta (se presente)

Questo mi aiuta a capire esattamente cosa non va!
