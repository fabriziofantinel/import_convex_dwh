# Task 6 Completato: Lancio Manuale Sync

## Stato: ✅ Completato

## Componenti Implementati

### 6.1 Pulsante "Sync Now"
- ✅ **Integrazione Convex Action** (`app/page.tsx`)
  - Chiamata a `api.actions.triggerSync` quando si clicca "Sync Now"
  - Parametri: `app_id` e `triggered_by: "manual"`
  - Loading indicator durante l'esecuzione
  - Gestione errori con banner visivo
  - Rimozione dal set syncing in caso di errore

- ✅ **Custom Hook useSyncJobs** (`lib/hooks/useSyncJobs.ts`)
  - Hook per ottenere l'ultimo sync job di ogni app
  - Query multiple in parallelo per performance
  - Ritorna una Map di appId → latest job
  - Usato per mostrare stato e statistiche nelle card

- ✅ **Integrazione Dati Reali**
  - Rimossi mock data
  - Query `api.queries.listSyncApps` per lista app
  - Query `api.queries.getSyncJobs` per job history
  - Loading state durante fetch iniziale
  - Empty state quando non ci sono app

### 6.2 Polling Stato Sync
- ✅ **Custom Hook useSyncPolling** (`lib/hooks/useSyncPolling.ts`)
  - Polling automatico ogni 2 secondi (via Convex reactivity)
  - Monitora solo app con sync in esecuzione
  - Callback `onSyncComplete` quando status cambia da running a success/failed
  - Tracking dello stato precedente per rilevare cambiamenti
  - Cleanup automatico on unmount

- ✅ **Integrazione Dashboard**
  - Hook `useSyncPolling` integrato nella dashboard
  - Callback `handleSyncComplete` rimuove app dal set syncing
  - UI si aggiorna automaticamente quando sync completa
  - Nessun refresh manuale necessario

### 6.3 Prevenzione Sync Concorrenti
- ✅ **Validazione Client-Side**
  - Check dello stato job prima di avviare sync
  - Messaggio di errore se sync già running/pending
  - Pulsante disabilitato quando `isRunning` è true
  - Visual feedback con spinner durante sync

- ✅ **Gestione Stati**
  - Stati considerati "running": `running`, `pending`, `isSyncing`
  - AppCard mostra stato corretto in tempo reale
  - Prevenzione click multipli sul pulsante
  - Messaggio chiaro all'utente se tenta sync concorrente

## Flow Completo

### 1. Utente Clicca "Sync Now"
```typescript
handleSyncNow(appId)
  ↓
Check if already running (status === "running" || "pending")
  ↓
Add to syncingApps set (UI shows loading)
  ↓
Call triggerSync action
  ↓
Success: sync started on webhook server
  OR
Error: show error banner, remove from syncingApps
```

### 2. Polling Aggiorna UI
```typescript
useSyncPolling monitors running syncs
  ↓
Query getSyncJobs every ~2s (Convex reactivity)
  ↓
Detect status change: running → success/failed
  ↓
Call onSyncComplete(appId)
  ↓
Remove from syncingApps set
  ↓
UI updates automatically (card shows final status)
```

### 3. Prevenzione Concorrenza
```typescript
User clicks "Sync Now"
  ↓
Check latestJob.status
  ↓
If running/pending: show error, return early
  ↓
If not running: proceed with sync
  ↓
Button disabled while isRunning === true
```

## Requirements Soddisfatti
- ✅ 3.1: Inviare richiesta HTTP al webhook quando si clicca "Sync Now"
- ✅ 3.3: Mostrare stato "Running" durante sync
- ✅ 3.4: Aggiornare stato a "Success" quando completa
- ✅ 3.5: Aggiornare stato a "Failed" con messaggio errore
- ✅ 3.6: Impedire avvio nuovo sync se uno è già in esecuzione
- ✅ 9.4: Mostrare loading indicator durante operazioni asincrone

## Tecnologie Utilizzate

### Convex Hooks
```typescript
// Query per lista app
const apps = useQuery(api.queries.listSyncApps);

// Action per triggerare sync
const triggerSync = useAction(api.actions.triggerSync);

// Query per job history
const jobs = useQuery(api.queries.getSyncJobs, { app_id, limit: 1 });
```

### React Hooks Custom
```typescript
// Hook per ottenere latest jobs
const latestJobs = useLatestSyncJobs(appIds);

// Hook per polling stato
useSyncPolling(appIds, syncingApps, handleSyncComplete);
```

### State Management
```typescript
// Set per tracking sync in esecuzione
const [syncingApps, setSyncingApps] = useState<Set<Id<"sync_apps">>>(new Set());

// Error state per banner
const [syncError, setSyncError] = useState<string | null>(null);
```

## User Experience

### Visual Feedback
- ✅ Spinner nel pulsante durante sync
- ✅ Badge colorato aggiornato in tempo reale
- ✅ Statistiche aggiornate dopo sync
- ✅ Banner di errore dismissibile
- ✅ Loading state durante fetch iniziale

### Error Handling
- ✅ Messaggio chiaro se sync fallisce
- ✅ Prevenzione sync concorrenti con messaggio
- ✅ Gestione errori di rete
- ✅ Timeout handling (via Convex)

## Prossimi Passi
Il Task 6 è completato. Ora si può procedere con:
- **Task 7**: Implementare visualizzazione log (pagina logs, componenti)
- **Task 8**: Implementare configurazioni globali (SQL, Email)
- **Task 9**: Implementare Flask webhook server (VM Windows)

## Note Tecniche
- Convex fornisce reactivity automatica (no polling manuale necessario)
- Il polling è "smart": monitora solo app con sync attivi
- Cleanup automatico per evitare memory leaks
- Gestione ottimistica dell'UI per UX migliore
- Error boundaries potrebbero essere aggiunti per robustezza
