# Guida Rapida: Script Trigger Sync

Script PowerShell per avviare sincronizzazioni manuali da riga di comando o Task Scheduler.

## 📋 Prerequisiti

1. **Dashboard Vercel attiva**: https://import-convex-dwh.vercel.app
2. **Webhook server attivo** su `http://localhost:5000`
3. **Ngrok tunnel attivo** (se usi ngrok)
4. **App configurata** nella dashboard

## ℹ️ Nota Importante

I sync avviati con questo script vengono registrati in Convex come **sync schedulati** (`triggered_by = "cron"`), non come sync manuali. Questo permette di distinguerli dai sync avviati manualmente tramite il pulsante "Sync Now" nella dashboard.

## 🚀 Uso Manuale

### Metodo 1: Script Batch (Più Semplice)

```cmd
TRIGGER_SYNC.bat nome_app
```

Esempio:
```cmd
TRIGGER_SYNC.bat my_app
```

### Metodo 2: PowerShell Diretto

```powershell
.\trigger_sync.ps1 -AppName "nome_app"
```

Esempio:
```powershell
.\trigger_sync.ps1 -AppName "my_app"
```

## ⏰ Schedulazione con Task Scheduler

### Setup Rapido (5 passi)

1. **Apri Task Scheduler**
   - Premi `Win + R`
   - Digita `taskschd.msc`
   - Premi Invio

2. **Crea Nuova Attività**
   - Click destro su "Libreria Utilità di pianificazione"
   - Seleziona "Crea attività..."

3. **Configura Generale**
   - Nome: `Sync App - nome_app`
   - Descrizione: `Sincronizzazione automatica per nome_app`
   - Seleziona: "Esegui indipendentemente dalla connessione dell'utente"
   - Seleziona: "Esegui con i privilegi più elevati"

4. **Configura Trigger**
   - Tab "Trigger" → Click "Nuovo..."
   - Scegli frequenza (es: Giornaliero, Ogni ora, ecc.)
   - Imposta orario di inizio
   - Click "OK"

5. **Configura Azione**
   - Tab "Azioni" → Click "Nuovo..."
   - Azione: "Avvio programma"
   - Programma: `C:\Windows\System32\cmd.exe`
   - Argomenti: `/c "cd /d C:\percorso\progetto && TRIGGER_SYNC.bat nome_app"`
   - Sostituisci `C:\percorso\progetto` con il percorso reale
   - Sostituisci `nome_app` con il nome della tua app
   - Click "OK"

### Esempio Configurazione Completa

**Per sincronizzare "my_app" ogni giorno alle 02:00:**

- **Generale**
  - Nome: `Sync App - my_app`
  - Esegui indipendentemente dalla connessione dell'utente: ✓
  - Esegui con i privilegi più elevati: ✓

- **Trigger**
  - Tipo: Giornaliero
  - Ora: 02:00
  - Ricorrenza: Ogni 1 giorno

- **Azione**
  - Programma: `C:\Windows\System32\cmd.exe`
  - Argomenti: `/c "cd /d C:\Fabrizio\ProgettiKiro\Abaddon_DWH && TRIGGER_SYNC.bat my_app"`

## 📊 Output dello Script

Lo script mostra:
```
=== Trigger Sync per App: my_app ===

[1/3] Recupero configurazione app da Convex...
✓ App trovata: my_app
  Deploy Key: xxxxx
  Tabelle: table1, table2

[2/3] Creazione job di sincronizzazione...
✓ Job creato con ID: xxxxx

[3/3] Avvio sincronizzazione tramite webhook...
✓ Sincronizzazione avviata con successo!

Dettagli:
  Job ID: xxxxx
  App: my_app
  Messaggio: Sync job started successfully

Puoi monitorare il progresso nella dashboard:
  https://import-convex-dwh.vercel.app/logs

=== Completato ===
```

## 🔍 Monitoraggio

Dopo aver avviato la sincronizzazione:

1. **Dashboard Web**: https://import-convex-dwh.vercel.app/logs
2. **Log locali**: Controlla i log del webhook server
3. **Task Scheduler**: Visualizza la cronologia delle esecuzioni

## ❌ Risoluzione Problemi

### Errore: "App non trovata"
- Verifica che il nome dell'app sia corretto
- Controlla che l'app esista nella dashboard

### Errore: "Variabile NEXT_PUBLIC_CONVEX_URL non configurata"
- Verifica che il file `dashboard/.env.local` esista
- Verifica che contenga tutte le variabili necessarie

### Errore: "Impossibile avviare sincronizzazione"
- Verifica che il webhook server sia attivo
- Verifica che ngrok sia attivo (se lo usi)
- Controlla i log del webhook server per dettagli

### Task Scheduler non esegue lo script
- Verifica che il percorso nel comando sia corretto
- Verifica che l'utente abbia i permessi necessari
- Controlla la cronologia delle esecuzioni in Task Scheduler

## 💡 Suggerimenti

1. **Test manuale prima**: Testa sempre lo script manualmente prima di schedularlo
2. **Log delle esecuzioni**: Task Scheduler mantiene un log delle esecuzioni
3. **Notifiche**: Configura le notifiche email nel sistema per essere avvisato dei sync
4. **Backup**: Mantieni sempre un backup della configurazione di Task Scheduler

## 🔗 Vantaggi rispetto a scheduled_sync_runner.py

- ✅ **Più semplice**: Un solo comando per app
- ✅ **Più flessibile**: Puoi schedulare ogni app con frequenze diverse
- ✅ **Più affidabile**: Task Scheduler è nativo di Windows
- ✅ **Più controllabile**: Ogni app ha il suo task separato
- ✅ **Più tracciabile**: Log separati per ogni esecuzione

## 📝 Note

- Lo script richiede che webhook server e ngrok siano attivi
- Le variabili d'ambiente vengono caricate da `dashboard/.env.local`
- Lo script esce con codice 0 in caso di successo, 1 in caso di errore
- Task Scheduler può inviare email in caso di errore (configurabile)
