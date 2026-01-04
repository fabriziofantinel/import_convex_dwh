# Architettura del Sistema - Convex to SQL Server Sync

## Diagramma Architetturale

```mermaid
graph TB
    subgraph "BROWSER"
        USER[👤 Utente]
    end

    subgraph "VERCEL CLOUD"
        DASHBOARD[🌐 Next.js Dashboard<br/>import-convex-dwh.vercel.app]
        PROXY_FETCH[📡 /api/proxy-fetch-tables]
        PROXY_SYNC[📡 /api/proxy-trigger-sync]
        CRON_API[📡 /api/cron/app_name]
    end

    subgraph "CONVEX CLOUD"
        CONVEX_DB[(🗄️ Convex Database<br/>- sync_apps<br/>- sync_jobs<br/>- sql_config<br/>- email_config)]
        CONVEX_QUERIES[📖 Queries<br/>listSyncApps<br/>getSyncJobs<br/>getAllSyncJobs]
        CONVEX_MUTATIONS[✏️ Mutations<br/>createSyncJob<br/>updateSyncJob]
        CONVEX_ACTIONS[⚡ Actions<br/>triggerSync<br/>fetchAvailableTables]
    end

    subgraph "MACCHINA WINDOWS LOCALE"
        WEBHOOK[🔌 Webhook Server<br/>Flask :5000<br/>webhook_server.py]
        NGROK[🌐 ngrok<br/>Tunnel pubblico<br/>*.ngrok-free.dev]
        SCHEDULER[⏰ Cron Scheduler<br/>cron_scheduler.py]
        SYNC[🔄 Sync Script<br/>sync.py]
        SQL_SERVER[(💾 SQL Server<br/>Database locale)]
    end

    subgraph "INTERNET"
        CONVEX_EXPORT[📦 Convex Export<br/>Snapshot ZIP]
    end

    %% User interactions
    USER -->|1. Accede via browser| DASHBOARD
    USER -->|2. Click "Fetch Tables"| PROXY_FETCH
    USER -->|3. Click "Sync Now"| PROXY_SYNC

    %% Dashboard to Convex
    DASHBOARD -->|Query data| CONVEX_QUERIES
    DASHBOARD -->|Update config| CONVEX_MUTATIONS
    
    %% Proxy endpoints
    PROXY_FETCH -->|Call action| CONVEX_ACTIONS
    PROXY_SYNC -->|Call action| CONVEX_ACTIONS
    
    %% Convex to Database
    CONVEX_QUERIES -->|Read| CONVEX_DB
    CONVEX_MUTATIONS -->|Write| CONVEX_DB
    CONVEX_ACTIONS -->|Read/Write| CONVEX_DB
    
    %% Convex to Webhook
    CONVEX_ACTIONS -->|HTTP POST| NGROK
    NGROK -->|Forward| WEBHOOK
    
    %% Convex Export
    CONVEX_ACTIONS -->|Download snapshot| CONVEX_EXPORT
    WEBHOOK -->|Download snapshot| CONVEX_EXPORT
    
    %% Webhook to Sync
    WEBHOOK -->|Execute| SYNC
    SYNC -->|Export data| CONVEX_EXPORT
    SYNC -->|Import data| SQL_SERVER
    SYNC -->|Callback status| NGROK
    
    %% Scheduler
    SCHEDULER -->|Check schedules| CRON_API
    CRON_API -->|Trigger| CONVEX_ACTIONS
    
    %% Styling
    classDef cloud fill:#e1f5ff,stroke:#0288d1,stroke-width:2px
    classDef local fill:#fff3e0,stroke:#f57c00,stroke-width:2px
    classDef database fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    classDef user fill:#e8f5e9,stroke:#388e3c,stroke-width:2px
    
    class DASHBOARD,PROXY_FETCH,PROXY_SYNC,CRON_API cloud
    class CONVEX_DB,CONVEX_QUERIES,CONVEX_MUTATIONS,CONVEX_ACTIONS cloud
    class WEBHOOK,NGROK,SCHEDULER,SYNC local
    class SQL_SERVER database
    class USER user
```

## Componenti del Sistema

### 🌐 VERCEL CLOUD
**Hosting:** Vercel (https://import-convex-dwh.vercel.app)

| Componente | Descrizione | Tecnologia |
|------------|-------------|------------|
| **Dashboard Web** | Interfaccia utente per gestire sync apps | Next.js 14, React, TypeScript |
| **/api/proxy-fetch-tables** | Proxy per chiamare Convex fetchAvailableTables | Next.js API Route |
| **/api/proxy-trigger-sync** | Proxy per triggerare sync manuale | Next.js API Route |
| **/api/cron/[app_name]** | Endpoint per schedulazione automatica | Next.js API Route |

**Variabili d'ambiente:**
- `NEXT_PUBLIC_CONVEX_URL`: URL del deployment Convex
- `NEXT_PUBLIC_WEBHOOK_URL`: URL pubblico ngrok
- `NEXT_PUBLIC_WEBHOOK_TOKEN`: Token di autenticazione
- `CRON_SECRET`: Secret per autenticare chiamate cron

---

### ☁️ CONVEX CLOUD
**Hosting:** Convex (https://blissful-schnauzer-295.convex.cloud)

| Componente | Descrizione | File |
|------------|-------------|------|
| **Database** | Database NoSQL con tabelle sync_apps, sync_jobs, sql_config, email_config | Convex DB |
| **Queries** | Funzioni di lettura (listSyncApps, getSyncJobs, getAllSyncJobs) | `queries.ts` |
| **Mutations** | Funzioni di scrittura (createSyncJob, updateSyncJob, createSyncApp) | `mutations.ts` |
| **Actions** | Funzioni con side-effects (triggerSync, fetchAvailableTables) | `actions.ts` |
| **Schema** | Definizione struttura database | `schema.ts` |

**Tabelle Database:**
- `sync_apps`: Configurazioni delle applicazioni da sincronizzare
- `sync_jobs`: Storico dei job di sincronizzazione
- `sql_config`: Configurazione SQL Server
- `email_config`: Configurazione email notifications

---

### 💻 MACCHINA WINDOWS LOCALE
**Hosting:** PC Windows locale

| Componente | Descrizione | File | Porta |
|------------|-------------|------|-------|
| **Webhook Server** | Server Flask che riceve richieste e esegue sync | `webhook_server.py` | 5000 |
| **ngrok** | Tunnel per esporre webhook server pubblicamente | ngrok CLI | - |
| **Cron Scheduler** | Scheduler Python per sync automatici | `cron_scheduler.py` | - |
| **Sync Script** | Script che esegue export da Convex e import su SQL Server | `sync.py` | - |
| **SQL Server** | Database di destinazione | SQL Server | 1433 |

**Processi attivi:**
- ProcessId 9: `webhook_server.py` (Flask :5000)
- ProcessId 10: `ngrok http 5000` (Tunnel pubblico)
- ProcessId 15: `cron_scheduler.py` (Scheduler)

**Variabili d'ambiente (.env):**
- `WEBHOOK_TOKEN`: Token per autenticare richieste
- `CONVEX_WEBHOOK_URL`: URL Convex per callback
- `DASHBOARD_URL`: URL dashboard Vercel
- `NEXT_PUBLIC_WEBHOOK_URL`: URL pubblico ngrok
- `SQL_SERVER`: Indirizzo SQL Server
- `SQL_DATABASE`: Nome database
- `SQL_USERNAME`: Username SQL
- `SQL_PASSWORD`: Password SQL

---

## Flussi Principali

### 🔄 Flusso 1: Sync Manuale (Utente clicca "Sync Now")

```
1. Utente → Dashboard: Click "Sync Now"
2. Dashboard → /api/proxy-trigger-sync: POST {app_id, triggered_by: "manual"}
3. Proxy → Convex Actions: triggerSync(app_id, "manual")
4. Convex → Database: Crea sync_job con status "pending"
5. Convex → Database: Aggiorna sync_job a status "running"
6. Convex → ngrok → Webhook: POST /api/sync/{app_name} {job_id, deploy_key, tables}
7. Webhook → sync.py: Esegue script Python
8. sync.py → Convex Export: Scarica snapshot ZIP
9. sync.py → SQL Server: Importa dati
10. sync.py → ngrok → Convex: Callback con risultato
11. Convex → Database: Aggiorna sync_job con status "success"/"failed"
12. Dashboard: Polling e mostra risultato
```

### ⏰ Flusso 2: Sync Schedulato (Cron Scheduler)

```
1. Scheduler: Controlla ogni 60s le app schedulate
2. Scheduler → /api/cron/check-scheduled-syncs: GET lista app
3. Scheduler: Alle ore programmate chiama /api/proxy-trigger-sync
4. [Segue stesso flusso del Sync Manuale dal punto 3]
```

### 📋 Flusso 3: Fetch Tables (Utente clicca "Fetch Tables")

```
1. Utente → Dashboard: Click "Fetch Tables"
2. Dashboard → /api/proxy-fetch-tables: POST {deploy_key}
3. Proxy → Convex Actions: fetchAvailableTables(deploy_key)
4. Convex → ngrok → Webhook: POST /api/fetch-tables {deploy_key}
5. Webhook → Convex CLI: npx convex export
6. Webhook: Estrae nomi tabelle da snapshot ZIP
7. Webhook → Convex: Ritorna lista tabelle
8. Dashboard: Mostra tabelle disponibili
```

---

## Sicurezza

### 🔐 Autenticazione

| Connessione | Metodo | Token/Secret |
|-------------|--------|--------------|
| Dashboard → Convex | Convex Deploy Key | `CONVEX_DEPLOY_KEY` |
| Dashboard → Webhook | Bearer Token | `NEXT_PUBLIC_WEBHOOK_TOKEN` |
| Scheduler → Dashboard | Bearer Token | `CRON_SECRET` |
| Webhook → SQL Server | SQL Authentication | `SQL_USERNAME` + `SQL_PASSWORD` |

### 🛡️ Protezioni

- **CORS**: Configurato su webhook server per accettare richieste da Vercel
- **Rate Limiting**: 60 req/min con burst di 10 sul webhook server
- **Audit Logging**: Tutte le richieste webhook vengono loggate
- **ngrok Browser Warning**: Bypassato tramite header `ngrok-skip-browser-warning`

---

## Deployment

### Vercel Dashboard
```bash
git push origin main  # Auto-deploy su Vercel
```

### Convex Database
```bash
cd dashboard
npx convex deploy  # Deploy schema e functions
```

### Servizi Locali
```bash
# Webhook Server
python webhook_server.py

# ngrok Tunnel
ngrok http 5000

# Cron Scheduler
python cron_scheduler.py
```

---

## Monitoraggio

### Dashboard Web
- **URL**: https://import-convex-dwh.vercel.app
- **Pagine**: Home, Apps, Logs, Scheduling, Settings

### Logs
- **Sync Jobs**: Visualizzabili nella pagina /logs
- **Webhook Logs**: Console del webhook server
- **Scheduler Logs**: Console del cron scheduler

### Health Checks
- **Webhook**: GET http://localhost:5000/health
- **ngrok**: Visibile su https://dashboard.ngrok.com
- **Convex**: Dashboard Convex

---

## Note Tecniche

### Limitazioni Convex
- Non supporta filtri diretti su range di date negli indici
- Query `getAllSyncJobs` prende 500 record e filtra in memoria

### Limitazioni Vercel Free Tier
- Timeout 10 secondi per API routes
- Sync lunghi gestiti tramite webhook asincrono

### ngrok
- URL pubblico cambia ad ogni restart (free tier)
- Necessario aggiornare `NEXT_PUBLIC_WEBHOOK_URL` su Vercel dopo restart

---

**Creato**: 2026-01-04  
**Versione**: 1.0
