# Convex to SQL Server Sync - Sistema Completo

Sistema completo per sincronizzare dati da Convex a SQL Server con dashboard web per la gestione.

## 📋 Panoramica

Il sistema è composto da 3 componenti principali:

1. **Sync Engine** (`sync.py`) - Script Python che esegue la sincronizzazione
2. **Webhook Server** (`webhook_server.py`) - Server Flask che riceve richieste dal dashboard
3. **Dashboard Web** (Next.js + Convex) - Interfaccia web per gestire le sincronizzazioni

## 🏗️ Architettura

```
┌─────────────────────────────────────────────────────────────┐
│                    VERCEL CLOUD                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Dashboard Web (Next.js)                           │    │
│  │  - Gestione app                                    │    │
│  │  - Visualizzazione log                             │    │
│  │  - Schedulazione                                   │    │
│  │  - Monitoraggio servizi                            │    │
│  └────────────────────────────────────────────────────┘    │
│         │                                                    │
│         │ HTTPS                                              │
│         ▼                                                    │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Convex Database                                   │    │
│  │  - sync_apps                                       │    │
│  │  - sync_jobs                                       │    │
│  │  - global_settings                                 │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ HTTPS (via ngrok)
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              MACCHINA LOCALE WINDOWS                         │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Ngrok Tunnel                                      │    │
│  │  https://xxx.ngrok-free.dev → localhost:5000      │    │
│  └────────────────────────────────────────────────────┘    │
│         │                                                    │
│         ▼                                                    │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Webhook Server (Flask)                            │    │
│  │  - Riceve richieste sync                           │    │
│  │  - Esegue sync.py                                  │    │
│  │  - Invia callback a Convex                         │    │
│  └────────────────────────────────────────────────────┘    │
│         │                                                    │
│         ▼                                                    │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Sync Engine (sync.py)                             │    │
│  │  - Esporta da Convex                               │    │
│  │  - Importa in SQL Server                           │    │
│  └────────────────────────────────────────────────────┘    │
│         │                                                    │
│         ▼                                                    │
│  ┌────────────────────────────────────────────────────┐    │
│  │  SQL Server                                        │    │
│  │  - Database di destinazione                        │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Task Scheduler                                    │    │
│  │  - Esegue scheduled_sync_runner.py ogni 15 min    │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

Vedi `ARCHITETTURA_SISTEMA.md` per dettagli completi.

## 🚀 Quick Start

### 1. Setup Iniziale

```bash
# Clona il repository
git clone https://github.com/fabriziofantinel/import_convex_dwh.git
cd import_convex_dwh

# Installa dipendenze Python
pip install -r requirements.txt

# Configura variabili d'ambiente
copy .env.example .env
# Modifica .env con le tue credenziali
```

### 2. Avvia Servizi Locali

```bash
# 1. Avvia webhook server
start_webhook_server.bat

# 2. Avvia ngrok (in un'altra finestra)
START_NGROK.bat
# Copia l'URL https://xxx.ngrok-free.dev
```

### 3. Deploy Dashboard

```bash
cd dashboard

# Deploy su Vercel
npm install
npx vercel --prod

# Configura variabili d'ambiente su Vercel:
# - NEXT_PUBLIC_WEBHOOK_URL: https://xxx.ngrok-free.dev
# - NEXT_PUBLIC_WEBHOOK_TOKEN: test-token-12345
# - NEXT_PUBLIC_CONVEX_URL: https://xxx.convex.cloud
```

Vedi `dashboard/README.md` per istruzioni dettagliate.

### 4. Configura Schedulazione (Opzionale)

Vedi `QUICK_SCHEDULER_SETUP_IT.md` per configurare Task Scheduler di Windows.

## 📚 Documentazione

### Guide Essenziali

- **`QUICK_START.md`** - Guida rapida per iniziare
- **`ARCHITETTURA_SISTEMA.md`** - Architettura completa del sistema
- **`NGROK_QUICK_SETUP_IT.md`** - Setup rapido ngrok
- **`QUICK_SCHEDULER_SETUP_IT.md`** - Setup Task Scheduler (5 passi)
- **`TASK_SCHEDULER_SETUP_IT.md`** - Setup Task Scheduler (dettagliato)

### Documentazione Dashboard

- **`dashboard/README.md`** - Documentazione completa dashboard
- **`dashboard/QUICKSTART.md`** - Quick start dashboard
- **`dashboard/DEPLOY_VERCEL_GITHUB_IT.md`** - Deploy su Vercel

### Documentazione Tecnica

- **`WEBHOOK_SERVER_README.md`** - Documentazione webhook server
- **`EMAIL_NOTIFICATIONS_README.md`** - Notifiche email
- **`PROJECT_SUMMARY.md`** - Riepilogo progetto

## 🔧 Componenti Principali

### Sync Engine (`sync.py`)

Script Python che esegue la sincronizzazione:
- Esporta dati da Convex usando `convex export`
- Importa dati in SQL Server usando `pyodbc`
- Supporta mapping tabelle personalizzato
- Logging dettagliato

```bash
# Esecuzione manuale
python sync.py <app_name>
```

### Webhook Server (`webhook_server.py`)

Server Flask che gestisce le richieste:
- Endpoint `/health` - Health check
- Endpoint `/api/sync/<app_name>` - Trigger sync
- Endpoint `/api/fetch-tables` - Lista tabelle Convex
- Rate limiting e audit logging
- Notifiche email per errori

```bash
# Avvio
python webhook_server.py
```

### Dashboard Web

Interfaccia Next.js + Convex:
- **Dashboard** - Gestione app e sync manuali
- **Services** - Monitoraggio webhook e ngrok
- **Logs** - Visualizzazione log con filtri
- **Scheduling** - Configurazione schedulazione
- **Settings** - Configurazione globale

URL: https://import-convex-dwh.vercel.app

### Scheduled Sync Runner (`scheduled_sync_runner.py`)

Script per Task Scheduler:
- Interroga dashboard per app schedulate
- Verifica se è il momento di eseguire
- Triggera sync tramite API
- Log in `logs/scheduled_sync_runner.log`

```bash
# Esecuzione manuale
python scheduled_sync_runner.py
```

## 📁 Struttura Progetto

```
.
├── sync.py                      # Sync engine principale
├── webhook_server.py            # Webhook server Flask
├── scheduled_sync_runner.py     # Script per Task Scheduler
├── config.json                  # Configurazione app
├── .env                         # Variabili d'ambiente
│
├── src/                         # Moduli Python
│   ├── convex/                  # Client Convex
│   ├── sql/                     # Client SQL Server
│   ├── export/                  # Export logic
│   ├── logging/                 # Logging
│   └── notifications/           # Email notifications
│
├── dashboard/                   # Dashboard Next.js
│   ├── app/                     # Pages e API routes
│   ├── components/              # React components
│   ├── convex/                  # Convex schema e queries
│   └── lib/                     # Utilities
│
├── logs/                        # Log files
├── templates/                   # Email templates
└── tests/                       # Unit tests
```

## 🔐 Sicurezza

- **Autenticazione**: Token Bearer per webhook
- **HTTPS**: Comunicazione criptata via ngrok
- **Rate Limiting**: Protezione contro abusi
- **Audit Logging**: Tracciamento tutte le operazioni
- **Encryption**: Credenziali SQL criptate in Convex

## 🛠️ Configurazione

### Variabili d'Ambiente (`.env`)

```env
# Webhook Server
WEBHOOK_TOKEN=test-token-12345
HOST=0.0.0.0
PORT=5000

# Dashboard
DASHBOARD_URL=https://import-convex-dwh.vercel.app

# Convex
CONVEX_WEBHOOK_URL=https://import-convex-dwh.vercel.app

# Python
PYTHON_EXE=C:\...\python.exe
SYNC_SCRIPT_PATH=sync.py

# Rate Limiting
RATE_LIMIT_REQUESTS_PER_MINUTE=60
RATE_LIMIT_BURST_SIZE=10
```

### Configurazione App (`config.json`)

```json
{
  "convex_apps": {
    "app1": {
      "deploy_key": "dev:project|token",
      "tables": ["users", "posts"],
      "table_mapping": {
        "users": "tbl_users"
      }
    }
  },
  "sql_server": {
    "server": "localhost",
    "database": "MyDB",
    "username": "sa",
    "password": "password"
  }
}
```

## 📊 Monitoraggio

### Log Files

- `logs/scheduled_sync_runner.log` - Log Task Scheduler
- `logs/webhook_server.log` - Log webhook server (se configurato)
- `logs/sync_<timestamp>.log` - Log singoli sync

### Dashboard

- **Services Page** - Stato webhook e ngrok in tempo reale
- **Logs Page** - Tutti i sync jobs con filtri
- **Dashboard** - Stato ultimo sync per ogni app

## 🔄 Workflow Tipico

### Sync Manuale

1. Utente clicca "Sync Now" nel dashboard
2. Dashboard chiama `/api/proxy-trigger-sync`
3. Proxy chiama webhook server via ngrok
4. Webhook server esegue `sync.py`
5. Sync engine esporta da Convex e importa in SQL Server
6. Webhook server invia callback a Convex
7. Dashboard aggiorna stato in tempo reale

### Sync Schedulato

1. Task Scheduler esegue `scheduled_sync_runner.py` ogni 15 min
2. Script interroga dashboard per app schedulate
3. Per ogni app, verifica se è il momento di eseguire
4. Se sì, triggera sync tramite `/api/proxy-trigger-sync`
5. Resto del flusso uguale a sync manuale

## 🐛 Troubleshooting

### Webhook non raggiungibile

1. Verifica che webhook server sia attivo: `http://localhost:5000/health`
2. Verifica che ngrok sia attivo: controlla URL in Services page
3. Verifica che `NEXT_PUBLIC_WEBHOOK_URL` su Vercel sia aggiornato

### Sync fallisce

1. Controlla log in `logs/`
2. Verifica credenziali SQL Server in `config.json`
3. Verifica deploy key Convex
4. Controlla log nel dashboard (Logs page)

### Task Scheduler non esegue

1. Verifica attività in Task Scheduler
2. Controlla log: `logs/scheduled_sync_runner.log`
3. Verifica che webhook e ngrok siano attivi
4. Testa manualmente: `python scheduled_sync_runner.py`

## 📝 Note Importanti

- ⚠️ Webhook server e ngrok devono essere sempre attivi
- ⚠️ Aggiorna `NEXT_PUBLIC_WEBHOOK_URL` su Vercel quando ngrok cambia URL
- ⚠️ Task Scheduler esegue ogni 15 min ma lo script decide se eseguire il sync
- ⚠️ I log vengono salvati in `logs/` - controlla periodicamente

## 🤝 Supporto

Per problemi o domande:
1. Controlla la documentazione in questo README
2. Consulta i file di documentazione specifici
3. Controlla i log per dettagli sugli errori

## 📜 Licenza

Progetto privato - Tutti i diritti riservati
