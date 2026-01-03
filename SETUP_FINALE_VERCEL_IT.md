# Setup Finale - Configurazione Vercel

## 🎯 URL ngrok Ottenuto

```
https://complicative-unimplicitly-greta.ngrok-free.dev
```

---

## 📝 Passi da Completare su Vercel

### 1️⃣ Vai su Vercel

Apri: https://vercel.com/dashboard

Seleziona il progetto: **import-convex-dwh**

---

### 2️⃣ Configura Environment Variables

Vai su: **Settings** → **Environment Variables**

#### A) Aggiungi `NEXT_PUBLIC_WEBHOOK_URL` (NUOVA)

Clicca **Add New** e compila:

```
Name: NEXT_PUBLIC_WEBHOOK_URL
Value: https://complicative-unimplicitly-greta.ngrok-free.dev
Environment: ✅ Production  ✅ Preview  ✅ Development
```

Clicca **Save**

---

#### B) Verifica `NEXT_PUBLIC_WEBHOOK_TOKEN`

Cerca se esiste già. Se non c'è, clicca **Add New**:

```
Name: NEXT_PUBLIC_WEBHOOK_TOKEN
Value: test-token-12345
Environment: ✅ Production  ✅ Preview  ✅ Development
```

Clicca **Save**

---

#### C) Aggiorna `NEXT_PUBLIC_AUTH0_REDIRECT_URI`

Trova questa variabile e clicca **Edit**:

```
Name: NEXT_PUBLIC_AUTH0_REDIRECT_URI
Value: https://import-convex-dwh.vercel.app
```

(Cambia da `http://localhost:3000` a `https://import-convex-dwh.vercel.app`)

Clicca **Save**

---

### 3️⃣ Rideploy

1. Vai su **Deployments**
2. Trova l'ultimo deployment (quello in cima)
3. Clicca sui tre puntini **⋯** a destra
4. Seleziona **Redeploy**
5. Conferma
6. Aspetta che finisca (1-2 minuti)

---

### 4️⃣ Riavvia il Webhook Server Locale

Nel terminale del webhook server:

1. Premi **CTRL+C** per fermarlo
2. Esegui: `START_WEBHOOK.bat`

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

## 🧪 Test Finale

### 1. Apri la Dashboard

Vai su: https://import-convex-dwh.vercel.app

### 2. Fai Login

Usa Auth0 per fare login

### 3. Crea o Seleziona un'App

- Vai su **Applications**
- Crea una nuova app o seleziona una esistente

### 4. Trigger Sync

Clicca sul pulsante **"Trigger Sync"**

### 5. Verifica i Log

Nel terminale del webhook server dovresti vedere:

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
  ...

[appclinics] ✓ Sync completed successfully
✓ Callback sent to Convex for job k17abc123
```

### 6. Verifica sulla Dashboard

Nella sezione **"Sync History"** dovresti vedere:
- ✅ Status: Success
- ⏱️ Duration: X secondi
- 📊 Tables: X
- 📈 Rows: X

---

## 📋 Checklist Finale

Prima di testare, verifica di aver fatto tutto:

- [ ] Aggiunto `NEXT_PUBLIC_WEBHOOK_URL` su Vercel con valore `https://complicative-unimplicitly-greta.ngrok-free.dev`
- [ ] Verificato `NEXT_PUBLIC_WEBHOOK_TOKEN` su Vercel con valore `test-token-12345`
- [ ] Aggiornato `NEXT_PUBLIC_AUTH0_REDIRECT_URI` su Vercel a `https://import-convex-dwh.vercel.app`
- [ ] Fatto Redeploy su Vercel
- [ ] Riavviato webhook server locale
- [ ] ngrok ancora in esecuzione

---

## 🎉 Setup Completato!

Una volta completati tutti i passi, il sistema sarà completamente funzionante:

✅ Dashboard web su Vercel
✅ Webhook server locale
✅ ngrok che espone il webhook
✅ Sincronizzazioni dalla dashboard
✅ Cron job automatico giornaliero
✅ Log e audit completi

---

## ⚠️ Nota Importante

L'URL ngrok `https://complicative-unimplicitly-greta.ngrok-free.dev` è **temporaneo**.

Se riavvii ngrok, otterrai un nuovo URL e dovrai:
1. Aggiornare `NEXT_PUBLIC_WEBHOOK_URL` su Vercel con il nuovo URL
2. Fare Redeploy su Vercel

---

**Procedi con i passi sopra e fammi sapere se funziona!** 🚀
