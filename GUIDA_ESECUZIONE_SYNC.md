# Guida Esecuzione Script di Sincronizzazione

## Panoramica

Hai completato con successo il deployment della dashboard su Vercel! Ora devi configurare ed eseguire lo script Python che effettua la sincronizzazione vera e propria tra Convex e SQL Server.

## Architettura del Sistema

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────┐
│  Dashboard Web  │────────▶│  Script Python   │────────▶│ SQL Server  │
│   (Vercel)      │         │   (Locale/VM)    │         │             │
└─────────────────┘         └──────────────────┘         └─────────────┘
        │                            │
        │                            │
        └────────────────┬───────────┘
                         ▼
                   ┌──────────┐
                   │  Convex  │
                   └──────────┘
```

## Prerequisiti

1. ✅ Python 3.11 installato
2. ✅ Dipendenze Python installate (`pip install -r requirements.txt`)
3. ✅ Dashboard deployata su Vercel
4. ✅ Applicazione creata dalla dashboard
5. ⚠️ Configurazione SQL Server e Email in Convex (tramite dashboard Settings)

## Passo 1: Verifica Configurazione

### 1.1 Verifica che l'app sia stata creata su Convex

Dalla dashboard web, dovresti vedere l'applicazione che hai creato. Prendi nota del **nome dell'app**.

### 1.2 Aggiorna il file `.env`

Il file `.env` nella root del progetto dovrebbe contenere:

```env
# Webhook Server Configuration
WEBHOOK_TOKEN=test-token-12345
CONVEX_WEBHOOK_URL=https://[tuo-dominio-vercel].vercel.app
PYTHON_EXE=C:\Users\Fabrizio Fantinel\AppData\Local\Programs\Python\Python311\python.exe
SYNC_SCRIPT_PATH=sync.py
HOST=0.0.0.0
PORT=5000
```

**IMPORTANTE**: Cambia `CONVEX_WEBHOOK_URL` con l'URL della tua dashboard Vercel!

## Passo 2: Esecuzione Manuale (Metodo Semplice)

### Opzione A: Esecuzione Diretta

Esegui lo script direttamente specificando il nome dell'app:

```bash
python sync.py [nome-app]
```

Esempio:
```bash
python sync.py my-first-sync
```

Lo script:
1. Si connette a Convex
2. Legge la configurazione dell'app da Convex
3. Legge i dati dalle tabelle specificate
4. Li scrive su SQL Server
5. Registra i log su Convex

### Opzione B: Usa il file batch RUN.bat

Puoi anche usare il file batch già configurato:

```bash
RUN.bat
```

Questo eseguirà lo script con la configurazione di default.

## Passo 3: Verifica Risultati

### 3.1 Controlla i Log nella Dashboard

1. Vai alla dashboard web
2. Clicca sull'applicazione
3. Clicca su **"View Logs"**
4. Dovresti vedere i dettagli della sincronizzazione

### 3.2 Controlla SQL Server

Verifica che le tabelle siano state create e popolate su SQL Server:

```sql
SELECT * FROM dbo.[nome-tabella]
```

## Passo 4: Configurazione Webhook (Opzionale)

Se vuoi triggerare le sincronizzazioni dalla dashboard web, devi avviare il webhook server:

### 4.1 Avvia il Webhook Server

In un terminale separato:

```bash
python webhook_server.py
```

Il server ascolterà sulla porta 5000.

### 4.2 Esponi il Webhook (per produzione)

Per far funzionare il trigger dalla dashboard Vercel, devi esporre il webhook su internet:

**Opzione 1: ngrok (per test)**
```bash
ngrok http 5000
```

Poi aggiorna la variabile `WEBHOOK_URL` su Vercel con l'URL ngrok.

**Opzione 2: Server dedicato**
Installa lo script su un server con IP pubblico e aggiorna `WEBHOOK_URL` su Vercel.

## Passo 5: Sincronizzazione Automatica (Cron)

### Windows Task Scheduler

1. Apri **Task Scheduler**
2. Crea una nuova attività
3. Trigger: Scegli la frequenza (es. ogni giorno alle 2 AM)
4. Action: 
   - Program: `C:\Users\Fabrizio Fantinel\AppData\Local\Programs\Python\Python311\python.exe`
   - Arguments: `sync.py [nome-app]`
   - Start in: `C:\Fabrizio\ProgettiKiro\Abaddon_DWH`

### Vercel Cron (già configurato)

Il cron job su Vercel è già configurato per eseguire una volta al giorno. Quando si attiva:
1. Vercel chiama l'API `/api/cron/check-scheduled-syncs`
2. L'API invia una richiesta al webhook
3. Il webhook esegue lo script Python

## Troubleshooting

### Errore: "Could not get config from Convex"

**Causa**: Lo script non riesce a connettersi a Convex per leggere la configurazione.

**Soluzione**:
1. Verifica che l'app sia stata creata dalla dashboard
2. Verifica che il nome dell'app sia corretto
3. Verifica la connessione internet

### Errore: "SQL Server connection failed"

**Causa**: Impossibile connettersi a SQL Server.

**Soluzione**:
1. Vai su **Settings** nella dashboard
2. Verifica che la configurazione SQL Server sia corretta
3. Testa la connessione da SQL Server Management Studio

### Errore: "Authentication failed"

**Causa**: Deploy key non valida.

**Soluzione**:
1. Verifica che la deploy key nell'app sia corretta
2. Vai su Convex Dashboard e copia la deploy key corretta
3. Aggiorna l'app dalla dashboard web

## Comandi Utili

```bash
# Esegui sincronizzazione per un'app specifica
python sync.py [nome-app]

# Esegui con configurazione custom
python sync.py [nome-app] --config custom_config.json

# Esegui con directory log custom
python sync.py [nome-app] --log-dir ./custom_logs

# Avvia webhook server
python webhook_server.py

# Verifica dipendenze
pip list

# Reinstalla dipendenze
pip install -r requirements.txt --upgrade
```

## Prossimi Passi

1. ✅ Esegui la prima sincronizzazione manuale
2. ✅ Verifica i risultati nella dashboard e su SQL Server
3. ⚠️ Configura il webhook se vuoi triggerare dalla dashboard
4. ⚠️ Configura Task Scheduler per sincronizzazioni automatiche
5. ⚠️ Configura le notifiche email (opzionale)

## Supporto

Se incontri problemi:
1. Controlla i log nella cartella `logs/`
2. Verifica la configurazione in Convex (Settings nella dashboard)
3. Testa la connessione a SQL Server manualmente
4. Verifica che tutte le dipendenze Python siano installate

---

**Congratulazioni!** Hai completato il setup del sistema di sincronizzazione Convex → SQL Server! 🎉
