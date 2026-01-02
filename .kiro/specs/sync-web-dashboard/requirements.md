# Requirements Document - Sync Web Dashboard

## Introduction

Web dashboard per gestire configurazioni e lanciare manualmente i sync Convex → SQL Server. L'applicazione sarà deployata su Vercel con React, utilizzerà Convex per salvare le configurazioni, e Auth0 per l'autenticazione.

## Glossary

- **Dashboard**: Interfaccia web principale dell'applicazione
- **Sync_App**: Applicazione Convex configurata per il sync (es: appclinics)
- **Sync_Job**: Esecuzione di un sync per una specifica Sync_App
- **Webhook_Endpoint**: Endpoint HTTP sulla VM Windows che riceve richieste di sync
- **Convex**: Database e backend per salvare configurazioni e stato
- **Auth0**: Servizio di autenticazione per proteggere l'accesso
- **Vercel**: Piattaforma di hosting per il frontend React
- **Cron_Job**: Schedulazione automatica dei sync tramite Vercel Cron

## Requirements

### Requirement 1: Autenticazione Utente

**User Story:** Come amministratore, voglio autenticarmi con Auth0, così che solo utenti autorizzati possano accedere al dashboard.

#### Acceptance Criteria

1. WHEN un utente non autenticato visita l'applicazione THEN il sistema SHALL mostrare la pagina di login Auth0
2. WHEN un utente completa il login Auth0 THEN il sistema SHALL reindirizzare al dashboard principale
3. WHEN un utente autenticato visita l'applicazione THEN il sistema SHALL mostrare direttamente il dashboard
4. WHEN un utente clicca logout THEN il sistema SHALL terminare la sessione e reindirizzare al login
5. THE sistema SHALL salvare il token Auth0 per autenticare le richieste API

### Requirement 2: Gestione Configurazioni Applicazioni

**User Story:** Come amministratore, voglio configurare le applicazioni Convex da sincronizzare, così che possa gestire centralmente tutte le configurazioni.

#### Acceptance Criteria

1. WHEN un utente visualizza il dashboard THEN il sistema SHALL mostrare la lista di tutte le Sync_App configurate
2. WHEN un utente clicca "Add Application" THEN il sistema SHALL mostrare un form per creare una nuova Sync_App
3. WHEN un utente compila il form con nome, deploy_key, tabelle e mapping THEN il sistema SHALL salvare la configurazione in Convex
4. WHEN un utente clicca "Edit" su una Sync_App THEN il sistema SHALL mostrare il form precompilato per modificare la configurazione
5. WHEN un utente salva le modifiche THEN il sistema SHALL aggiornare la configurazione in Convex
6. WHEN un utente clicca "Delete" su una Sync_App THEN il sistema SHALL richiedere conferma e rimuovere la configurazione
7. THE sistema SHALL validare che deploy_key sia nel formato corretto (preview:team:project|token)
8. THE sistema SHALL validare che i nomi delle tabelle siano validi

### Requirement 3: Lancio Manuale Sync

**User Story:** Come amministratore, voglio lanciare manualmente un sync per un'applicazione, così che possa sincronizzare i dati on-demand.

#### Acceptance Criteria

1. WHEN un utente clicca "Sync Now" su una Sync_App THEN il sistema SHALL inviare una richiesta HTTP al Webhook_Endpoint sulla VM Windows
2. WHEN il Webhook_Endpoint riceve la richiesta THEN il sistema SHALL eseguire sync.py per quella Sync_App
3. WHEN il sync è in esecuzione THEN il sistema SHALL mostrare lo stato "Running" nel dashboard
4. WHEN il sync completa con successo THEN il sistema SHALL aggiornare lo stato a "Success" e mostrare timestamp e statistiche
5. WHEN il sync fallisce THEN il sistema SHALL aggiornare lo stato a "Failed" e mostrare il messaggio di errore
6. THE sistema SHALL impedire l'avvio di un nuovo sync se uno è già in esecuzione per la stessa Sync_App

### Requirement 4: Visualizzazione Stato e Log

**User Story:** Come amministratore, voglio visualizzare lo stato e i log dei sync, così che possa monitorare le esecuzioni e diagnosticare problemi.

#### Acceptance Criteria

1. WHEN un utente visualizza il dashboard THEN il sistema SHALL mostrare per ogni Sync_App lo stato dell'ultimo sync (Success/Failed/Running/Never Run)
2. WHEN un utente visualizza il dashboard THEN il sistema SHALL mostrare timestamp dell'ultimo sync e statistiche (tabelle processate, righe importate, durata)
3. WHEN un utente clicca "View Logs" su una Sync_App THEN il sistema SHALL mostrare gli ultimi 10 sync con dettagli completi
4. WHEN un utente clicca su un sync specifico THEN il sistema SHALL mostrare il log completo dell'esecuzione
5. THE sistema SHALL salvare in Convex lo stato e i log di ogni sync eseguito

### Requirement 5: Webhook Endpoint su VM Windows

**User Story:** Come sistema, voglio esporre un endpoint HTTP sulla VM Windows, così che il dashboard possa triggerare i sync remotamente.

#### Acceptance Criteria

1. THE sistema SHALL esporre un endpoint HTTP POST /api/sync/:app_name sulla VM Windows
2. WHEN l'endpoint riceve una richiesta POST THEN il sistema SHALL validare il token di autenticazione
3. WHEN il token è valido THEN il sistema SHALL eseguire sync.py per l'app_name specificato
4. WHEN il sync completa THEN il sistema SHALL inviare una callback a Convex con lo stato e i log
5. WHEN il sync fallisce THEN il sistema SHALL inviare una callback a Convex con l'errore
6. THE sistema SHALL impedire esecuzioni concorrenti per la stessa app_name
7. THE sistema SHALL loggare tutte le richieste ricevute

### Requirement 6: Schedulazione Automatica (Cron)

**User Story:** Come amministratore, voglio schedulare sync automatici per ogni applicazione, così che i dati vengano sincronizzati regolarmente senza intervento manuale.

#### Acceptance Criteria

1. WHEN un utente configura una Sync_App THEN il sistema SHALL permettere di specificare un cron schedule (es: "0 2 * * *" per ogni giorno alle 2:00)
2. WHEN un utente abilita lo schedule THEN il sistema SHALL configurare un Vercel Cron Job per quella Sync_App
3. WHEN il Vercel Cron Job si attiva THEN il sistema SHALL triggerare il sync automaticamente come se fosse manuale
4. WHEN un utente disabilita lo schedule THEN il sistema SHALL rimuovere il Vercel Cron Job
5. THE sistema SHALL mostrare nel dashboard se lo schedule è abilitato e il prossimo run previsto

### Requirement 7: Configurazione SQL Server

**User Story:** Come amministratore, voglio configurare i parametri di connessione SQL Server, così che tutte le applicazioni usino le stesse credenziali.

#### Acceptance Criteria

1. WHEN un utente accede alle impostazioni THEN il sistema SHALL mostrare un form per configurare SQL Server (host, database, schema, username, password)
2. WHEN un utente salva la configurazione SQL THEN il sistema SHALL salvare i parametri in Convex (password criptata)
3. WHEN il Webhook_Endpoint esegue un sync THEN il sistema SHALL usare la configurazione SQL salvata in Convex
4. THE sistema SHALL validare la connessione SQL prima di salvare la configurazione
5. THE sistema SHALL permettere di testare la connessione SQL dal dashboard

### Requirement 8: Notifiche Email

**User Story:** Come amministratore, voglio ricevere notifiche email quando un sync fallisce, così che possa intervenire rapidamente.

#### Acceptance Criteria

1. WHEN un utente configura le impostazioni email THEN il sistema SHALL permettere di specificare SMTP host, port, username, password e destinatari
2. WHEN un sync fallisce THEN il sistema SHALL inviare una email di notifica ai destinatari configurati
3. WHEN un sync ha successo dopo un fallimento THEN il sistema SHALL inviare una email di recovery
4. THE sistema SHALL includere nell'email: app_name, timestamp, errore, link al dashboard

### Requirement 9: Dashboard UI/UX

**User Story:** Come amministratore, voglio un'interfaccia chiara e intuitiva, così che possa gestire facilmente le configurazioni e i sync.

#### Acceptance Criteria

1. THE sistema SHALL mostrare una sidebar con navigazione (Dashboard, Applications, Settings, Logs)
2. THE sistema SHALL usare card per visualizzare ogni Sync_App con stato, statistiche e azioni
3. THE sistema SHALL usare colori per indicare lo stato (verde=success, rosso=failed, giallo=running, grigio=never run)
4. THE sistema SHALL mostrare indicatori di caricamento durante le operazioni asincrone
5. THE sistema SHALL mostrare messaggi di successo/errore dopo ogni operazione
6. THE sistema SHALL essere responsive e funzionare su desktop e tablet

### Requirement 10: Sicurezza

**User Story:** Come amministratore, voglio che l'applicazione sia sicura, così che solo utenti autorizzati possano accedere e le credenziali siano protette.

#### Acceptance Criteria

1. THE sistema SHALL richiedere autenticazione Auth0 per tutte le pagine tranne login
2. THE sistema SHALL validare il token Auth0 su ogni richiesta API
3. THE sistema SHALL criptare le password SQL Server e SMTP prima di salvarle in Convex
4. THE sistema SHALL usare HTTPS per tutte le comunicazioni
5. THE sistema SHALL validare e sanitizzare tutti gli input utente
6. THE Webhook_Endpoint SHALL richiedere un token segreto per autenticare le richieste
7. THE sistema SHALL loggare tutti gli accessi e le operazioni per audit

## Notes

- Il codice Python esistente (sync.py) rimane invariato sulla VM Windows
- Il dashboard è un nuovo progetto React separato
- Convex viene usato sia per salvare configurazioni che per tracciare stato sync
- La VM Windows deve essere accessibile via HTTP dal web (port forwarding o ngrok)
- Vercel Cron Jobs hanno limitazioni di timeout (60s su Pro plan)
