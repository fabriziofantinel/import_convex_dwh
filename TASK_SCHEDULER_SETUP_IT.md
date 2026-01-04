# Configurazione Task Scheduler per Sync Schedulati

Questa guida spiega come configurare il Task Scheduler di Windows per eseguire automaticamente i sync schedulati.

## Panoramica

Il sistema usa un approccio semplice:
1. **Task Scheduler** esegue `RUN_SCHEDULED_SYNC.bat` ogni 15 minuti
2. Lo script Python `scheduled_sync_runner.py` interroga il dashboard per le app schedulate
3. Per ogni app, verifica se è il momento di eseguire il sync in base al cron schedule
4. Se sì, triggera il sync tramite l'API del dashboard

## Vantaggi di questo approccio

- ✅ Nessun processo Python sempre attivo in background
- ✅ Task Scheduler è affidabile e nativo di Windows
- ✅ Facile da monitorare tramite Task Scheduler UI
- ✅ Log dettagliati in `logs/scheduled_sync_runner.log`
- ✅ Schedulazione gestita dal dashboard (nessuna modifica al Task Scheduler necessaria)

## Prerequisiti

1. Webhook server e ngrok devono essere attivi
2. Dashboard deployato su Vercel
3. Variabili d'ambiente configurate in `.env`:
   ```
   DASHBOARD_URL=https://import-convex-dwh.vercel.app
   WEBHOOK_TOKEN=test-token-12345
   ```

## Configurazione Task Scheduler

### Passo 1: Aprire Task Scheduler

1. Premi `Win + R`
2. Digita `taskschd.msc` e premi Invio
3. Si aprirà il Task Scheduler

### Passo 2: Creare una Nuova Attività

1. Nel pannello di destra, clicca su **"Crea attività..."** (non "Crea attività di base")
2. Si aprirà la finestra di configurazione

### Passo 3: Scheda "Generale"

1. **Nome**: `Convex Sync Scheduler`
2. **Descrizione**: `Esegue i sync schedulati per le app Convex ogni 15 minuti`
3. **Opzioni di sicurezza**:
   - Seleziona: "Esegui indipendentemente dalla connessione dell'utente"
   - Seleziona: "Esegui con i privilegi più elevati" (se necessario)
4. **Configura per**: Windows 10

### Passo 4: Scheda "Trigger"

1. Clicca su **"Nuovo..."**
2. **Avvia l'attività**: Secondo una pianificazione
3. **Impostazioni**:
   - Seleziona: "Ogni giorno"
   - Ora di inizio: 00:00:00
   - Ricorrenza: ogni 1 giorni
4. **Impostazioni avanzate**:
   - Seleziona: "Ripeti l'attività ogni: 15 minuti"
   - Seleziona: "per una durata di: 1 giorno"
   - Seleziona: "Attivato"
5. Clicca **OK**

### Passo 5: Scheda "Azioni"

1. Clicca su **"Nuovo..."**
2. **Azione**: Avvia un programma
3. **Programma/script**: 
   ```
   C:\Fabrizio\ProgettiKiro\Abaddon_DWH\RUN_SCHEDULED_SYNC.bat
   ```
   (Sostituisci con il percorso completo del tuo file .bat)
4. **Inizia da (facoltativo)**:
   ```
   C:\Fabrizio\ProgettiKiro\Abaddon_DWH
   ```
   (La directory del progetto)
5. Clicca **OK**

### Passo 6: Scheda "Condizioni"

1. **Alimentazione**:
   - Deseleziona: "Avvia l'attività solo se il computer è alimentato da rete elettrica"
   - Deseleziona: "Interrompi se il computer passa all'alimentazione a batteria"
2. **Rete**:
   - Seleziona: "Avvia solo se è disponibile la seguente connessione di rete"
   - Seleziona: "Qualsiasi connessione"

### Passo 7: Scheda "Impostazioni"

1. Seleziona: "Consenti l'esecuzione dell'attività su richiesta"
2. Seleziona: "Esegui l'attività appena possibile dopo la mancata esecuzione pianificata"
3. Seleziona: "Se l'attività non riesce, riavvia ogni: 1 minuto"
4. Seleziona: "Tenta di riavviare fino a: 3 volte"
5. Deseleziona: "Interrompi l'attività se viene eseguita per più di: 3 giorni"
6. Seleziona: "Se l'attività in esecuzione non termina quando richiesto, forza l'interruzione"

### Passo 8: Salvare e Testare

1. Clicca **OK** per salvare l'attività
2. Inserisci la password del tuo account Windows se richiesto
3. Trova l'attività nella lista
4. Clicca con il tasto destro → **"Esegui"** per testare immediatamente

## Verifica del Funzionamento

### 1. Controlla i Log

Apri il file `logs/scheduled_sync_runner.log` per vedere l'output:

```
[2025-01-04 14:00:01] ======================================================================
[2025-01-04 14:00:01] SCHEDULED SYNC RUNNER - START
[2025-01-04 14:00:01] ======================================================================
[2025-01-04 14:00:01] Checking for scheduled apps...
[2025-01-04 14:00:02] Found 2 scheduled apps
[2025-01-04 14:00:02] Checking app: app2 (schedule: 45 12 * * *)
[2025-01-04 14:00:02] Schedule mismatch: 45 12 * * * vs current time 14:00 (diff: 75 min)
[2025-01-04 14:00:02] Skipping app2: not time to run
[2025-01-04 14:00:02] ----------------------------------------------------------------------
[2025-01-04 14:00:02] Summary: 0 syncs triggered, 2 skipped
[2025-01-04 14:00:02] ======================================================================
```

### 2. Controlla Task Scheduler

1. Apri Task Scheduler
2. Trova l'attività "Convex Sync Scheduler"
3. Nella scheda "Cronologia" puoi vedere tutte le esecuzioni
4. Controlla "Ultima esecuzione" e "Risultato ultima esecuzione"

### 3. Controlla il Dashboard

1. Vai su https://import-convex-dwh.vercel.app/logs
2. Verifica che i sync schedulati appaiano con `triggered_by: "scheduled"`

## Test Manuale

Per testare lo script manualmente senza aspettare il Task Scheduler:

```cmd
cd C:\Fabrizio\ProgettiKiro\Abaddon_DWH
RUN_SCHEDULED_SYNC.bat
```

Oppure direttamente con Python:

```cmd
python scheduled_sync_runner.py
```

## Troubleshooting

### L'attività non si avvia

1. Verifica che il percorso del file .bat sia corretto
2. Verifica che Python sia installato nel percorso specificato nel .bat
3. Controlla i log di Task Scheduler (scheda "Cronologia")

### Lo script non trova le app schedulate

1. Verifica che `DASHBOARD_URL` in `.env` sia corretto
2. Verifica che il dashboard sia raggiungibile
3. Controlla i log in `logs/scheduled_sync_runner.log`

### I sync non vengono triggerati

1. Verifica che webhook server e ngrok siano attivi
2. Verifica che `NEXT_PUBLIC_WEBHOOK_URL` su Vercel sia aggiornato
3. Controlla che le app abbiano `cron_enabled: true` nel dashboard
4. Verifica che il cron schedule sia corretto (formato: `minute hour * * *`)

### Finestra di esecuzione

Lo script ha una finestra di 15 minuti per eseguire i sync. Se scheduli un'app alle 12:45:
- Lo script controllerà alle 12:45, 13:00, 13:15, ecc.
- Se l'orario corrente è tra 12:45 e 13:00, il sync verrà eseguito
- Questo evita di perdere sync se il Task Scheduler ha qualche ritardo

## Disabilitare il Task Scheduler

Se vuoi disabilitare temporaneamente i sync schedulati:

1. Apri Task Scheduler
2. Trova "Convex Sync Scheduler"
3. Clicca con il tasto destro → **"Disabilita"**

Per riabilitare:
1. Clicca con il tasto destro → **"Abilita"**

## Note Importanti

- ⚠️ Il Task Scheduler esegue lo script ogni 15 minuti, ma lo script decide se è il momento di eseguire il sync
- ⚠️ Assicurati che webhook server e ngrok siano sempre attivi
- ⚠️ I log vengono salvati in `logs/scheduled_sync_runner.log` - controlla periodicamente
- ⚠️ Se cambi la schedulazione di un'app nel dashboard, non serve modificare il Task Scheduler
