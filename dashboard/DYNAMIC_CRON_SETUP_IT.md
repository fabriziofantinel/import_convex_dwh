# Configurazione Aggiornamento Dinamico Cron Job

## Panoramica

Questa funzionalità permette di aggiornare automaticamente il cron job di Vercel quando modifichi l'orario di schedulazione nell'app, senza dover fare deployment manuali.

## Come Funziona

1. **Inserisci l'orario in fuso orario di Roma** nella pagina Scheduling
2. **Il sistema converte automaticamente** l'orario da Roma (CET/CEST) a UTC
3. **Aggiorna il file `vercel.json`** nel repository GitHub via API
4. **Vercel rileva il cambiamento** e fa deployment automatico
5. **Il nuovo cron job** diventa attivo dopo il deployment

## Configurazione Richiesta

### 1. GitHub Personal Access Token

Vai su [GitHub Settings → Tokens](https://github.com/settings/tokens) e crea un nuovo token:

1. Clicca **"Generate new token"** → **"Generate new token (classic)"**
2. **Nome:** `Vercel Cron Updates`
3. **Scopes:** Seleziona **"repo"** (Full control of private repositories)
4. **Expiration:** Imposta come preferisci (es: 1 anno)
5. Clicca **"Generate token"**
6. **IMPORTANTE:** Copia subito il token (non lo vedrai più!)

### 2. Repository Information

Il nome del repository nel formato `owner/repo`:
- **Esempio:** `fabriziofantinel/import_convex_dwh`
- **Formato:** `your_username/your_repo_name`

### 3. Configurazione Variabili d'Ambiente

Aggiungi queste variabili d'ambiente su Vercel:

```bash
GITHUB_TOKEN=your_github_token_here
GITHUB_REPO=your_username/your_repo_name
```

**Esempio:**
```bash
GITHUB_TOKEN=ghp_1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r
GITHUB_REPO=fabriziofantinel/import_convex_dwh
```

## Utilizzo

### Aggiornamento Schedulazione

1. Vai alla pagina **Scheduling** nell'app
2. Clicca **"Edit Schedule"** per l'applicazione desiderata
3. **Abilita la schedulazione** (checkbox)
4. **Inserisci l'orario desiderato** in formato cron (orario di Roma)
   - Esempio: `31 23 * * *` per le 23:31 ogni giorno
5. Clicca **"Save"**

### Cosa Succede Automaticamente

1. ✅ **Salvataggio** della schedulazione nel database Convex
2. ✅ **Conversione** dell'orario da Roma a UTC
3. ✅ **Aggiornamento** del file `vercel.json` su GitHub
4. ✅ **Deployment automatico** di Vercel (rileva il cambiamento)
5. ✅ **Attivazione** del nuovo cron job

### Messaggi di Conferma

**Successo Completo:**
```
Schedulazione aggiornata con successo!

Orario Roma: 31 23 * * *
Orario UTC: 31 22 * * *

Il file vercel.json è stato aggiornato su GitHub.
Vercel farà il deployment automaticamente.
```

**Successo Parziale:**
```
Schedulazione aggiornata!

Orario Roma: 31 23 * * *
Orario UTC: 31 22 * * *

ATTENZIONE: Errore nell'aggiornamento automatico.
È necessario aggiornare manualmente il vercel.json.
```

## Conversione Fuso Orario

### Regole di Conversione

- **Ora Solare (CET):** Roma = UTC + 1 → Sottrai 1 ora
- **Ora Legale (CEST):** Roma = UTC + 2 → Sottrai 2 ore

### Esempi

| Orario Roma | Stagione | Orario UTC | Cron UTC |
|-------------|----------|------------|----------|
| 23:31 | Inverno (CET) | 22:31 | `31 22 * * *` |
| 23:31 | Estate (CEST) | 21:31 | `31 21 * * *` |
| 00:15 | Inverno (CET) | 23:15 | `15 23 * * *` |
| 02:00 | Inverno (CET) | 01:00 | `0 1 * * *` |

**Nota:** Il sistema attualmente usa sempre UTC+1 (ora solare). Durante l'ora legale potrebbe esserci 1 ora di differenza.

## Troubleshooting

### Deployment Non Funziona

**Possibili Cause:**
- Token GitHub non configurato o scaduto
- Repository name errato (deve essere `owner/repo`)
- Permessi insufficienti del token (serve scope `repo`)

**Soluzione:**
1. Verifica le variabili d'ambiente su Vercel
2. Rigenera il token GitHub se necessario
3. Controlla che il formato repository sia corretto
4. Fai un deployment manuale come fallback

### Orario Sbagliato

**Problema:** Il cron job si attiva all'orario sbagliato

**Soluzione:**
1. Verifica la conversione del fuso orario
2. Considera se è attiva l'ora legale
3. Controlla il file `vercel.json` dopo il deployment

### Cron Job Non Si Attiva

**Possibili Cause:**
- Deployment non completato
- Errori nel formato cron
- Limitazioni Vercel Free Tier

**Soluzione:**
1. Verifica lo stato del deployment su Vercel
2. Controlla i log del cron job
3. Usa il formato cron corretto (5 campi)

## Limitazioni

### Vercel Free Tier
- ⚠️ **Solo cron job giornalieri** (una volta al giorno)
- ⚠️ **Timeout 10 secondi** per le funzioni
- ⚠️ **Limite deployment** mensili

### Formato Cron
- ✅ Supporta tutti i pattern cron standard
- ⚠️ Conversione automatica solo per orari fissi
- ⚠️ Pattern con wildcard (`*`) non vengono convertiti

## File Coinvolti

- `dashboard/app/api/update-cron-schedule/route.ts` - API per aggiornamento cron via GitHub
- `dashboard/app/scheduling/page.tsx` - Interfaccia utente
- `dashboard/vercel.json` - Configurazione cron Vercel (aggiornato via GitHub)
- `dashboard/.env.vercel.example` - Esempio variabili d'ambiente

## Sicurezza

- 🔒 Token GitHub mantenuto come variabile d'ambiente
- 🔒 Validazione input cron schedule
- 🔒 Gestione errori per aggiornamenti falliti
- 🔒 Log dettagliati per debugging
- 🔒 Accesso limitato al solo file vercel.json

---

**Nota:** Questa funzionalità richiede un GitHub Personal Access Token con scope `repo`. Se non configurata, l'aggiornamento della schedulazione funzionerà comunque nell'app, ma sarà necessario un aggiornamento manuale del file `vercel.json` e deployment.