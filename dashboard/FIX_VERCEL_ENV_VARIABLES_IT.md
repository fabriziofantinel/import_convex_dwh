# Fix Variabili d'Ambiente Vercel - URGENTE

## Problema Identificato
La dashboard su Vercel sta usando le variabili d'ambiente sbagliate:
- ❌ `NEXT_PUBLIC_CONVEX_URL=https://clever-porcupine-404.convex.cloud` (dev)
- ❌ `NEXT_PUBLIC_WEBHOOK_URL=http://localhost:5000` (locale)

Dovrebbe usare:
- ✅ `NEXT_PUBLIC_CONVEX_URL=https://blissful-schnauzer-295.convex.cloud` (produzione)
- ✅ `NEXT_PUBLIC_WEBHOOK_URL=https://complicative-unimplicitly-greta.ngrok-free.dev` (ngrok)

## Istruzioni per Fix Immediato

### 1. Vai su Vercel Dashboard
1. Apri https://vercel.com/dashboard
2. Seleziona il progetto `import-convex-dwh`
3. Vai su **Settings** → **Environment Variables**

### 2. Aggiorna le Variabili (Production)
Modifica o aggiungi queste variabili per **Production**:

```
NEXT_PUBLIC_CONVEX_URL=https://blissful-schnauzer-295.convex.cloud
NEXT_PUBLIC_WEBHOOK_URL=https://complicative-unimplicitly-greta.ngrok-free.dev
NEXT_PUBLIC_WEBHOOK_TOKEN=test-token-12345
NEXT_PUBLIC_AUTH0_REDIRECT_URI=https://import-convex-dwh.vercel.app
```

### 3. Redeploy
1. Vai su **Deployments**
2. Clicca sui tre puntini dell'ultimo deployment
3. Seleziona **Redeploy**
4. Conferma il redeploy

### 4. Verifica
Dopo il redeploy, testa il sync di app3 dalla dashboard.

## Variabili Complete per Riferimento

```bash
# Auth0 Configuration
NEXT_PUBLIC_AUTH0_DOMAIN=dev-p1yt6g7gg8nydzcm.us.auth0.com
NEXT_PUBLIC_AUTH0_CLIENT_ID=SwXAIYb2YJHF68iSJwdKLTE4zFByk6pL
NEXT_PUBLIC_AUTH0_REDIRECT_URI=https://import-convex-dwh.vercel.app
NEXT_PUBLIC_AUTH0_AUDIENCE=importconvexdwh

# Convex Configuration (PRODUCTION)
NEXT_PUBLIC_CONVEX_URL=https://blissful-schnauzer-295.convex.cloud
CONVEX_DEPLOYMENT=prod:blissful-schnauzer-295

# Webhook Configuration (NGROK)
NEXT_PUBLIC_WEBHOOK_URL=https://complicative-unimplicitly-greta.ngrok-free.dev
NEXT_PUBLIC_WEBHOOK_TOKEN=test-token-12345
```

## Stato Attuale
- ✅ Webhook server in esecuzione con audit logger corretto
- ✅ Endpoint API `/api/get-app-config/app3` funzionante
- ✅ Sync manuale di app3 funziona perfettamente
- ❌ Dashboard usa variabili d'ambiente sbagliate su Vercel
- ❌ Sync dalla dashboard fallisce perché chiama localhost invece di ngrok

## Dopo il Fix
Una volta aggiornate le variabili e fatto il redeploy, il sync di app3 dalla dashboard dovrebbe funzionare senza errori.