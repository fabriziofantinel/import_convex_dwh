# Configurazione Rapida GitHub per Cron Dinamico

## Problema
Quando modifichi la schedulazione nell'app, vedi questo messaggio:
```
Schedulazione salvata nell'app!

Per l'aggiornamento automatico del cron job:
1. Configura GITHUB_TOKEN su Vercel
2. Configura GITHUB_REPO su Vercel
```

## Soluzione Rapida (5 minuti)

### Passo 1: Crea GitHub Token
1. Vai su: **https://github.com/settings/tokens**
2. Clicca **"Generate new token"** → **"Generate new token (classic)"**
3. **Nome:** `Vercel Cron Updates`
4. **Scopes:** Seleziona solo **"repo"** ✅
5. **Expiration:** `1 year` (o come preferisci)
6. Clicca **"Generate token"**
7. **COPIA IL TOKEN** (non lo vedrai più!)

### Passo 2: Aggiungi Variabili su Vercel
1. Vai su: **https://vercel.com/dashboard**
2. Clicca sul progetto **"import-convex-dwh"**
3. Vai in **Settings** → **Environment Variables**
4. Aggiungi queste 2 variabili:

**Prima variabile:**
- **Name:** `GITHUB_TOKEN`
- **Value:** Il token che hai copiato (es: `ghp_1a2b3c4d5e6f...`)
- **Environments:** Seleziona tutti (Production, Preview, Development)
- Clicca **"Save"**

**Seconda variabile:**
- **Name:** `GITHUB_REPO`
- **Value:** `fabriziofantinel/import_convex_dwh`
- **Environments:** Seleziona tutti (Production, Preview, Development)
- Clicca **"Save"**

### Passo 3: Rideploy
1. Vai nella tab **"Deployments"**
2. Clicca sui **tre puntini** dell'ultimo deployment
3. Clicca **"Redeploy"**
4. Aspetta che finisca (1-2 minuti)

## Test
Dopo il rideploy:
1. Vai nella pagina **Scheduling** dell'app
2. Modifica l'orario di una schedulazione
3. Clicca **"Save"**
4. Dovresti vedere: **"Il file vercel.json è stato aggiornato su GitHub"**

## Cosa Succede Automaticamente
1. ✅ Salva schedulazione nell'app
2. ✅ Converte orario Roma → UTC
3. ✅ Aggiorna `vercel.json` su GitHub
4. ✅ Vercel rileva il cambiamento
5. ✅ Deployment automatico
6. ✅ Nuovo cron job attivo

## Se Non Funziona
- Verifica che il token GitHub abbia scope **"repo"**
- Controlla che `GITHUB_REPO` sia esatto: `fabriziofantinel/import_convex_dwh`
- Assicurati di aver fatto rideploy dopo aver aggiunto le variabili

---

**Risultato:** Ora quando modifichi la schedulazione, il cron job di Vercel si aggiorna automaticamente! 🎉