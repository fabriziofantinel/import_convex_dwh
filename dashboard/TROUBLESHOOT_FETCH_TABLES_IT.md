# Risoluzione Problemi Fetch Tables

## Problema
Il pulsante "Fetch Tables" non riesce a leggere le tabelle da Convex quando si crea una nuova app.

## Diagnosi Passo-Passo

### 1. Verifica Deploy Key
Il deploy key deve essere nel formato corretto:

**Formati Validi:**
- `dev:project|token` (per sviluppo)
- `preview:team:project|token` (per preview)
- `production:team:project|token` (per produzione)

**Come ottenere il Deploy Key:**
1. Vai su [Convex Dashboard](https://dashboard.convex.dev)
2. Seleziona il tuo progetto
3. Vai su **Settings** → **Deploy Keys**
4. Copia il deploy key completo

### 2. Verifica Webhook Server
Il webhook server deve essere in esecuzione:

```bash
# Controlla se il server è attivo
curl http://localhost:5000/health
```

Se non risponde, avvia il server:
```bash
# Dalla directory principale del progetto
START_WEBHOOK.bat
```

### 3. Verifica ngrok
Se stai usando ngrok, deve essere attivo:

```bash
# Controlla se ngrok è attivo
curl https://your-ngrok-url.ngrok-free.dev/health
```

### 4. Test Manuale Fetch Tables

Puoi testare manualmente il fetch delle tabelle:

```bash
# Test diretto al webhook server locale
curl -X POST http://localhost:5000/api/fetch-tables \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token-12345" \
  -d '{"deploy_key": "dev:your-project|your-token"}'
```

```bash
# Test tramite ngrok (se configurato)
curl -X POST https://your-ngrok-url.ngrok-free.dev/api/fetch-tables \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token-12345" \
  -d '{"deploy_key": "dev:your-project|your-token"}'
```

## Soluzioni Comuni

### Soluzione 1: Verifica Convex CLI
Il webhook server usa `npx convex export` per ottenere le tabelle.

**Test Convex CLI:**
```bash
# Dalla directory del progetto
npx convex --version
```

Se non funziona, installa Node.js e npm:
1. Scarica Node.js da [nodejs.org](https://nodejs.org)
2. Installa la versione LTS
3. Riavvia il webhook server

### Soluzione 2: Controlla Path Node.js
Il webhook server usa un path hardcoded per npx. Verifica che sia corretto:

**Nel file `webhook_server.py`, linea ~400:**
```python
cmd = [
    r'C:\Program Files\nodejs\npx.cmd',  # ← Questo path deve essere corretto
    'convex',
    'export',
    '--path', snapshot_path
]
```

**Trova il path corretto:**
```bash
where npx
# oppure
which npx
```

### Soluzione 3: Timeout della Richiesta
Se il processo è lento, aumenta il timeout:

**Nel file `webhook_server.py`, linea ~420:**
```python
result = subprocess.run(
    cmd,
    capture_output=True,
    text=True,
    encoding='utf-8',
    errors='replace',
    timeout=60,  # ← Aumenta questo valore se necessario
    env=env,
    cwd=os.path.dirname(os.path.abspath(__file__))
)
```

### Soluzione 4: Verifica Variabili d'Ambiente
Controlla che le variabili d'ambiente siano configurate correttamente:

**Nel file `.env`:**
```
WEBHOOK_TOKEN=test-token-12345
NEXT_PUBLIC_WEBHOOK_URL=https://your-ngrok-url.ngrok-free.dev
NEXT_PUBLIC_WEBHOOK_TOKEN=test-token-12345
```

## Debug Avanzato

### 1. Controlla Log del Webhook Server
Quando premi "Fetch Tables", controlla i log del webhook server nella console.

### 2. Controlla Network Tab del Browser
1. Apri Developer Tools (F12)
2. Vai su **Network**
3. Premi "Fetch Tables"
4. Controlla la richiesta HTTP e la risposta

### 3. Test con Deploy Key Diverso
Prova con un deploy key di un altro progetto Convex per vedere se il problema è specifico del progetto.

## Errori Comuni e Soluzioni

### Errore: "Unauthorized"
- **Causa**: Token webhook non valido
- **Soluzione**: Verifica `WEBHOOK_TOKEN` in `.env` e `NEXT_PUBLIC_WEBHOOK_TOKEN` su Vercel

### Errore: "Request timeout"
- **Causa**: Il processo Convex export è troppo lento
- **Soluzione**: Aumenta il timeout o verifica la connessione internet

### Errore: "Failed to fetch tables from Convex"
- **Causa**: Deploy key non valido o progetto Convex non accessibile
- **Soluzione**: Verifica il deploy key e i permessi del progetto

### Errore: "Connection Failed"
- **Causa**: Webhook server non raggiungibile
- **Soluzione**: Verifica che il server sia attivo e ngrok configurato

## Contatto per Supporto
Se il problema persiste, fornisci:
1. Il deploy key utilizzato (senza il token)
2. I log del webhook server
3. La risposta della richiesta HTTP dal Network tab
4. Il sistema operativo utilizzato