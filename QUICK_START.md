# Quick Start Guide

Guida rapida per l'uso quotidiano del sync Convex → SQL Server.

## 🚀 Setup Iniziale (una volta sola)

### 1. Installa dipendenze

```bash
pip install -r requirements.txt
```

### 2. Configura `config.json`

Copia e modifica il template:

```bash
copy config.example.json config.json
```

Modifica `config.json` con i tuoi dati:

```json
{
  "convex_apps": {
    "appclinics": {
      "deploy_key": "TUA_DEPLOY_KEY_QUI",
      "tables": ["cliniche"],
      "table_mapping": {
        "cliniche": "convex_cliniche"
      }
    }
  },
  "sql_server": {
    "connection_string": "Driver={SQL Server};Server=18.197.31.166;Database=DWH_LAKE;UID=sa;PWD=PASSWORD;",
    "schema": "dbo",
    "timeout": 30
  },
  "email": {
    "smtp_host": "smtp.gmail.com",
    "smtp_port": 587,
    "smtp_user": "tua-email@gmail.com",
    "smtp_password": "tua-password",
    "from_email": "tua-email@gmail.com",
    "to_emails": ["destinatario@example.com"],
    "use_tls": true
  },
  "log_dir": "logs",
  "retry_attempts": 3,
  "retry_backoff": 2.0
}
```

## 📝 Uso Quotidiano

### Esecuzione Manuale

```bash
python sync.py appclinics
```

### Con configurazione custom

```bash
python sync.py appclinics --config custom_config.json
```

### Con directory log custom

```bash
python sync.py appclinics --log-dir ./custom_logs
```

## 📊 Output e Informazioni Backup

Durante l'esecuzione vedrai informazioni dettagliate sul backup scaricato:

```
======================================================================
CONVEX TO SQL SERVER SYNC
======================================================================
App: appclinics
Config: config.json
Started: 2025-12-23 11:59:03
======================================================================

✓ Configuration loaded
  - Tables: ['cliniche']
  - SQL Schema: dbo
  - Log Dir: logs

Downloading backup from Convex...
  Snapshot created: 2025-12-23 11:59:05
  Dashboard: https://dashboard.convex.dev/d/bold-husky-496/settings/snapshot-export
✓ Backup downloaded
  - Tables: 1
  - Total rows: 3

Connecting to SQL Server...
✓ Connected to SQL Server
  - Schema: dbo

Importing tables...
  - cliniche → convex_cliniche... ✓ 3 rows (0.14s)

======================================================================
SUMMARY
======================================================================
Tables processed: 1
  ✓ Success: 1
  ✗ Failed: 0
Total rows imported: 3
Duration: 3.68s
Log file: logs\sync_appclinics_20251223_115903.log
======================================================================
```

**Informazioni sul Backup:**
- **Snapshot created**: Timestamp di creazione del backup (formato leggibile)
- **Dashboard**: Link diretto al backup su Convex dashboard
- Il sistema scarica automaticamente l'ultimo backup disponibile
- Tutte le informazioni dettagliate sono registrate nel file di log

**Strategia di Import:**
- **Tabella esistente**: TRUNCATE + INSERT (svuota e ricarica)
- **Tabella nuova**: CREATE + INSERT (crea e carica)
- Questo garantisce che la tabella contenga sempre solo i dati dell'ultimo snapshot, senza duplicati

## 📊 Verifica Risultati

### Controlla i log

```bash
# Ultimo log creato
dir logs /O-D /B | select -First 1

# Leggi ultimo log
type logs\sync_appclinics_YYYYMMDD_HHMMSS.log
```

### Verifica dati in SQL Server

```sql
-- Conta record
SELECT COUNT(*) FROM dbo.convex_cliniche;

-- Mostra dati
SELECT TOP 10 * FROM dbo.convex_cliniche;
```

## ⏰ Schedulazione con Task Manager

### 1. Apri Task Manager

```
Win + R → taskschd.msc
```

### 2. Crea nuova attività

- **Nome**: Convex Sync - appclinics
- **Trigger**: Giornaliero alle 02:00
- **Azione**:
  - Programma: `C:\Users\TUO_USER\AppData\Local\Programs\Python\Python311\python.exe`
  - Argomenti: `sync.py appclinics`
  - Directory: `C:\path\to\Abaddon_DWH`

### 3. Configura opzioni

- ✅ Esegui anche se utente non connesso
- ✅ Esegui con privilegi più elevati
- ✅ Configurato per: Windows 10

## 🔧 Troubleshooting Rapido

### Errore: "Cannot connect to SQL Server"

```bash
# Verifica connessione
ping 18.197.31.166

# Verifica driver ODBC
python -c "import pyodbc; print('\n'.join(pyodbc.drivers()))"
```

### Errore: "Deploy key invalid"

- Verifica deploy key in Convex Dashboard
- Copia/incolla senza spazi extra
- Verifica formato: `preview:team:project|token`

### Errore: "Table not found"

- La tabella viene creata automaticamente al primo import
- Verifica che lo schema `dbo` esista in SQL Server

### Email non arrivano

- Verifica credenziali SMTP in `config.json`
- Per Gmail: usa "App Password" invece della password normale
- Verifica firewall non blocchi porta 587

## 📁 Struttura File Essenziali

```
Abaddon_DWH/
├── sync.py              # Script principale
├── config.json          # TUA configurazione (non committare!)
├── config.example.json  # Template
├── requirements.txt     # Dipendenze
├── README.md           # Documentazione completa
├── QUICK_START.md      # Questa guida
├── src/                # Codice sorgente
├── tests/              # Test unitari
└── logs/               # Log esecuzioni
```

## 🎯 Comandi Utili

### Test connessione SQL Server

```bash
python -c "import pyodbc; conn = pyodbc.connect('Driver={SQL Server};Server=18.197.31.166;Database=DWH_LAKE;UID=sa;PWD=PASSWORD;'); print('✓ Connected')"
```

### Esegui test unitari

```bash
pytest tests/unit/ -v
```

### Pulisci log vecchi (oltre 30 giorni)

```bash
forfiles /P logs /S /M *.log /D -30 /C "cmd /c del @path"
```

## 📞 Supporto

Per problemi o domande, consulta il `README.md` completo o contatta il team.

## 🔄 Aggiornamento Configurazione

### Aggiungere nuova app Convex

Modifica `config.json`:

```json
{
  "convex_apps": {
    "appclinics": { ... },
    "nuova-app": {
      "deploy_key": "preview:team:nuova-app|token",
      "tables": ["users", "orders"],
      "table_mapping": {
        "users": "convex_users",
        "orders": "convex_orders"
      }
    }
  }
}
```

Poi esegui:

```bash
python sync.py nuova-app
```

### Aggiungere nuove tabelle

Modifica `config.json`:

```json
{
  "convex_apps": {
    "appclinics": {
      "tables": ["cliniche", "users", "appointments"],
      "table_mapping": {
        "cliniche": "convex_cliniche",
        "users": "convex_users",
        "appointments": "convex_appointments"
      }
    }
  }
}
```

Le nuove tabelle verranno create automaticamente al primo import.

## ✅ Checklist Pre-Produzione

- [ ] `config.json` configurato con credenziali corrette
- [ ] Test manuale eseguito con successo
- [ ] Log verificati in `logs/`
- [ ] Dati verificati in SQL Server
- [ ] Task Manager configurato
- [ ] Email di test ricevuta (simula errore)
- [ ] Backup di `config.json` salvato in luogo sicuro

## 🎉 Tutto Pronto!

Il sistema è ora configurato e pronto per l'uso in produzione.
