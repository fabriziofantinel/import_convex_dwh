# 🔍 PROBLEMA FETCH TABLES

## Sintomo
Quando crei una nuova app dalla dashboard e clicchi "Fetch Tables", ricevi un errore.

## Diagnosi
Il webhook server riceve solo richieste OPTIONS (preflight CORS) ma non la richiesta POST effettiva.

Log webhook server:
```
127.0.0.1 - - [04/Jan/2026 02:39:00] "OPTIONS /api/fetch-tables HTTP/1.1" 200 -
127.0.0.1 - - [04/Jan/2026 02:40:07] "OPTIONS /api/fetch-tables HTTP/1.1" 200 -
```

## Causa Probabile
L'app sta usando `NEXT_PUBLIC_WEBHOOK_URL` che potrebbe essere configurato con `http://localhost:5000` invece dell'URL ngrok pubblico.

## Soluzione

### 1. Verifica Variabile d'Ambiente su Vercel
Vai su Vercel → Settings → Environment Variables e controlla:
- `NEXT_PUBLIC_WEBHOOK_URL` deve essere: `https://complicative-unimplicitly-greta.ngrok-free.dev`
- NON deve essere: `http://localhost:5000`

### 2. Se la Variabile è Sbagliata
1. Aggiorna `NEXT_PUBLIC_WEBHOOK_URL` su Vercel con l'URL ngrok
2. Redeploy l'app (Vercel → Deployments → Redeploy)

### 3. Problema Alternativo: ngrok Disconnesso
Se ngrok si è disconnesso:
1. Riavvia ngrok: `ngrok http 5000`
2. Copia il nuovo URL https
3. Aggiorna `NEXT_PUBLIC_WEBHOOK_URL` su Vercel
4. Redeploy

### 4. Test Manuale
Puoi testare il webhook direttamente:
```bash
curl -X POST "https://complicative-unimplicitly-greta.ngrok-free.dev/api/fetch-tables" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token-12345" \
  -d "{\"deploy_key\":\"dev:bold-husky-496|eyJ2MiI6ImFkNGNmOGI4YjBhYzRlYWY5NGRlYTFhZGI2Njg1NTcyIn0=\"}"
```

## Verifica Stato Attuale
- ✅ Webhook server attivo (ProcessId: 1)
- ✅ ngrok attivo (ProcessId: 2)
- ❓ NEXT_PUBLIC_WEBHOOK_URL su Vercel = ?

## Prossimi Passi
1. Verifica `NEXT_PUBLIC_WEBHOOK_URL` su Vercel
2. Se necessario, aggiorna e redeploy
3. Riprova a creare l'app dalla dashboard