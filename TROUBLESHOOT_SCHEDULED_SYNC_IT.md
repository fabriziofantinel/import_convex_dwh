# Risoluzione Problemi Sincronizzazione Schedulata

## Problema
La sincronizzazione schedulata non parte automaticamente all'orario impostato.

## Diagnosi Effettuata

### ✅ Stato Sistema
- **Webhook server**: Attivo (ProcessId: 5)
- **Ngrok**: Attivo (ProcessId: 25284)
- **URL ngrok**: `https://complicative-unimplicitly-greta.ngrok-free.dev`
- **App schedulata**: `app1` alle `15 0 * * *` (00:15)

### ❌ Problemi Identificati

1. **Timing del Cron Job Vercel**
   - **Problema**: Il cron job di Vercel era configurato per le 02:00 (`0 2 * * *`)
   - **App schedulata**: alle 00:15 (`15 0 * * *`)
   - **Risultato**: Il cron job non partiva all'orario giusto

2. **Logica di Controllo Orario**
   - **Problema**: La funzione `shouldRunNow` non controllava l'orario specifico di ogni app
   - **Risultato**: Non rispettava gli orari individuali delle applicazioni

3. **Configurazione Variabili d'Ambiente**
   - **Problema**: `WEBHOOK_URL` e `WEBHOOK_TOKEN` potrebbero non essere configurati su Vercel
   - **Risultato**: Errore server nelle Convex Actions

4. **Ngrok Warning Page**
   - **Problema**: Ngrok mostra pagina di warning invece di inoltrare le richieste
   - **Risultato**: Le chiamate webhook falliscono

## Soluzioni Implementate

### 1. ✅ Aggiornamento Cron Job Vercel
```json
// dashboard/vercel.json
{
  "crons": [
    {
      "path": "/api/cron/check-scheduled-syncs",
      "schedule": "15 0 * * *"  // Cambiato da "0 2 * * *"
    }
  ]
}
```

### 2. ✅ Miglioramento Logica Controllo Orario
```typescript
// dashboard/app/api/cron/check-scheduled-syncs/route.ts
function shouldRunNow(cronExpression: string, lastRunTime?: number): boolean {
  // Ora controlla l'orario specifico con tolleranza di 5 minuti
  // Previene esecuzioni duplicate nello stesso giorno
}
```

## Soluzioni da Completare

### 3. ⚠️ Configurazione Variabili d'Ambiente Vercel

**Azione Richiesta**: Configurare su Vercel Dashboard:

1. Vai su **Vercel Dashboard** → **Progetto** → **Settings** → **Environment Variables**
2. Aggiungi/Verifica queste variabili:

```bash
# Per Convex Actions
WEBHOOK_URL=https://complicative-unimplicitly-greta.ngrok-free.dev
WEBHOOK_TOKEN=test-token-12345

# Già configurato
CRON_SECRET=e2a34dab6d5c92a02aa2adf4e041529330ba8afc1114d5132a919660e1832ddd
```

3. **Redeploy** il progetto dopo aver aggiunto le variabili

### 4. ⚠️ Risoluzione Ngrok Warning

**Azione Richiesta**: Accettare il warning di ngrok

1. Apri nel browser: `https://complicative-unimplicitly-greta.ngrok-free.dev`
2. Clicca **"Visit Site"** per accettare il warning
3. Verifica che mostri il JSON del webhook server invece della pagina HTML

## Test di Verifica

### Test 1: Endpoint Cron Health Check
```bash
curl https://import-convex-dwh.vercel.app/api/cron/check-scheduled-syncs
```
**Risultato Atteso**: 
```json
{
  "status": "healthy",
  "total_apps": 1,
  "cron_enabled_apps": 1,
  "apps": [{"name": "app1", "cron_schedule": "15 0 * * *", "cron_enabled": true}]
}
```

### Test 2: Trigger Manuale Cron Job
```bash
curl -X POST https://import-convex-dwh.vercel.app/api/cron/check-scheduled-syncs \
  -H "Authorization: Bearer e2a34dab6d5c92a02aa2adf4e041529330ba8afc1114d5132a919660e1832ddd"
```
**Risultato Atteso**: 
```json
{
  "success": true,
  "apps_checked": 1,
  "results": [{"app_name": "app1", "status": "triggered", "job_id": "..."}]
}
```

### Test 3: Webhook Server Health
```bash
curl https://complicative-unimplicitly-greta.ngrok-free.dev/health \
  -H "Authorization: Bearer test-token-12345"
```
**Risultato Atteso**: JSON con status "healthy"

## Prossimi Passi

1. **Completare configurazione Vercel** (variabili d'ambiente)
2. **Risolvere warning ngrok** (accettare nel browser)
3. **Testare sync manuale** per verificare il flusso completo
4. **Attendere prossima esecuzione** alle 00:15 di domani
5. **Monitorare logs** nella pagina `/logs` del dashboard

## Monitoraggio

- **Dashboard**: https://import-convex-dwh.vercel.app
- **Logs**: https://import-convex-dwh.vercel.app/logs
- **Scheduling**: https://import-convex-dwh.vercel.app/scheduling

## Note Importanti

- **Vercel Free Tier**: Supporta solo cron job giornalieri
- **Ngrok Stabilità**: Per produzione considerare alternative più stabili
- **Fuso Orario**: Vercel usa UTC, l'orario 00:15 è in UTC
- **Tolleranza**: Il sistema accetta esecuzioni con 5 minuti di ritardo

---

**Data**: 4 Gennaio 2026  
**Status**: Parzialmente risolto - Richiede completamento configurazione Vercel