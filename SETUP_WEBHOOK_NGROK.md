# Setup Webhook con ngrok - Guida Rapida

**STATUS: ✅ Webhook Server Attivo | ✅ ngrok Configurato | ⏳ Attesa URL ngrok**

---

## ✅ Passi Completati

1. ✅ Webhook server avviato (porta 5000)
2. ✅ ngrok scaricato e configurato con authtoken
3. ✅ ngrok avviato

## ⏳ Prossimi Passi

**Vedi `NGROK_QUICK_SETUP_IT.md` per la guida rapida di completamento!**

---

## Passo 1: Scarica e Installa ngrok (✅ COMPLETATO)

1. Vai su https://ngrok.com/download
2. Scarica la versione per Windows
3. Estrai il file `ngrok.exe` in una cartella (es. `C:\ngrok\`)
4. (Opzionale) Crea un account gratuito su ngrok.com per URL stabili

## Passo 2: Avvia il Webhook Server

Apri un terminale PowerShell nella cartella del progetto:

```powershell
& "C:\Users\Fabrizio Fantinel\AppData\Local\Programs\Python\Python311\python.exe" webhook_server.py
```

Dovresti vedere:
```
 * Running on http://0.0.0.0:5000
 * Press CTRL+C to quit
```

**NON CHIUDERE QUESTO TERMINALE!**

## Passo 3: Avvia ngrok

Apri un SECONDO terminale PowerShell e vai nella cartella dove hai estratto ngrok:

```powershell
cd C:\ngrok
.\ngrok.exe http 5000
```

Vedrai qualcosa come:
```
Session Status                online
Forwarding                    https://abc123.ngrok.io -> http://localhost:5000
```

**Copia l'URL https** (es. `https://abc123.ngrok.io`)

**NON CHIUDERE QUESTO TERMINALE!**

## Passo 4: Aggiorna Vercel

1. Vai su https://vercel.com
2. Seleziona il tuo progetto
3. Vai su **Settings** → **Environment Variables**
4. Trova `WEBHOOK_URL`
5. Clicca **Edit**
6. Cambia da `http://localhost:5000` a `https://abc123.ngrok.io`
7. Clicca **Save**
8. Vai su **Deployments** → Clicca sui tre puntini → **Redeploy**

## Passo 5: Testa!

1. Vai alla tua dashboard su Vercel (l'URL del deployment)
2. Fai login
3. Clicca sull'applicazione che hai creato
4. Clicca **"Trigger Sync"**
5. Guarda il terminale del webhook server - vedrai la richiesta!
6. Clicca **"View Logs"** per vedere i risultati

## Troubleshooting

### Errore: "ngrok not found"
Assicurati di essere nella cartella giusta o aggiungi ngrok al PATH

### Errore: "Port 5000 already in use"
Chiudi altri programmi che usano la porta 5000

### Webhook non riceve richieste
- Verifica che l'URL ngrok sia corretto su Vercel
- Verifica che il webhook server sia in esecuzione
- Controlla i log di Vercel per errori

## Note Importanti

- **ngrok gratuito**: L'URL cambia ogni volta che riavvii ngrok
- **Soluzione**: Crea un account ngrok gratuito per URL fissi
- **Produzione**: Per produzione, usa un server dedicato o cloud function
