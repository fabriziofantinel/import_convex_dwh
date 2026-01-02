# Implementation Plan: Sync Web Dashboard

## Overview

Implementazione di un web dashboard React su Vercel con Convex backend e Auth0 authentication per gestire configurazioni e lanciare sync Convex → SQL Server. Il sistema riutilizza il codice Python esistente tramite un webhook server Flask sulla VM Windows.

## Tasks

- [x] 1. Setup progetto e configurazione base
  - Creare progetto Next.js con TypeScript
  - Configurare Convex
  - Configurare Auth0
  - Setup environment variables
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 2. Implementare Convex schema e functions
  - [x] 2.1 Definire schema database (sync_apps, sync_jobs, sql_config, email_config)
    - Creare convex/schema.ts con tutte le tabelle
    - _Requirements: 2.1, 4.1, 7.1, 8.1_

  - [x] 2.2 Implementare Convex queries
    - listSyncApps, getSyncApp, getSyncJobs, getSqlConfig, getEmailConfig
    - _Requirements: 2.1, 4.1, 4.2_

  - [x] 2.3 Implementare Convex mutations
    - createSyncApp, updateSyncApp, deleteSyncApp
    - createSyncJob, updateSyncJob
    - updateSqlConfig, updateEmailConfig
    - _Requirements: 2.3, 2.4, 2.5, 2.6, 7.2, 8.2_

  - [x] 2.4 Implementare Convex action per trigger sync
    - triggerSync action che chiama webhook VM Windows
    - _Requirements: 3.1, 3.2_

- [x] 3. Implementare autenticazione Auth0
  - [x] 3.1 Configurare Auth0Provider nel frontend
    - Setup Auth0 context e provider
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 3.2 Implementare protected routes
    - HOC per proteggere pagine che richiedono auth
    - Redirect a login se non autenticato
    - _Requirements: 1.1, 10.1_

  - [x] 3.3 Implementare logout
    - Pulsante logout nella navbar
    - Clear session e redirect
    - _Requirements: 1.4_

- [x] 4. Implementare UI Dashboard
  - [x] 4.1 Creare layout base con navbar e sidebar
    - Navbar con logo, user info, logout
    - Sidebar con navigazione (Dashboard, Applications, Settings, Logs)
    - _Requirements: 9.1_

  - [x] 4.2 Implementare pagina Dashboard (/)
    - Lista sync apps con AppCard component
    - Mostra stato, statistiche, azioni per ogni app
    - _Requirements: 2.1, 4.1, 4.2, 9.2, 9.3_

  - [x] 4.3 Implementare componente AppCard
    - Card con nome app, stato (badge colorato), statistiche
    - Pulsanti: Sync Now, Edit, Delete, View Logs
    - _Requirements: 2.1, 4.1, 4.2, 9.2, 9.3_

  - [x] 4.4 Implementare StatusBadge component
    - Badge colorato per stato sync (verde/rosso/giallo/grigio)
    - _Requirements: 9.3_

- [x] 5. Implementare gestione applicazioni
  - [x] 5.1 Creare pagina /apps/new
    - Form per creare nuova sync app
    - Campi: name, deploy_key, tables, table_mapping, cron_schedule, cron_enabled
    - _Requirements: 2.2, 2.3_

  - [x] 5.2 Creare pagina /apps/[id]/edit
    - Form precompilato per modificare sync app
    - _Requirements: 2.4, 2.5_

  - [x] 5.3 Implementare AppForm component
    - Form riutilizzabile per create/edit
    - Validazione input (deploy_key format, table names, cron expression)
    - _Requirements: 2.3, 2.4, 2.7, 2.8, 6.1_

  - [x] 5.4 Implementare delete confirmation
    - Modal di conferma prima di eliminare app
    - _Requirements: 2.6_

- [x] 6. Implementare lancio manuale sync
  - [x] 6.1 Implementare pulsante "Sync Now"
    - Chiama Convex action triggerSync
    - Mostra loading indicator
    - _Requirements: 3.1, 9.4_

  - [x] 6.2 Implementare polling stato sync
    - Poll Convex ogni 2 secondi per aggiornare stato job
    - Aggiorna UI quando stato cambia
    - _Requirements: 3.3, 3.4, 3.5_

  - [x] 6.3 Implementare prevenzione sync concorrenti
    - Disabilita pulsante se sync già running
    - Mostra messaggio se tentativo di sync concorrente
    - _Requirements: 3.6_

- [x] 7. Implementare visualizzazione log
  - [x] 7.1 Creare pagina /apps/[id]/logs
    - Lista ultimi 10 sync jobs con dettagli
    - _Requirements: 4.3_

  - [x] 7.2 Implementare SyncJobList component
    - Lista job con stato, timestamp, statistiche
    - Click su job per vedere log completo
    - _Requirements: 4.3, 4.4_

  - [x] 7.3 Implementare LogViewer component
    - Modal o pagina per visualizzare log completo
    - Formattazione log con syntax highlighting
    - _Requirements: 4.4_

- [x] 8. Implementare configurazioni globali
  - [x] 8.1 Creare pagina /settings
    - Tab per SQL Config e Email Config
    - _Requirements: 7.1, 8.1_

  - [x] 8.2 Implementare form SQL Config
    - Campi: host, database, schema, username, password
    - Pulsante "Test Connection"
    - Encrypt password prima di salvare
    - _Requirements: 7.1, 7.2, 7.4, 7.5, 10.3_

  - [x] 8.3 Implementare form Email Config
    - Campi: smtp_host, smtp_port, smtp_user, smtp_password, from_email, to_emails, use_tls
    - Encrypt password prima di salvare
    - _Requirements: 8.1, 8.2, 10.3_

  - [x] 8.4 Implementare encryption utility
    - Funzione per encrypt/decrypt passwords usando AES-256
    - _Requirements: 10.3_

- [x] 9. Implementare Flask webhook server
  - [x] 9.1 Creare webhook_server.py
    - Flask app con endpoint POST /api/sync/:app_name
    - _Requirements: 5.1_

  - [x] 9.2 Implementare autenticazione webhook
    - Validare Bearer token su ogni richiesta
    - _Requirements: 5.2, 10.6_

  - [x] 9.3 Implementare esecuzione sync.py
    - Creare config temporaneo
    - Eseguire sync.py in background thread
    - Parse output per estrarre statistiche
    - _Requirements: 5.3_

  - [x] 9.4 Implementare callback a Convex
    - Inviare risultato sync a Convex HTTP action
    - Aggiornare sync_job con stato e log
    - _Requirements: 5.4, 5.5_

  - [x] 9.5 Implementare prevenzione sync concorrenti
    - Tracciare sync in esecuzione
    - Rifiutare richieste se sync già running
    - _Requirements: 5.6_

  - [x] 9.6 Implementare health check endpoint
    - GET /health per monitorare stato server
    - _Requirements: 5.7_

- [x] 10. Implementare Vercel Cron Jobs
  - [x] 10.1 Creare vercel.json con cron configuration
    - Definire cron jobs per ogni app
    - _Requirements: 6.2_

  - [x] 10.2 Implementare API route /api/cron/[app_name]
    - Validare Vercel cron secret
    - Verificare se cron abilitato per app
    - Triggerare sync via Convex action
    - _Requirements: 6.1, 6.3, 6.4_

- [x] 11. Implementare notifiche email
  - [x] 11.1 Creare email template per sync failed
    - HTML template con dettagli errore
    - _Requirements: 8.2, 8.4_

  - [x] 11.2 Creare email template per sync recovery
    - HTML template per notifica successo dopo fallimento
    - _Requirements: 8.3_

  - [x] 11.3 Implementare invio email nel webhook server
    - Inviare email quando sync fallisce
    - Inviare email quando sync ha successo dopo fallimento
    - _Requirements: 8.2, 8.3_

- [x] 12. Implementare UI/UX enhancements
  - [x] 12.1 Aggiungere loading indicators
    - Spinner durante operazioni asincrone
    - _Requirements: 9.4_

  - [x] 12.2 Aggiungere toast notifications
    - Successo/errore dopo operazioni
    - _Requirements: 9.5_

  - [x] 12.3 Implementare responsive design
    - Layout responsive per desktop e tablet
    - _Requirements: 9.6_

  - [x] 12.4 Aggiungere empty states
    - Messaggi quando non ci sono app configurate
    - Messaggi quando non ci sono log
    - _Requirements: 9.2_

- [x] 13. Implementare sicurezza
  - [x] 13.1 Implementare validazione input
    - Sanitize tutti gli input utente
    - Validare formati (deploy_key, cron, email)
    - _Requirements: 10.5_

  - [x] 13.2 Implementare rate limiting webhook
    - Limitare richieste per IP
    - _Requirements: 10.6_

  - [x] 13.3 Implementare audit logging
    - Loggare tutte le operazioni CRUD
    - Loggare tutti i sync eseguiti
    - _Requirements: 10.7_

- [ ] 14. Testing e deployment
  - [x] 14.1 Scrivere unit tests per componenti React
    - Test rendering componenti
    - Test form validation
    - _Requirements: All_

  - [x] 14.2 Scrivere integration tests
    - Test end-to-end sync flow
    - Test cron triggering
    - _Requirements: All_

  - [x] 14.3 Setup deployment Vercel
    - Configurare environment variables
    - Deploy su Vercel
    - _Requirements: All_

  - [ ] 14.4 Setup deployment Convex
    - Deploy Convex functions
    - _Requirements: All_

  - [ ] 14.5 Setup webhook server come Windows Service
    - Configurare webhook server per auto-start
    - _Requirements: 5.1_

- [ ] 15. Checkpoint - Verifica sistema completo
  - Testare login Auth0
  - Creare app di test
  - Lanciare sync manuale
  - Verificare log
  - Testare cron job
  - Verificare email notifications

## Notes

- Tasks marcati con `*` sono opzionali per MVP veloce
- Il codice Python sync.py rimane invariato
- Il webhook server deve essere accessibile pubblicamente (port forwarding o ngrok)
- Convex free tier ha limiti di storage (1GB)
- Vercel Cron ha limiti di timeout (60s su Pro)
