# Webhook Server - Setup e Utilizzo

Il webhook server permette al dashboard web di triggerare i sync remotamente.

## 📋 Prerequisiti

- Python 3.11+ installato
- Flask e dipendenze installate
- sync.py funzionante

## 🚀 Setup Iniziale

### 1. Installa le dipendenze

```bash
pip install -r requirements.txt
```

Questo installerà:
- `flask` - Web server
- `flask-cors` - CORS support per richieste dal dashboard
- `python-dotenv` - Gestione variabili d'ambiente

### 2. Configura le variabili d'ambiente

Copia il file di esempio:
```bash
copy .env.webhook.example .env
```

Modifica `.env` con i tuoi valori:

```env
# Token segreto per autenticazione (genera uno random!)
WEBHOOK_TOKEN=your-secret-token-here

# URL del Convex HTTP action per callback
CONVEX_WEBHOOK_URL=https://your-deployment.convex.site/api/webhook

# Percorso Python (già configurato per il tuo sistema)
PYTHON_EXE=C:\Users\Fabrizio Fantinel\AppData\Local\Programs\Python\Python311\python.exe

# Percorso sync.py (relativo a webhook_server.py)
SYNC_SCRIPT_PATH=sync.py

# Host e porta
HOST=0.0.0.0
PORT=5000
```

**Importante:** Genera un token sicuro con:
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### 3. Avvia il server

```bash
python webhook_server.py
```

Output atteso:
```
======================================================================
CONVEX TO SQL SERVER WEBHOOK SERVER
======================================================================
Host: 0.0.0.0
Port: 5000
Python: C:\Users\...\python.exe
Sync Script: sync.py
Convex Callback: https://...
======================================================================

 * Running on http://0.0.0.0:5000
```

## 🧪 Test del Server

### Test Health Check

```bash
curl http://localhost:5000/health
```

Risposta attesa:
```json
{
  "status": "healthy",
  "timestamp": "2025-12-23T16:30:00",
  "running_syncs": [],
  "python_exe": "C:\\Users\\...\\python.exe",
  "sync_script": "sync.py"
}
```

### Test Trigger Sync (con curl)

```bash
curl -X POST http://localhost:5000/api/sync/appclinics \
  -H "Authorization: Bearer your-secret-token-here" \
  -H "Content-Type: application/json" \
  -d "{\"job_id\":\"test123\",\"app_name\":\"appclinics\",\"deploy_key\":\"preview:team:project|token\",\"tables\":null,\"table_mapping\":null}"
```

Risposta attesa:
```json
{
  "success": true,
  "job_id": "test123",
  "app_name": "appclinics",
  "message": "Sync started for appclinics"
}
```

## 🌐 Esposizione a Internet

### Opzione 1: ngrok (Consigliato per Test)

1. Installa ngrok: https://ngrok.com/download
2. Avvia ngrok:
   ```bash
   ngrok http 5000
   ```
3. Copia l'URL pubblico (es: `https://abc123.ngrok.io`)
4. Usa questo URL nel dashboard Convex

### Opzione 2: Port Forwarding (Produzione)

1. Configura port forwarding sul router:
   - Porta esterna: 5000 (o altra)
   - Porta interna: 5000
   - IP interno: IP della tua macchina
2. Usa il tuo IP pubblico nel dashboard

### Opzione 3: Server Cloud (Produzione)

Quando sposti su server:
1. Copia tutti i file sul server
2. Aggiorna `.env` con i nuovi percorsi:
   ```env
   PYTHON_EXE=/usr/bin/python3  # Linux
   SYNC_SCRIPT_PATH=/path/to/sync.py
   ```
3. Avvia come servizio (systemd su Linux, Windows Service su Windows)

## 📡 Endpoints API

### GET /health
Health check del server

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-12-23T16:30:00",
  "running_syncs": ["appclinics"],
  "python_exe": "...",
  "sync_script": "sync.py"
}
```

### POST /api/sync/:app_name
Trigger sync per un'app specifica

**Headers:**
- `Authorization: Bearer <token>`
- `Content-Type: application/json`

**Body:**
```json
{
  "job_id": "convex_job_id",
  "app_name": "appclinics",
  "deploy_key": "preview:team:project|token",
  "tables": null,
  "table_mapping": null
}
```

**Response (202 Accepted):**
```json
{
  "success": true,
  "job_id": "convex_job_id",
  "app_name": "appclinics",
  "message": "Sync started for appclinics"
}
```

**Error Responses:**
- `401 Unauthorized` - Token non valido
- `409 Conflict` - Sync già in esecuzione per questa app
- `400 Bad Request` - Dati richiesta non validi

## 🔒 Sicurezza

1. **Token Segreto**: Usa un token forte e random
2. **HTTPS**: In produzione, usa sempre HTTPS (nginx/Apache come reverse proxy)
3. **Firewall**: Limita l'accesso solo agli IP necessari
4. **Logging**: Tutti i sync sono loggati automaticamente

## 🐛 Troubleshooting

### Server non si avvia
- Verifica che la porta 5000 non sia già in uso
- Controlla che Flask sia installato: `pip list | grep -i flask`

### Sync non parte
- Verifica che `sync.py` sia nello stesso percorso
- Controlla il percorso Python in `.env`
- Verifica i log del server

### Callback a Convex fallisce
- Verifica che `CONVEX_WEBHOOK_URL` sia corretto
- Controlla che il Convex HTTP action sia deployato
- Verifica i log del server per errori

## 📝 Logs

I log del webhook server vengono stampati su console. Per salvarli su file:

```bash
python webhook_server.py > webhook_server.log 2>&1
```

I log dei sync sono salvati automaticamente da `sync.py` in `logs/`.

## 🔄 Aggiornamenti

Quando aggiorni il codice:
1. Ferma il server (Ctrl+C)
2. Aggiorna i file
3. Riavvia il server

## 📞 Supporto

Per problemi o domande, controlla:
1. I log del webhook server
2. I log di sync.py in `logs/`
3. Lo stato del server con `GET /health`
