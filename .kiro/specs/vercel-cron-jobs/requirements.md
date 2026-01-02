# Requirements Document: Vercel Cron Jobs

## Introduction

Implementazione di job schedulati automatici per sincronizzazioni Convex → SQL Server utilizzando Vercel Cron Jobs. Il sistema deve permettere agli utenti di configurare schedule automatici per ogni applicazione e triggerare sync senza intervento manuale.

## Glossary

- **Vercel_Cron**: Sistema di schedulazione automatica di Vercel per eseguire API routes a orari prestabiliti
- **Cron_Schedule**: Espressione cron standard (es: "0 2 * * *" per ogni giorno alle 2:00)
- **Cron_Secret**: Token segreto di Vercel per autenticare le richieste cron
- **Sync_App**: Applicazione Convex configurata per la sincronizzazione
- **Triggered_By**: Campo che indica se un sync è stato lanciato manualmente o da cron

## Requirements

### Requirement 1: Configurazione Vercel Cron

**User Story:** Come sviluppatore, voglio configurare Vercel Cron Jobs per ogni applicazione, così che i sync vengano eseguiti automaticamente secondo schedule prestabiliti.

#### Acceptance Criteria

1. WHEN il sistema viene deployato su Vercel THEN il sistema SHALL leggere la configurazione cron da vercel.json
2. WHEN un'applicazione ha cron_enabled=true THEN il sistema SHALL includere un cron job per quella applicazione
3. WHEN un'applicazione ha cron_schedule definito THEN il sistema SHALL usare quello schedule per il cron job
4. WHEN un'applicazione non ha cron_schedule THEN il sistema SHALL usare un default di "0 2 * * *" (2:00 AM ogni giorno)
5. THE sistema SHALL supportare espressioni cron standard con 5 campi (minuto ora giorno mese giorno_settimana)

### Requirement 2: API Endpoint Cron

**User Story:** Come sistema Vercel, voglio chiamare un endpoint API per triggerare sync automatici, così che le sincronizzazioni avvengano secondo schedule.

#### Acceptance Criteria

1. WHEN Vercel Cron chiama /api/cron/[app_name] THEN il sistema SHALL validare il cron secret
2. WHEN il cron secret è invalido THEN il sistema SHALL ritornare 401 Unauthorized
3. WHEN l'applicazione non esiste THEN il sistema SHALL ritornare 404 Not Found
4. WHEN l'applicazione ha cron_enabled=false THEN il sistema SHALL ritornare 200 con messaggio "Cron disabled"
5. WHEN l'applicazione ha cron_enabled=true THEN il sistema SHALL triggerare il sync via Convex action
6. WHEN il sync viene triggerato THEN il sistema SHALL impostare triggered_by="cron"
7. THE sistema SHALL loggare tutte le richieste cron ricevute

### Requirement 3: Gestione Errori Cron

**User Story:** Come amministratore, voglio che gli errori nei cron job vengano gestiti correttamente, così che il sistema rimanga stabile anche in caso di problemi.

#### Acceptance Criteria

1. WHEN un cron job fallisce THEN il sistema SHALL loggare l'errore dettagliato
2. WHEN un sync triggerato da cron fallisce THEN il sistema SHALL salvare l'errore nel sync_job
3. WHEN Vercel Cron timeout (60s) THEN il sistema SHALL ritornare una risposta entro il timeout
4. WHEN ci sono errori di connessione a Convex THEN il sistema SHALL ritornare 500 con dettagli errore
5. THE sistema SHALL non bloccare altri cron job se uno fallisce

### Requirement 4: Monitoraggio Cron Jobs

**User Story:** Come amministratore, voglio monitorare l'esecuzione dei cron job, così che possa verificare che le sincronizzazioni automatiche funzionino correttamente.

#### Acceptance Criteria

1. WHEN un sync viene triggerato da cron THEN il sistema SHALL salvare triggered_by="cron" nel sync_job
2. WHEN visualizzo i log di un'applicazione THEN il sistema SHALL mostrare se il sync è stato triggerato da cron o manualmente
3. WHEN visualizzo la dashboard THEN il sistema SHALL mostrare l'ultimo sync automatico per ogni app
4. THE sistema SHALL distinguere visivamente i sync manuali da quelli automatici
5. THE sistema SHALL mostrare statistiche separate per sync manuali e automatici

### Requirement 5: Sicurezza Cron

**User Story:** Come amministratore di sistema, voglio che i cron job siano sicuri, così che solo Vercel possa triggerare sync automatici.

#### Acceptance Criteria

1. WHEN viene configurato il cron secret THEN il sistema SHALL usare una stringa casuale di almeno 32 caratteri
2. WHEN Vercel chiama l'endpoint cron THEN il sistema SHALL validare l'header Authorization Bearer
3. WHEN il cron secret non è configurato THEN il sistema SHALL rifiutare tutte le richieste cron
4. THE sistema SHALL non loggare il cron secret nei log
5. THE sistema SHALL usare HTTPS per tutte le comunicazioni cron

## Technical Constraints

- Vercel Cron Jobs hanno timeout di 60 secondi su Pro plan
- Vercel Cron supporta solo espressioni cron standard (5 campi)
- Il cron secret deve essere configurato nelle environment variables di Vercel
- L'endpoint cron deve essere accessibile pubblicamente
- Convex actions hanno timeout di 60 secondi

## Dependencies

- Vercel Pro plan per cron jobs
- Convex database per configurazioni applicazioni
- Webhook server accessibile per eseguire sync
- Environment variables configurate correttamente