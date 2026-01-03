# Task 10: Completamento Setup Webhook + ngrok

## ✅ Configurazione Locale Completata

Il file `.env` è già configurato correttamente:

```env
WEBHOOK_TOKEN=test-token-12345
CONVEX_WEBHOOK_URL=https://import-convex-dwh.vercel.app  ✅
DASHBOARD_URL=https://import-convex-dwh.vercel.app       ✅
PYTHON_EXE=C:\Users\Fabrizio Fantinel\AppData\Local\Programs\Python\Python311\python.exe
SYNC_SCRIPT_PATH=sync.py
HOST=0.0.0.0
PORT=5000
```

---

## 🎯 Passi Finali (3 step)

### 1️⃣ Ottieni l'URL ngrok

Nel terminale dove hai avviato ngrok, cerca:

```
Forwarding    https://xxxx-xxx-xxx-xxx.ngrok-free.app -> http://localhost:5000
```

**Copia l'URL HTTPS completo** (esempio: `https://1234-56-78-90-12.ngrok-free.app`)

---

### 2️⃣ Configura Vercel

Vai su https://vercel.com/dashboard e apri il progetto `import-convex-dwh`

#### A) Aggiungi `NEXT_PUBLIC_WEBHOOK_URL`

1. **Settings** → **Environment Variables**
2. Clicca **Add New**
3. Compila:
   - **Name**: `NEXT_PUBLIC_WEBHOOK_URL`
   - **Value**: `https://[tuo-url-ngrok].ngrok-free.app`
   - **Environment**: Production, Preview, Development (seleziona tutti)
4. **Save**

#### B) Verifica `NEXT_PUBLIC_WEBHOOK_TOKEN`

Assicurati che esista:
- **Name**: `NEXT_PUBLIC_WEBHOOK_TOKEN`
- **Value**: `test-token-12345`

Se non esiste, creala con gli stessi passi sopra.

#### C) Aggiorna `NEXT_PUBLIC_AUTH0_REDIRECT_URI`

Cambia da `http://localhost:3000` a:
- **Value**: `https://import-convex-dwh.vercel.app`

---

### 3️⃣ Rideploy su Vercel

1. Vai su **Deployments**
2. Trova l'ultimo deployment
3. Clicca **⋯** (tre puntini)
4. Seleziona **Redeploy**
5. Aspetta che finisca (circa 1-2 minuti)

---

### 4️⃣ Riavvia il Webhook Server

1. Nel terminale del webhook server, premi **CTRL+C** per fermarlo
2. Riavvia con: `START_WEBHOOK.bat`

Dovresti vedere:

```
======================================================================
CONVEX TO SQL SERVER WEBHOOK SERVER
======================================================================
Host: 0.0.0.0
Port: 5000
Convex Callback: https://import-convex-dwh.vercel.app
======================================================================
```

---

## 🧪 Test Completo

### 1. Testa dalla Dashboard

1. Apri https://import-convex-dwh.vercel.app
2. Fai login con Auth0
3. Vai su **Applications**
4. Crea o seleziona un'app
5. Clicca **"Trigger Sync"**

### 2. Verifica i Log del Webhook Server

Nel terminale dovresti vedere:

```
[DEBUG] Auth header received: Bearer test-token-12345
[DEBUG] Token match: True
[appclinics] Starting sync job k17abc123...

Downloading backup from Convex...
✓ Backup downloaded
  - Tables: 11
  - Total rows: 47

Connecting to SQL Server...
✓ Connected to SQL Server

Importing tables...
  - users → users (truncate + insert)... ✓ 10 rows (0.52s)
  - appointments → appointments (truncate + insert)... ✓ 15 rows (0.48s)
  ...

[appclinics] ✓ Sync completed successfully
✓ Callback sent to Convex for job k17abc123
```

### 3. Verifica sulla Dashboard

Nella sezione **"Sync History"** dovresti vedere:
- ✅ Status: Success
- ⏱️ Duration: X secondi
- 📊 Tables processed: X
- 📈 Rows imported: X

---

## 📝 Riepilogo Variabili d'Ambiente

### File `.env` (Locale)
```env
WEBHOOK_TOKEN=test-token-12345
CONVEX_WEBHOOK_URL=https://import-convex-dwh.vercel.app
DASHBOARD_URL=https://import-convex-dwh.vercel.app
PYTHON_EXE=C:\Users\Fabrizio Fantinel\AppData\Local\Programs\Python\Python311\python.exe
SYNC_SCRIPT_PATH=sync.py
HOST=0.0.0.0
PORT=5000
```

### Vercel Environment Variables
```
NEXT_PUBLIC_WEBHOOK_URL=https://[ngrok-url].ngrok-free.app  ← DA CONFIGURARE
NEXT_PUBLIC_WEBHOOK_TOKEN=test-token-12345
NEXT_PUBLIC_AUTH0_DOMAIN=dev-p1yt6g7gg8nydzcm.us.auth0.com
NEXT_PUBLIC_AUTH0_CLIENT_ID=SwXAIYb2YJHF68iSJwdKLTE4zFByk6pL
NEXT_PUBLIC_AUTH0_REDIRECT_URI=https://import-convex-dwh.vercel.app  ← AGGIORNA
NEXT_PUBLIC_AUTH0_AUDIENCE=importconvexdwh
NEXT_PUBLIC_CONVEX_URL=https://clever-porcupine-404.convex.cloud
CRON_SECRET=e2a34dab6d5c92a02aa2adf4e041529330ba8afc1114d5132a919660e1832ddd
CONVEX_DEPLOY_KEY=[tuo deploy key]
```

---

## 🐛 Troubleshooting

### Errore: "NEXT_PUBLIC_WEBHOOK_URL not configured"
→ Hai dimenticato di aggiungere `NEXT_PUBLIC_WEBHOOK_URL` su Vercel

### Errore: "Failed to connect to webhook"
→ Verifica che ngrok sia in esecuzione e l'URL sia corretto

### Errore: "Unauthorized"
→ Verifica che `NEXT_PUBLIC_WEBHOOK_TOKEN` sia `test-token-12345`

### Errore audit log (localhost:3000)
→ Riavvia il webhook server dopo aver aggiornato `.env`

---

## 🎉 Setup Completato!

Una volta completati tutti i passi, avrai:

✅ Dashboard web su Vercel
✅ Webhook server locale funzionante
✅ ngrok che espone il webhook pubblicamente
✅ Sincronizzazioni triggerabili dalla dashboard
✅ Cron job automatico giornaliero (2:00 AM)
✅ Log delle sincronizzazioni visibili
✅ Audit log inviati a Convex

---

## 🔄 Uso Quotidiano

### Avviare il Sistema

1. Avvia webhook server: `START_WEBHOOK.bat`
2. Avvia ngrok: `ngrok http 5000`
3. Se l'URL ngrok è cambiato: aggiorna `NEXT_PUBLIC_WEBHOOK_URL` su Vercel e rideploy

### Triggerare una Sincronizzazione

1. Vai su https://import-convex-dwh.vercel.app
2. Seleziona un'app
3. Clicca "Trigger Sync"
4. Monitora i log nel terminale del webhook server

---

**Prossimo passo**: Fornisci l'URL ngrok per completare la configurazione su Vercel! 🚀
