# Configurazione Aggiornamento Dinamico Cron Job

## Panoramica

Questa funzionalità permette di aggiornare automaticamente il cron job di Vercel quando modifichi l'orario di schedulazione nell'app, senza dover fare deployment manuali.

## Come Funziona

1. **Inserisci l'orario in fuso orario di Roma** nella pagina Scheduling
2. **Il sistema converte automaticamente** l'orario da Roma (CET/CEST) a UTC
3. **Aggiorna il file `vercel.json`** con il nuovo cron schedule
4. **Triggera automaticamente** un nuovo deployment di Vercel
5. **Il nuovo cron job** diventa attivo dopo il deployment

## Configurazione Richiesta

### 1. Token API Vercel

Vai su [Vercel Account Tokens](https://vercel.com/account/tokens) e crea un nuovo token:

1. Clicca "Create Token"
2. Nome: `Dynamic Cron Updates`
3. Scope: `Full Account`
4. Expiration: `No Expiration` (o come preferisci)
5. Copia il token generato

### 2. Project ID Vercel

1. Vai al tuo progetto su Vercel
2. Vai in Settings → General
3. Copia il "Project ID"

### 3. Configurazione Variabili d'Ambiente

Aggiungi queste variabili d'ambiente su Vercel:

```bash
VERCEL_TOKEN=your_vercel_token_here
VERCEL_PROJECT_ID=your_project_id_here
```

**Opzionale (per deployment GitHub):**
```bash
GITHUB_REPO_ID=your_github_repo_id_here
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
3. ✅ **Aggiornamento** del file `vercel.json`
4. ✅ **Trigger** del deployment Vercel
5. ✅ **Attivazione** del nuovo cron job

### Messaggi di Conferma

**Successo Completo:**
```
Schedulazione aggiornata con successo!

Orario Roma: 31 23 * * *
Orario UTC: 31 22 * * *

Il deployment di Vercel è stato avviato automaticamente.
```

**Successo Parziale:**
```
Schedulazione aggiornata!

Orario Roma: 31 23 * * *
Orario UTC: 31 22 * * *

ATTENZIONE: È necessario fare un deployment manuale su Vercel per applicare le modifiche.
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

### Deployment Non Triggera

**Possibili Cause:**
- Token Vercel non configurato o scaduto
- Project ID errato
- Permessi insufficienti del token

**Soluzione:**
1. Verifica le variabili d'ambiente su Vercel
2. Rigenera il token API se necessario
3. Fai un deployment manuale come fallback

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

- `dashboard/app/api/update-cron-schedule/route.ts` - API per aggiornamento cron
- `dashboard/app/scheduling/page.tsx` - Interfaccia utente
- `dashboard/vercel.json` - Configurazione cron Vercel
- `dashboard/.env.vercel.example` - Esempio variabili d'ambiente

## Sicurezza

- 🔒 Token Vercel mantenuto come variabile d'ambiente
- 🔒 Validazione input cron schedule
- 🔒 Gestione errori per deployment falliti
- 🔒 Log dettagliati per debugging

---

**Nota:** Questa funzionalità richiede i permessi API di Vercel. Se non configurata, l'aggiornamento della schedulazione funzionerà comunque nell'app, ma sarà necessario un deployment manuale per applicare le modifiche al cron job.