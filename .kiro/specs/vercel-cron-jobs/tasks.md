# Implementation Plan: Vercel Cron Jobs

## Overview

Implementazione di job schedulati automatici per sincronizzazioni Convex → SQL Server utilizzando Vercel Cron Jobs. Il sistema deve permettere configurazione di schedule automatici e triggerare sync senza intervento manuale.

## Tasks

- [ ] 1. Setup configurazione Vercel Cron
  - [ ] 1.1 Creare vercel.json con configurazione cron base
    - Definire struttura cron jobs per applicazioni esistenti
    - Configurare schedule di default per ogni app
    - _Requirements: 1.1, 1.2, 1.3_

  - [ ] 1.2 Configurare environment variables per cron secret
    - Generare CRON_SECRET sicuro (32+ caratteri)
    - Configurare in Vercel dashboard e .env.local
    - _Requirements: 5.1, 5.3_

- [ ] 2. Implementare API endpoint cron
  - [ ] 2.1 Creare API route /api/cron/[app_name]
    - Implementare handler GET/POST per richieste Vercel
    - Struttura base con validazione parametri
    - _Requirements: 2.1_

  - [ ] 2.2 Implementare validazione cron secret
    - Validare Authorization Bearer header
    - Gestire errori di autenticazione (401)
    - Loggare tentativi di accesso non autorizzati
    - _Requirements: 2.1, 2.2, 5.2, 5.4_

  - [ ] 2.3 Implementare query configurazione app
    - Usare getSyncAppByName per ottenere config da Convex
    - Gestire app non esistenti (404)
    - _Requirements: 2.3_

  - [ ] 2.4 Implementare controllo cron_enabled
    - Verificare se cron è abilitato per l'app
    - Ritornare messaggio appropriato se disabilitato
    - _Requirements: 2.4_

  - [ ] 2.5 Implementare trigger sync automatico
    - Chiamare Convex action triggerSync con triggered_by="cron"
    - Gestire response e job_id
    - _Requirements: 2.5, 2.6_

- [ ] 3. Implementare gestione errori
  - [ ] 3.1 Implementare error handling completo
    - Gestire timeout Vercel (60s)
    - Gestire errori di connessione Convex
    - Ritornare status code appropriati
    - _Requirements: 3.1, 3.3, 3.4_

  - [ ] 3.2 Implementare logging dettagliato
    - Loggare tutte le richieste cron ricevute
    - Loggare errori con stack trace
    - Non loggare cron secret nei log
    - _Requirements: 2.7, 3.1, 5.4_

- [ ] 4. Aggiornare UI dashboard per monitoraggio
  - [ ] 4.1 Modificare AppCard per mostrare trigger source
    - Distinguere sync manuali da automatici
    - Mostrare ultimo sync automatico
    - _Requirements: 4.1, 4.2, 4.4_

  - [ ] 4.2 Aggiornare SyncJobList per mostrare triggered_by
    - Aggiungere colonna/badge per trigger source
    - Filtrare per tipo di trigger
    - _Requirements: 4.2, 4.4_

  - [ ] 4.3 Aggiornare statistiche dashboard
    - Mostrare statistiche separate per sync manuali/automatici
    - Contatori per successi/fallimenti per tipo
    - _Requirements: 4.5_

- [ ] 5. Testing e validazione
  - [ ] 5.1 Scrivere unit tests per API endpoint
    - Test validazione cron secret
    - Test gestione app esistenti/non esistenti
    - Test controllo cron_enabled
    - _Requirements: All_

  - [ ] 5.2 Scrivere property-based tests
    - **Property 1: Cron Secret Validation**
    - **Property 2: App Configuration Validation**
    - **Property 3: Cron Enabled Check**
    - **Property 4: Sync Triggering**
    - **Property 5: Error Logging**
    - **Property 6: Response Timeout**

  - [ ] 5.3 Testare integrazione end-to-end
    - Simulare richieste Vercel cron
    - Verificare trigger sync completo
    - Testare con app reali (appclinics, importdes)
    - _Requirements: All_

- [ ] 6. Deployment e configurazione produzione
  - [ ] 6.1 Configurare environment variables Vercel
    - Impostare CRON_SECRET in Vercel dashboard
    - Verificare altre variabili necessarie
    - _Requirements: 5.1, 5.3_

  - [ ] 6.2 Deploy e test vercel.json
    - Deploy su Vercel con nuova configurazione
    - Verificare creazione cron jobs
    - Testare esecuzione automatica
    - _Requirements: 1.1, 1.2_

  - [ ] 6.3 Monitoraggio e logging
    - Configurare monitoring per cron jobs
    - Verificare log Vercel per esecuzioni
    - Setup alerting per fallimenti ripetuti
    - _Requirements: 4.1, 4.2_

- [ ] 7. Checkpoint - Verifica sistema completo
  - Verificare configurazione vercel.json
  - Testare endpoint cron manualmente
  - Verificare trigger automatico da Vercel
  - Controllare log e monitoraggio
  - Testare con entrambe le app (appclinics, importdes)

## Notes

- Vercel Cron Jobs richiedono Pro plan
- Timeout massimo 60 secondi per cron jobs
- Cron secret deve essere configurato sia in Vercel che localmente
- Testing locale può usare curl per simulare richieste Vercel
- Monitorare frequenza esecuzione per evitare rate limiting
- Considerare fuso orario per schedule (UTC su Vercel)

## Example Commands for Testing

```bash
# Test cron endpoint locally
curl -X POST http://localhost:3000/api/cron/appclinics \
  -H "Authorization: Bearer your-cron-secret" \
  -H "Content-Type: application/json"

# Test with invalid secret
curl -X POST http://localhost:3000/api/cron/appclinics \
  -H "Authorization: Bearer invalid-secret" \
  -H "Content-Type: application/json"

# Test non-existing app
curl -X POST http://localhost:3000/api/cron/nonexistent \
  -H "Authorization: Bearer your-cron-secret" \
  -H "Content-Type: application/json"
```