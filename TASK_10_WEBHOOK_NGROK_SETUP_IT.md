# Task 10: Setup Webhook Server con ngrok - COMPLETAMENTO

## ✅ Stato Attuale

1. ✅ Webhook server in esecuzione (porta 5000)
2. ✅ ngrok configurato con authtoken
3. ✅ ngrok avviato
4. ⏳ **PROSSIMO PASSO**: Ottenere URL ngrok e configurare Vercel

---

## 🎯 Prossimi Passi

### 1. Ottieni l'URL ngrok

Quando hai avviato ngrok con il comando:
```bash
ngrok http 5000
```

Dovresti vedere un output simile a questo:

```
Session Status                online
Account                       [tuo account]
Version                       3.x.x
Region                        Europe (eu)
Latency                       -
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://xxxx-xxx-xxx-xxx.ngrok-free.app -> http://localhost:5000
```

**Copia l'URL HTTPS** che vedi nella riga "Forwarding" (esempio: `https://xxxx-xxx-xxx-xxx.ngrok-free.app`)

⚠️ **IMPORTANTE**: 
- Usa l'URL **HTTPS** (non HTTP)
- L'URL cambia ogni volta che riavvii ngrok (a meno che non usi un dominio fisso con account a pagamento)

---

### 2. Aggiorna la Variabile d'Ambiente su Vercel

1. Vai su [Vercel Dashboard](https://vercel.com/dashboard)
2. Seleziona il tuo progetto
3. Vai su **Settings** → **Environment Variables**
4. Trova la variabile `WEBHOOK_URL`
5. Clicca su **Edit**
6. Sostituisci `http://localhost:5000` con il tuo URL ngrok (esempio: `https://xxxx-xxx-xxx-xxx.ngrok-free.app`)
7. Clicca su **Save**

**Screenshot della configurazione:**
```
Name: WEBHOOK_URL
Value: https://xxxx-xxx-xxx-xxx.ngrok-free.app
Environment: Production, Preview, Development
```

---

### 3. Rideploy su Vercel

Dopo aver aggiornato la variabile d'ambiente, devi fare un nuovo deploy:

**Opzione A - Redeploy Automatico (Consigliato):**
1. Vai su **Deployments**
2. Trova l'ultimo deployment
3. Clicca sui tre puntini (⋯)
4. Seleziona **Redeploy**
5. Conferma

**Opzione B - Push su GitHub:**
```bash
git commit --allow-empty -m "Trigger redeploy for webhook URL update"
git push
```

---

### 4. Testa la Sincronizzazione

Una volta completato il deploy:

1. Vai sulla tua dashboard Vercel (URL del tuo sito)
2. Fai login
3. Vai sulla pagina **Applications**
4. Clicca su un'app esistente (o creane una nuova)
5. Clicca sul pulsante **"Trigger Sync"**

**Cosa dovrebbe succedere:**
- ✅ Il pulsante mostra "Syncing..."
- ✅ Viene creato un nuovo job nella sezione "Sync History"
- ✅ Il webhook server locale riceve la richiesta (vedi log nel terminale)
- ✅ Lo script `sync.py` viene eseguito
- ✅ I dati vengono sincronizzati da Convex a SQL Server
- ✅ Il job viene aggiornato con lo stato "success" o "failed"

---

## 🔍 Verifica Webhook Server

Per verificare che il webhook server stia ricevendo le richieste, controlla il terminale dove hai avviato `START_WEBHOOK.bat`.

Dovresti vedere log simili a:
```
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

---

## 🐛 Troubleshooting

### Errore: "Failed to connect to webhook"

**Causa**: Vercel non riesce a raggiungere il webhook server

**Soluzioni**:
1. Verifica che ngrok sia ancora in esecuzione
2. Verifica che l'URL ngrok sia corretto su Vercel
3. Verifica che il webhook server sia in esecuzione (`START_WEBHOOK.bat`)
4. Controlla i log di ngrok: apri http://127.0.0.1:4040 nel browser

### Errore: "Unauthorized"

**Causa**: Token di autenticazione non corretto

**Soluzione**:
1. Verifica che `NEXT_PUBLIC_WEBHOOK_TOKEN` su Vercel sia `test-token-12345`
2. Verifica che `WEBHOOK_TOKEN` nel file `.env` locale sia `test-token-12345`

### ngrok URL cambia continuamente

**Causa**: Account gratuito ngrok genera URL casuali

**Soluzioni**:
1. **Opzione A (Gratuita)**: Ogni volta che riavvii ngrok, aggiorna `WEBHOOK_URL` su Vercel
2. **Opzione B (A pagamento)**: Upgrade a ngrok Pro per avere un dominio fisso

---

## 📝 Variabili d'Ambiente Finali su Vercel

Dopo il setup, dovresti avere queste variabili configurate:

```
NEXT_PUBLIC_AUTH0_DOMAIN=dev-p1yt6g7gg8nydzcm.us.auth0.com
NEXT_PUBLIC_AUTH0_CLIENT_ID=SwXAIYb2YJHF68iSJwdKLTE4zFByk6pL
NEXT_PUBLIC_AUTH0_REDIRECT_URI=https://[tuo-dominio].vercel.app
NEXT_PUBLIC_AUTH0_AUDIENCE=importconvexdwh
NEXT_PUBLIC_CONVEX_URL=https://clever-porcupine-404.convex.cloud
CRON_SECRET=e2a34dab6d5c92a02aa2adf4e041529330ba8afc1114d5132a919660e1832ddd
WEBHOOK_URL=https://xxxx-xxx-xxx-xxx.ngrok-free.app  ← AGGIORNATO
NEXT_PUBLIC_WEBHOOK_TOKEN=test-token-12345
CONVEX_DEPLOY_KEY=[tuo deploy key]
```

---

## 🎉 Setup Completato!

Una volta completati tutti i passi, avrai:

✅ Dashboard web funzionante su Vercel
✅ Webhook server locale in esecuzione
✅ ngrok che espone il webhook server pubblicamente
✅ Possibilità di triggerare sync dalla dashboard
✅ Cron job giornaliero automatico (2:00 AM)
✅ Log delle sincronizzazioni visibili nella dashboard
✅ Notifiche email per errori (se configurate)

---

## 🔄 Uso Quotidiano

### Avviare il Sistema

1. **Avvia webhook server**: Esegui `START_WEBHOOK.bat`
2. **Avvia ngrok**: Esegui `ngrok http 5000`
3. **Aggiorna Vercel** (se URL ngrok è cambiato): Aggiorna `WEBHOOK_URL` e rideploy

### Triggerare una Sincronizzazione

1. Vai sulla dashboard Vercel
2. Seleziona un'app
3. Clicca "Trigger Sync"
4. Monitora i log nella sezione "Sync History"

### Sincronizzazione Automatica

Il cron job su Vercel eseguirà automaticamente la sincronizzazione ogni giorno alle 2:00 AM per tutte le app con `cron_enabled: true`.

---

## 📚 File di Riferimento

- `webhook_server.py` - Server webhook Flask
- `sync.py` - Script di sincronizzazione
- `START_WEBHOOK.bat` - Script per avviare il webhook server
- `.env` - Configurazione locale del webhook server
- `WEBHOOK_SERVER_README.md` - Documentazione dettagliata del webhook server

---

**Prossimo passo**: Fornisci l'URL ngrok per procedere con la configurazione su Vercel!
