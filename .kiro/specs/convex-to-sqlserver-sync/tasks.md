# Implementation Plan: Convex to SQL Server Sync

## Overview

Implementazione di uno script Python eseguibile da linea di comando per automatizzare l'export di dati dall'ultimo backup di Convex e l'import in SQL Server. Lo script sarà parametrizzabile, riutilizzabile per multiple applicazioni Convex, e schedulabile tramite Task Manager di Windows.

L'implementazione seguirà un approccio incrementale, costruendo prima i componenti core (configurazione, logging), poi i client (Convex, SQL), e infine l'orchestrazione e le notifiche.

## Tasks

- [x] 1. Setup progetto e struttura base
  - Creare struttura directory del progetto
  - Configurare ambiente virtuale Python
  - Creare requirements.txt con dipendenze (requests, pyodbc/pymssql, hypothesis, pytest)
  - Creare file README.md con istruzioni di setup
  - _Requirements: 7.1, 7.4_

- [x] 2. Implementare Configuration Manager
  - [x] 2.1 Creare data models per configurazione
    - Definire dataclasses per ConvexConfig, SQLConfig, EmailConfig, Config
    - Implementare validazione base dei campi obbligatori
    - _Requirements: 4.2, 4.3, 4.5, 4.6_
  
  - [ ]* 2.2 Write property test per Configuration Manager
    - **Property 11: Configuration File Completeness**
    - **Validates: Requirements 4.2, 4.3, 4.5, 4.6**
  
  - [x] 2.3 Implementare caricamento e parsing JSON
    - Implementare metodo load_config() per leggere file JSON
    - Implementare metodi get_convex_config(), get_sql_config(), get_email_config()
    - Gestire errori di file mancante o JSON malformato
    - _Requirements: 4.7_
  
  - [ ]* 2.4 Write property test per gestione configurazioni invalide
    - **Property 12: Invalid Configuration Handling**
    - **Validates: Requirements 4.7**
  
  - [x] 2.5 Implementare supporto multi-app
    - Supportare dizionario di multiple applicazioni Convex
    - Validare che app_name richiesta esista nella configurazione
    - _Requirements: 4.8_
  
  - [ ]* 2.6 Write property test per multi-app support
    - **Property 13: Multi-App Configuration Support**
    - **Validates: Requirements 4.8**
  
  - [ ]* 2.7 Write unit tests per Configuration Manager
    - Test parsing configurazione valida
    - Test errori per campi mancanti specifici
    - Test validazione tipi di dati
    - _Requirements: 4.2, 4.3, 4.5, 4.6, 4.7_

- [x] 3. Implementare Logger
  - [x] 3.1 Creare classe SyncLogger
    - Implementare inizializzazione con directory e app_name
    - Implementare creazione file di log con timestamp nel nome
    - Implementare metodi info(), warning(), error()
    - _Requirements: 6.1_
  
  - [ ]* 3.2 Write property test per log file creation
    - **Property 16: Log File Creation**
    - **Validates: Requirements 6.1**
  
  - [x] 3.3 Implementare logging strutturato
    - Implementare log_execution_start() con parametri
    - Implementare log_execution_end() con statistiche
    - Formattare log con timestamp, livello, messaggio
    - _Requirements: 6.2, 6.3, 6.5_
  
  - [ ]* 3.4 Write property test per comprehensive logging
    - **Property 17: Comprehensive Logging**
    - **Validates: Requirements 6.2, 6.3, 6.4, 6.5**
  
  - [ ]* 3.5 Write unit tests per Logger
    - Test formato log entries
    - Test creazione directory log se non esiste
    - Test rotazione log files
    - _Requirements: 6.1, 6.2, 6.3, 6.5_

- [ ] 4. Checkpoint - Validare componenti base
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implementare Convex Client
  - [x] 5.1 Creare classe ConvexClient
    - Implementare inizializzazione con deploy_key
    - Implementare metodo authenticate() per validare chiave
    - Definire data models per Backup e BackupData
    - _Requirements: 1.4_
  
  - [ ]* 5.2 Write property test per authentication error handling
    - **Property 3: Authentication Error Handling**
    - **Validates: Requirements 1.3, 1.6**
  
  - [x] 5.3 Implementare recupero backup
    - Implementare list_backups() per ottenere lista backup
    - Implementare get_latest_backup() per identificare ultimo backup
    - Ordinare backup per timestamp decrescente
    - _Requirements: 1.1_
  
  - [ ]* 5.4 Write property test per latest backup retrieval
    - **Property 1: Latest Backup Retrieval**
    - **Validates: Requirements 1.1**
  
  - [x] 5.5 Implementare download backup
    - Implementare download_backup() per scaricare dati
    - Gestire errori di backup non disponibile
    - _Requirements: 1.2, 1.3_
  
  - [ ]* 5.6 Write property test per backup download completeness
    - **Property 2: Backup Download Completeness**
    - **Validates: Requirements 1.2**
  
  - [x] 5.7 Implementare retry logic per operazioni di rete
    - Implementare funzione retry_with_backoff()
    - Applicare retry a list_backups() e download_backup()
    - Configurare 3 tentativi con backoff esponenziale
    - _Requirements: 8.2_
  
  - [ ]* 5.8 Write property test per retry with exponential backoff
    - **Property 20: Retry with Exponential Backoff**
    - **Validates: Requirements 8.2**
  
  - [ ]* 5.9 Write unit tests per Convex Client
    - Test con mock delle API Convex
    - Test gestione errori HTTP
    - Test parsing response JSON
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 6. Implementare Data Exporter
  - [x] 6.1 Creare classe DataExporter
    - Definire data model per TableData
    - Implementare export_tables() con filtro opzionale
    - Implementare validate_tables() per verificare esistenza
    - _Requirements: 2.1, 2.2, 2.4_
  
  - [ ]* 6.2 Write property test per table filtering
    - **Property 4: Table Filtering**
    - **Validates: Requirements 2.1**
  
  - [x] 6.3 Implementare gestione tabelle mancanti
    - Registrare warning per tabelle non trovate
    - Continuare export con tabelle esistenti
    - _Requirements: 2.3_
  
  - [ ]* 6.4 Write property test per missing table resilience
    - **Property 5: Missing Table Resilience**
    - **Validates: Requirements 2.3**
  
  - [ ]* 6.5 Write property test per table name validation
    - **Property 6: Table Name Validation**
    - **Validates: Requirements 2.4**
  
  - [ ]* 6.6 Write unit tests per Data Exporter
    - Test export con lista tabelle specifica
    - Test export di tutte le tabelle (None)
    - Test validazione nomi tabelle
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 7. Implementare Type Mapper
  - [x] 7.1 Creare classe TypeMapper
    - Implementare map_convex_to_sql() con mappatura tipi
    - Implementare convert_value() per conversione valori
    - Gestire tipi complessi (array, object) come JSON
    - _Requirements: 3.4_
  
  - [ ]* 7.2 Write property test per type mapping consistency
    - **Property 10: Type Mapping Consistency**
    - **Validates: Requirements 3.4**
  
  - [x]* 7.3 Write unit tests per Type Mapper
    - Test mappatura ogni tipo Convex
    - Test conversione valori specifici
    - Test gestione valori null
    - Test serializzazione JSON per array/object
    - _Requirements: 3.4_

- [ ] 8. Checkpoint - Validare componenti di export
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Implementare SQL Importer
  - [x] 9.1 Creare classe SQLImporter
    - Implementare inizializzazione con connection_string e schema
    - Implementare connect() per stabilire connessione
    - Implementare table_exists() per verificare tabelle
    - Definire data model per ImportResult
    - _Requirements: 3.1_
  
  - [ ]* 9.2 Write property test per SQL connection after export
    - **Property 7: SQL Connection After Export**
    - **Validates: Requirements 3.1**
  
  - [x] 9.3 Implementare import tabella
    - Implementare import_table() con mappatura tipi
    - Implementare bulk_insert() per insert ottimizzato
    - Registrare numero di record importati
    - _Requirements: 3.2, 3.5_
  
  - [ ]* 9.4 Write property test per data import completeness
    - **Property 8: Data Import Completeness**
    - **Validates: Requirements 3.2, 3.5**
  
  - [ ] 9.5 Implementare gestione tabelle SQL mancanti
    - Verificare esistenza tabella prima di import
    - Registrare errore e continuare con altre tabelle
    - _Requirements: 3.3, 8.1_
  
  - [ ]* 9.6 Write property test per missing SQL table resilience
    - **Property 9: Missing SQL Table Resilience**
    - **Validates: Requirements 3.3, 8.1**
  
  - [ ] 9.7 Implementare validazione dati pre-import
    - Validare compatibilità valori con tipi SQL
    - Rigettare record non validi con logging
    - _Requirements: 8.4_
  
  - [ ]* 9.8 Write property test per data validation before import
    - **Property 21: Data Validation Before Import**
    - **Validates: Requirements 8.4**
  
  - [ ] 9.9 Implementare retry logic per operazioni SQL
    - Applicare retry_with_backoff() a connect() e bulk_insert()
    - Gestire errori temporanei di connessione
    - _Requirements: 8.2_
  
  - [ ]* 9.10 Write unit tests per SQL Importer
    - Test con database SQL Server locale o mock
    - Test bulk insert con dati di test
    - Test gestione errori SQL
    - _Requirements: 3.1, 3.2, 3.3, 3.5_

- [ ] 10. Implementare Email Notifier
  - [x] 10.1 Creare classe EmailNotifier
    - Implementare inizializzazione con EmailConfig
    - Implementare send_error_notification() con template
    - Formattare email con tutti i campi richiesti
    - _Requirements: 5.3, 5.4_
  
  - [ ]* 10.2 Write property test per error email notification
    - **Property 14: Error Email Notification**
    - **Validates: Requirements 5.1, 5.2, 5.3**
  
  - [x] 10.3 Implementare gestione fallimento invio email
    - Catturare eccezioni SMTP
    - Registrare errore nel log senza terminare
    - _Requirements: 5.5_
  
  - [ ]* 10.4 Write property test per email failure resilience
    - **Property 15: Email Failure Resilience**
    - **Validates: Requirements 5.5**
  
  - [ ]* 10.5 Write unit tests per Email Notifier
    - Test con mock SMTP server
    - Test formattazione email
    - Test gestione errori SMTP
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 11. Implementare CLI Entry Point
  - [x] 11.1 Creare script principale sync.py
    - Implementare parsing argomenti con argparse
    - Accettare app_name come argomento obbligatorio
    - Accettare config_path come argomento opzionale
    - _Requirements: 4.1, 7.1_
  
  - [ ]* 11.2 Write property test per CLI argument handling
    - **Property 18: Exit Code Correctness** (parte CLI)
    - **Validates: Requirements 7.2**
  
  - [x] 11.3 Implementare orchestrazione principale
    - Implementare funzione main() che coordina tutti i componenti
    - Caricare configurazione
    - Inizializzare logger
    - Eseguire flusso: authenticate → export → import
    - _Requirements: 1.1, 1.2, 3.1, 3.2_
  
  - [x] 11.4 Implementare gestione exit codes
    - Restituire 0 per successo completo
    - Restituire codici specifici per tipi di errore (1-5)
    - _Requirements: 7.2_
  
  - [ ]* 11.5 Write property test per exit code correctness
    - **Property 18: Exit Code Correctness**
    - **Validates: Requirements 7.2**
  
  - [ ] 11.6 Implementare gestione path relativi e assoluti
    - Risolvere path per config file e log directory
    - Supportare sia path relativi che assoluti
    - _Requirements: 7.4_
  
  - [ ]* 11.7 Write property test per path handling
    - **Property 19: Path Handling**
    - **Validates: Requirements 7.4**
  
  - [ ]* 11.8 Write unit tests per CLI Entry Point
    - Test parsing argomenti validi e invalidi
    - Test risoluzione path
    - Test exit codes per diversi scenari
    - _Requirements: 4.1, 7.1, 7.2, 7.4_

- [ ] 12. Implementare logging completo e statistiche
  - [ ] 12.1 Integrare logging in tutti i componenti
    - Aggiungere logging in ConvexClient per operazioni API
    - Aggiungere logging in SQLImporter per operazioni import
    - Registrare numero di record per ogni tabella
    - _Requirements: 6.3, 6.4_
  
  - [ ] 12.2 Implementare logging di import parziale
    - Tracciare quali tabelle hanno successo e quali falliscono
    - Generare summary finale con lista tabelle per stato
    - _Requirements: 8.5_
  
  - [ ]* 12.3 Write property test per partial import logging
    - **Property 22: Partial Import Logging**
    - **Validates: Requirements 8.5**

- [ ] 13. Implementare gestione errori end-to-end
  - [ ] 13.1 Integrare Email Notifier nel flusso principale
    - Catturare errori critici in main()
    - Inviare email per errori di export e import
    - Continuare esecuzione dopo fallimento email
    - _Requirements: 5.1, 5.2_
  
  - [ ] 13.2 Implementare resilienza per tabelle singole
    - Wrappare import di ogni tabella in try-catch
    - Continuare con altre tabelle se una fallisce
    - _Requirements: 8.1_
  
  - [ ] 13.3 Implementare gestione retry failures
    - Registrare errore dopo tutti i retry falliti
    - Procedere con operazioni successive
    - _Requirements: 8.3_
  
  - [ ]* 13.4 Write unit tests per error handling end-to-end
    - Test gestione errori in diversi punti del flusso
    - Test invio email su errori critici
    - Test continuazione dopo errori non critici
    - _Requirements: 5.1, 5.2, 8.1, 8.3_

- [ ] 14. Checkpoint - Validare integrazione completa
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 15. Creare file di configurazione di esempio
  - [ ] 15.1 Creare config.example.json
    - Includere esempio con 2 applicazioni Convex
    - Includere commenti (in README) per ogni campo
    - Includere valori placeholder per credenziali
    - _Requirements: 4.2, 4.3, 4.5, 4.6_
  
  - [ ] 15.2 Aggiornare README con istruzioni
    - Documentare formato file di configurazione
    - Documentare come ottenere Deploy Key da Convex
    - Documentare parametri da linea di comando
    - Documentare exit codes
    - _Requirements: 4.1, 7.1, 7.2_

- [ ] 16. Creare script di setup per Windows
  - [ ] 16.1 Creare setup.bat
    - Script per creare ambiente virtuale
    - Script per installare dipendenze
    - Script per verificare installazione
    - _Requirements: 7.1_
  
  - [ ] 16.2 Creare esempio di Task Scheduler
    - Documentare come creare task in Task Manager
    - Fornire esempio di comando per schedulazione
    - Documentare configurazione per esecuzione in background
    - _Requirements: 7.1, 7.3_

- [ ]* 17. Integration tests end-to-end
  - [ ]* 17.1 Write integration test con mock completo
    - Test flusso completo: config → export → import → log
    - Mock Convex API e SQL Server
    - Verificare creazione log file
    - _Requirements: 1.1, 1.2, 3.1, 3.2, 6.1_
  
  - [ ]* 17.2 Write integration test per scenari di errore
    - Test con backup non disponibile
    - Test con tabelle SQL mancanti
    - Test con errori di rete temporanei
    - Verificare invio email e logging
    - _Requirements: 1.3, 3.3, 5.1, 8.2_

- [ ] 18. Final checkpoint - Validazione completa
  - Ensure all tests pass, ask the user if questions arise.
  - Verificare che lo script sia eseguibile da linea di comando
  - Verificare che tutti i requisiti siano implementati
  - Verificare che la documentazione sia completa

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties (22 properties totali)
- Unit tests validate specific examples and edge cases
- Integration tests validate end-to-end flows
- Lo script sarà implementato in Python per compatibilità con Windows e facilità di schedulazione
- Hypothesis sarà usato per property-based testing
- pytest sarà usato per unit testing
