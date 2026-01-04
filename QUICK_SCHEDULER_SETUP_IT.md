# Setup Rapido Task Scheduler

## Cosa fa

Lo script `scheduled_sync_runner.py` controlla ogni 15 minuti quali app devono essere sincronizzate e le esegue automaticamente.

## Setup in 5 passi

### 1. Apri Task Scheduler
```
Win + R → taskschd.msc → Invio
```

### 2. Crea Nuova Attività
- Clicca "Crea attività..." (pannello destro)
- **Nome**: `Convex Sync Scheduler`

### 3. Configura Trigger
- Scheda "Trigger" → Nuovo
- Ogni giorno, ore 00:00
- Ripeti ogni: **15 minuti**
- Per una durata di: **1 giorno**

### 4. Configura Azione
- Scheda "Azioni" → Nuovo
- Programma/script:
  ```
  C:\Fabrizio\ProgettiKiro\Abaddon_DWH\RUN_SCHEDULED_SYNC.bat
  ```
- Inizia da:
  ```
  C:\Fabrizio\ProgettiKiro\Abaddon_DWH
  ```

### 5. Configura Condizioni
- Scheda "Condizioni"
- Deseleziona: "Avvia solo se alimentato da rete elettrica"
- Seleziona: "Avvia solo se disponibile connessione di rete"

## Test

Dopo aver salvato, testa subito:
1. Trova l'attività nella lista
2. Tasto destro → **Esegui**
3. Controlla il log: `logs/scheduled_sync_runner.log`

## Come funziona

```
Task Scheduler (ogni 15 min)
    ↓
RUN_SCHEDULED_SYNC.bat
    ↓
scheduled_sync_runner.py
    ↓
Interroga dashboard per app schedulate
    ↓
Verifica se è il momento di eseguire
    ↓
Triggera sync via API dashboard
```

## Vantaggi

✅ Nessun processo sempre attivo  
✅ Affidabile (Task Scheduler nativo Windows)  
✅ Log dettagliati  
✅ Schedulazione gestita dal dashboard  
✅ Finestra di 15 minuti per esecuzione  

## Verifica

Controlla i log:
```
logs/scheduled_sync_runner.log
```

Esempio output:
```
[2025-01-04 12:45:01] Checking app: app2 (schedule: 45 12 * * *)
[2025-01-04 12:45:01] Schedule match: 45 12 * * * matches current time 12:45
[2025-01-04 12:45:01] Triggering sync for app: app2
[2025-01-04 12:45:02] ✓ Sync started successfully for app2 (job_id: xyz)
```

## Documentazione Completa

Vedi `TASK_SCHEDULER_SETUP_IT.md` per istruzioni dettagliate e troubleshooting.
