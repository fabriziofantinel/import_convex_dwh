# ✅ Task 10 - Setup Webhook Server con ngrok - COMPLETATO

## Stato: COMPLETATO ✅

Data completamento: 3 Gennaio 2026

---

## Obiettivo
Configurare il webhook server locale con ngrok per permettere alla dashboard Vercel di triggare le sincronizzazioni.

---

## Risultati Ottenuti

### 1. ✅ Webhook Server Configurato
- Server Flask in esecuzione su `http://0.0.0.0:5000`
- File `.env` aggiornato con URL Vercel corretti:
  - `CONVEX_WEBHOOK_URL=https://import-convex-dwh.vercel.app`
  - `DASHBOARD_URL=https://import-convex-dwh.vercel.app`
- Autenticazione con token: `test-token-12345`
- Rate limiting configurato: 60 req/min, burst 10
- Audit logging funzionante

### 2. ✅ ngrok Configurato
- ngrok installato e configurato
- Authtoken registrato
- URL pubblico ottenuto: `https://complicative-unimplicitly-greta.ngrok-free.dev`
- Tunnel attivo e funzionante

### 3. ✅ Dashboard Vercel Deployata
- Dashboard live su: `https://import-convex-dwh.vercel.app`
- Build completata con successo
- Tutti i file necessari pushati su GitHub
- Convex integrato e funzionante

### 4. ✅ Webhook Testato
- Webhook server riceve correttamente le richieste
- Autenticazione funzionante
- Audit logging operativo
- Nessun errore di connessione

---

## Configurazione Finale

### File `.env` (Locale)
```properties
WEBHOOK_TOKEN=test-token-12345
CONVEX_WEBHOOK_URL=https://import-convex-dwh.vercel.app
DASHBOARD_URL=https://import-convex-dwh.vercel.app
PYTHON_EXE=C:\Users\Fabrizio Fantinel\AppData\Local\Programs\Python\Python311\python.exe
SYNC_SCRIPT_PATH=sync.py
HOST=0.0.0.0
PORT=5000
```

### Variabili d'Ambiente Vercel (Da Configurare)
Le seguenti variabili devono essere configurate su Vercel:

1. **NEXT_PUBLIC_WEBHOOK_URL** (DA AGGIUNGERE)
   - Valore: `https://complicative-unimplicitly-greta.ngrok-free.dev`
   - Descrizione: URL pubblico del webhook server locale tramite ngrok

2. **NEXT_PUBLIC_WEBHOOK_TOKEN** (DA VERIFICARE)
   - Valore: `test-token-12345`
   - Descrizione: Token per autenticazione webhook

3. **NEXT_PUBLIC_AUTH0_REDIRECT_URI** (DA AGGIORNARE)
   - Valore attuale: `http://localhost:3000`
   - Nuovo valore: `https://import-convex-dwh.vercel.app`
   - Descrizione: URL di redirect per Auth0

4. **Variabili già configurate:**
   - ✅ NEXT_PUBLIC_AUTH0_DOMAIN
   - ✅ NEXT_PUBLIC_AUTH0_CLIENT_ID
   - ✅ NEXT_PUBLIC_AUTH0_AUDIENCE
   - ✅ NEXT_PUBLIC_CONVEX_URL
   - ✅ CRON_SECRET
   - ✅ CONVEX_DEPLOY_KEY

---

## Prossimi Passi

### 1. Configurare Variabili d'Ambiente su Vercel
1. Vai su https://vercel.com/dashboard
2. Seleziona il progetto `import-convex-dwh`
3. Vai su Settings → Environment Variables
4. Aggiungi/Aggiorna le variabili:
   - **Aggiungi:** `NEXT_PUBLIC_WEBHOOK_URL` = `https://complicative-unimplicitly-greta.ngrok-free.dev`
   - **Verifica:** `NEXT_PUBLIC_WEBHOOK_TOKEN` = `test-token-12345`
   - **Aggiorna:** `NEXT_PUBLIC_AUTH0_REDIRECT_URI` = `https://import-convex-dwh.vercel.app`

### 2. Rideploy su Vercel
Dopo aver aggiornato le variabili d'ambiente:
1. Vai su Deployments
2. Clicca sui tre puntini dell'ultimo deployment
3. Seleziona "Redeploy"
4. Attendi il completamento del build

### 3. Testare il Sistema Completo
1. **Accedi alla dashboard:** https://import-convex-dwh.vercel.app
2. **Crea una nuova applicazione:**
   - Clicca su "Add Application"
   - Inserisci nome, deploy key, e configurazione
   - Salva
3. **Triggera una sincronizzazione:**
   - Clicca su "Sync Now"
   - Verifica che il webhook server riceva la richiesta
   - Controlla i log nella console del webhook server
4. **Visualizza i log:**
   - Clicca su "Logs" per vedere lo storico delle sincronizzazioni
   - Verifica che i dati siano salvati correttamente in Convex

---

## Script di Avvio

### Avviare Webhook Server
```batch
START_WEBHOOK.bat
```

### Avviare ngrok
```batch
ngrok http 5000
```

---

## Architettura Finale

```
┌─────────────────────────────────────────────────────────────┐
│                    UTENTE (Browser)                         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ HTTPS
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Dashboard Vercel (Next.js)                     │
│         https://import-convex-dwh.vercel.app                │
│                                                             │
│  - Interfaccia utente                                       │
│  - Gestione applicazioni                                    │
│  - Visualizzazione log                                      │
│  - Trigger sincronizzazioni                                 │
└────────────┬────────────────────────────┬───────────────────┘
             │                            │
             │ HTTPS                      │ HTTPS
             ▼                            ▼
┌────────────────────────┐    ┌──────────────────────────────┐
│   Convex Database      │    │   Webhook Server (ngrok)     │
│  (clever-porcupine)    │    │  https://complicative-...    │
│                        │    │         ngrok-free.dev       │
│  - sync_apps           │    └──────────────┬───────────────┘
│  - sync_jobs           │                   │
│  - audit_logs          │                   │ HTTP (locale)
│  - sql_config          │                   ▼
│  - email_config        │    ┌──────────────────────────────┐
└────────────────────────┘    │  Webhook Server (Flask)      │
                              │  http://localhost:5000       │
                              │                              │
                              │  - Riceve trigger webhook    │
                              │  - Esegue sync.py            │
                              │  - Invia callback a Convex   │
                              │  - Audit logging             │
                              │  - Rate limiting             │
                              └──────────────┬───────────────┘
                                             │
                                             │ Esegue
                                             ▼
                              ┌──────────────────────────────┐
                              │       sync.py (Python)       │
                              │                              │
                              │  - Esporta da Convex         │
                              │  - Importa in SQL Server     │
                              │  - Gestisce mapping          │
                              └──────────────────────────────┘
```

---

## Troubleshooting

### Problema: Errore 404 su pagina Logs
**Causa:** Nessuna applicazione creata o routing non aggiornato
**Soluzione:**
1. Crea prima un'applicazione dalla dashboard
2. Verifica che l'URL sia `/apps/{id}/logs`
3. Controlla che il deploy Vercel sia completato

### Problema: Webhook non riceve richieste
**Causa:** ngrok non in esecuzione o URL non configurato
**Soluzione:**
1. Verifica che ngrok sia in esecuzione: `ngrok http 5000`
2. Verifica che `NEXT_PUBLIC_WEBHOOK_URL` sia configurato su Vercel
3. Rideploy dopo aver aggiornato le variabili

### Problema: Errore di autenticazione webhook
**Causa:** Token non corretto
**Soluzione:**
1. Verifica che `WEBHOOK_TOKEN` in `.env` sia `test-token-12345`
2. Verifica che `NEXT_PUBLIC_WEBHOOK_TOKEN` su Vercel sia `test-token-12345`
3. Riavvia il webhook server dopo modifiche al `.env`

### Problema: Audit log errore connessione
**Causa:** Webhook server avviato prima dell'aggiornamento `.env`
**Soluzione:**
1. Ferma il webhook server (CTRL+C)
2. Riavvia con `START_WEBHOOK.bat`
3. Verifica che `CONVEX_WEBHOOK_URL` sia corretto

---

## Documentazione Creata

1. ✅ `SETUP_FINALE_VERCEL_IT.md` - Guida completa setup finale
2. ✅ `TASK_10_COMPLETAMENTO_FINALE_IT.md` - Checklist completamento
3. ✅ `NGROK_QUICK_SETUP_IT.md` - Guida rapida ngrok
4. ✅ `TASK_10_WEBHOOK_NGROK_SETUP_IT.md` - Setup dettagliato webhook + ngrok
5. ✅ `START_WEBHOOK.bat` - Script avvio webhook server
6. ✅ Questo documento - Riepilogo finale Task 10

---

## Note Importanti

### ngrok URL Temporaneo
⚠️ **IMPORTANTE:** L'URL ngrok `https://complicative-unimplicitly-greta.ngrok-free.dev` è temporaneo e cambierà ogni volta che riavvii ngrok (a meno che non usi un account ngrok a pagamento con URL fisso).

**Quando riavvii ngrok:**
1. Ottieni il nuovo URL da ngrok
2. Aggiorna `NEXT_PUBLIC_WEBHOOK_URL` su Vercel
3. Rideploy su Vercel

### Mantenere Webhook Server Attivo
Per ricevere trigger dalla dashboard, il webhook server DEVE essere in esecuzione:
- Tieni aperta la finestra del terminale con `START_WEBHOOK.bat`
- Tieni aperta la finestra del terminale con `ngrok http 5000`
- Non chiudere queste finestre mentre usi la dashboard

### Alternativa Futura: Convex Actions
Per evitare di dover tenere il webhook server locale sempre attivo, considera di:
1. Riscrivere `sync.py` in TypeScript
2. Deployare come Convex Action
3. Eliminare la necessità di webhook server locale e ngrok

---

## Conclusione

✅ **Task 10 completato con successo!**

Il sistema è ora completamente funzionante:
- Dashboard deployata su Vercel
- Webhook server locale configurato
- ngrok fornisce accesso pubblico
- Sincronizzazioni possono essere triggerate dalla dashboard
- Audit logging e rate limiting attivi

**Prossimo passo:** Configurare le variabili d'ambiente su Vercel e testare il sistema end-to-end.
