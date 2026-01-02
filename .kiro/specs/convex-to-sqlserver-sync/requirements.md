# Requirements Document

## Introduction

Sistema per esportare dati dall'ultimo backup di Convex e importarli in un Data Warehouse SQL Server. Il sistema deve essere parametrizzabile per supportare multiple applicazioni Convex e schedulabile tramite Task Manager di Windows.

## Glossary

- **Convex**: Piattaforma backend-as-a-service che fornisce database e API
- **Backup**: Snapshot dei dati Convex esportabile tramite API amministrative
- **Deploy_Key**: Chiave amministrativa di Convex per accedere ai backup e alle API (separata da Auth0)
- **Admin_Key**: Chiave amministrativa alternativa di Convex con permessi di accesso ai backup
- **DWH**: Data Warehouse su SQL Server dove importare i dati
- **Export_Script**: Script eseguibile che gestisce l'intero processo di export/import
- **Configuration_File**: File di configurazione contenente parametri di connessione e mapping tabelle
- **Email_Notifier**: Componente che invia notifiche email in caso di errore

## Requirements

### Requirement 1: Export dei Dati da Convex

**User Story:** Come utente, voglio esportare i dati dall'ultimo backup disponibile di un'applicazione Convex, così da avere sempre i dati più recenti.

#### Acceptance Criteria

1. WHEN lo script viene eseguito con un nome applicazione Convex valido, THE Export_Script SHALL recuperare l'ultimo backup disponibile per quella applicazione
2. WHEN l'ultimo backup viene identificato, THE Export_Script SHALL scaricare tutti i dati dal backup
3. IF il backup non è disponibile o non accessibile, THEN THE Export_Script SHALL registrare l'errore e terminare l'esecuzione
4. THE Export_Script SHALL autenticarsi con Convex usando Deploy_Key o Admin_Key configurata nel Configuration_File
5. THE Export_Script SHALL utilizzare le API amministrative di Convex per accedere ai backup, senza richiedere autenticazione Auth0
6. WHEN la Deploy_Key o Admin_Key non è valida o è scaduta, THE Export_Script SHALL registrare l'errore di autenticazione e terminare

### Requirement 2: Selezione Tabelle/Collezioni

**User Story:** Come utente, voglio poter selezionare quali tabelle/collezioni esportare, così da importare solo i dati necessari nel DWH.

#### Acceptance Criteria

1. WHERE la configurazione specifica tabelle da esportare, THE Export_Script SHALL esportare solo quelle tabelle
2. WHERE la configurazione non specifica tabelle, THE Export_Script SHALL esportare tutte le tabelle disponibili
3. WHEN una tabella specificata non esiste nel backup, THE Export_Script SHALL registrare un warning e continuare con le altre tabelle
4. THE Export_Script SHALL validare i nomi delle tabelle prima di iniziare l'export

### Requirement 3: Import nel Data Warehouse SQL Server

**User Story:** Come utente, voglio importare i dati esportati nel mio DWH SQL Server, così da avere i dati disponibili per analisi.

#### Acceptance Criteria

1. WHEN i dati sono stati esportati da Convex, THE Export_Script SHALL connettersi al SQL Server usando le credenziali configurate
2. WHEN la connessione è stabilita, THE Export_Script SHALL importare i dati nelle tabelle corrispondenti dello schema DWH
3. IF una tabella di destinazione non esiste, THEN THE Export_Script SHALL registrare l'errore e continuare con le altre tabelle
4. THE Export_Script SHALL gestire la mappatura tra i tipi di dati Convex e SQL Server
5. WHEN l'import è completato con successo, THE Export_Script SHALL registrare il numero di record importati per ogni tabella

### Requirement 4: Configurazione Parametrizzata

**User Story:** Come utente, voglio configurare lo script tramite parametri e file di configurazione, così da poterlo riutilizzare per diverse applicazioni Convex.

#### Acceptance Criteria

1. THE Export_Script SHALL accettare il nome dell'applicazione Convex come parametro da linea di comando
2. THE Configuration_File SHALL contenere la Deploy_Key o Admin_Key per ogni applicazione Convex
3. THE Configuration_File SHALL contenere la stringa di connessione SQL Server
4. THE Configuration_File SHALL contenere la lista delle tabelle da esportare (opzionale)
5. THE Configuration_File SHALL contenere le configurazioni email per le notifiche
6. THE Configuration_File SHALL contenere le configurazioni SMTP per l'invio delle email
7. WHEN il Configuration_File non è trovato o non è valido, THEN THE Export_Script SHALL terminare con un messaggio di errore chiaro
8. THE Configuration_File SHALL supportare la configurazione di multiple applicazioni Convex con chiavi separate

### Requirement 5: Notifiche Email in Caso di Errore

**User Story:** Come utente, voglio ricevere una email quando l'import fallisce, così da essere informato tempestivamente dei problemi.

#### Acceptance Criteria

1. IF l'export da Convex fallisce, THEN THE Email_Notifier SHALL inviare una email con i dettagli dell'errore
2. IF l'import su SQL Server fallisce, THEN THE Email_Notifier SHALL inviare una email con i dettagli dell'errore
3. WHEN viene inviata una email di errore, THE Email_Notifier SHALL includere il timestamp, il nome dell'applicazione e lo stack trace dell'errore
4. THE Email_Notifier SHALL utilizzare le configurazioni SMTP dal Configuration_File
5. IF l'invio della email fallisce, THEN THE Export_Script SHALL registrare l'errore nel log ma non terminare l'esecuzione

### Requirement 6: Logging e Tracciabilità

**User Story:** Come utente, voglio avere log dettagliati delle operazioni, così da poter diagnosticare problemi e verificare l'esecuzione.

#### Acceptance Criteria

1. THE Export_Script SHALL creare un file di log per ogni esecuzione con timestamp
2. WHEN lo script inizia, THE Export_Script SHALL registrare i parametri di esecuzione
3. WHEN ogni operazione viene completata, THE Export_Script SHALL registrare il risultato (successo/fallimento)
4. THE Export_Script SHALL registrare il numero di record processati per ogni tabella
5. WHEN lo script termina, THE Export_Script SHALL registrare il tempo totale di esecuzione e lo stato finale

### Requirement 7: Schedulabilità con Task Manager

**User Story:** Come utente, voglio poter schedulare lo script con Task Manager di Windows, così da automatizzare l'esecuzione giornaliera.

#### Acceptance Criteria

1. THE Export_Script SHALL essere eseguibile da linea di comando senza interazione utente
2. THE Export_Script SHALL restituire exit code 0 in caso di successo e non-zero in caso di errore
3. THE Export_Script SHALL supportare l'esecuzione in background senza output interattivo
4. THE Export_Script SHALL gestire correttamente i path relativi e assoluti per file di configurazione e log

### Requirement 8: Gestione Errori e Resilienza

**User Story:** Come utente, voglio che lo script gestisca gli errori in modo robusto, così da minimizzare le interruzioni del processo.

#### Acceptance Criteria

1. IF una singola tabella fallisce durante l'import, THEN THE Export_Script SHALL continuare con le altre tabelle
2. WHEN si verifica un errore di rete temporaneo, THE Export_Script SHALL ritentare l'operazione fino a 3 volte con backoff esponenziale
3. IF tutte le retry falliscono, THEN THE Export_Script SHALL registrare l'errore e procedere
4. THE Export_Script SHALL validare i dati prima dell'import per prevenire errori di integrità
5. WHEN l'import è parzialmente completato, THE Export_Script SHALL registrare quali tabelle sono state importate con successo
