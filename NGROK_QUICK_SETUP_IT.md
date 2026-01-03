# 🚀 Setup Rapido ngrok - Guida Veloce

## ✅ Stato: Webhook Server Attivo

Il webhook server è già in esecuzione sulla porta 5000.

---

## 📋 Checklist Completamento (3 passi)

### ✅ PASSO 1: Ottieni URL ngrok

Nel terminale dove hai avviato ngrok, cerca questa riga:

```
Forwarding    https://xxxx-xxx-xxx-xxx.ngrok-free.app -> http://localhost:5000
```

**Copia l'URL HTTPS** (esempio: `https://1234-56-78-90-12.ngrok-free.app`)

---

### ⏳ PASSO 2: Aggiorna Vercel

1. Vai su https://vercel.com/dashboard
2. Apri il tuo progetto
3. **Settings** → **Environment Variables**
4. Trova `WEBHOOK_URL`
5. Cambia da `http://localhost:5000` a `https://[tuo-url-ngrok].ngrok-free.app`
6. **Save**

**Esempio:**
```
Prima:  WEBHOOK_URL = http://localhost:5000
Dopo:   WEBHOOK_URL = https://1234-56-78-90-12.ngrok-free.app
```

---

### ⏳ PASSO 3: Rideploy

**Opzione A - Dalla Dashboard Vercel:**
1. **Deployments** → Ultimo deployment
2. Clicca **⋯** (tre puntini)
3. **Redeploy**

**Opzione B - Da Git:**
```bash
git commit --allow-empty -m "Update webhook URL"
git push
```

---

## 🧪 Test

Dopo il deploy:

1. Apri la tua dashboard su Vercel
2. Vai su **Applications**
3. Clicca su un'app
4. Clicca **"Trigger Sync"**
5. Controlla il terminale del webhook server per vedere i log

**Log attesi:**
```
[appclinics] Starting sync job...
Downloading backup from Convex...
✓ Backup downloaded
Connecting to SQL Server...
✓ Connected to SQL Server
[appclinics] ✓ Sync completed successfully
```

---

## ⚠️ Note Importanti

- **L'URL ngrok cambia** ogni volta che lo riavvii (account gratuito)
- Se riavvii ngrok, devi **ripetere i passi 2 e 3**
- Il webhook server deve essere **sempre in esecuzione** per ricevere le richieste
- Puoi monitorare le richieste ngrok su: http://127.0.0.1:4040

---

## 🆘 Problemi?

**"Failed to connect to webhook"**
→ Verifica che ngrok sia in esecuzione e l'URL sia corretto su Vercel

**"Unauthorized"**
→ Verifica che `NEXT_PUBLIC_WEBHOOK_TOKEN` su Vercel sia `test-token-12345`

**ngrok si disconnette**
→ Account gratuito ha limiti di tempo. Riavvia ngrok e aggiorna l'URL su Vercel

---

## 📱 Contatti Rapidi

- **ngrok Dashboard**: https://dashboard.ngrok.com
- **ngrok Web Interface**: http://127.0.0.1:4040
- **Vercel Dashboard**: https://vercel.com/dashboard

---

**Pronto?** Fornisci l'URL ngrok per procedere! 🎯
