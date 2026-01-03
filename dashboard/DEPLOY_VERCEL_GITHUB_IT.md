# Deploy su Vercel tramite GitHub - Guida Completa in Italiano

## Panoramica

Vercel richiede che il progetto sia importato da un repository Git (GitHub, GitLab, o Bitbucket) per abilitare il continuous deployment automatico. Questa guida ti mostra come configurare tutto.

## 📋 Cosa Ti Serve

- Account GitHub (gratuito)
- Account Vercel (gratuito)
- Git installato sul tuo computer
- Il progetto dashboard pronto

## 🚀 Procedura Completa

### Passo 1: Preparare il Progetto

#### 1.1 Verificare .gitignore

Il file `.gitignore` nella root del progetto è già configurato per escludere:
- `node_modules/`
- `.next/` (build output)
- `.env` e `.env.local` (variabili d'ambiente)
- `.convex/` (file generati Convex)
- File temporanei e di sistema

✅ Questo è già fatto, non serve fare nulla.

#### 1.2 Verificare che i File Sensibili Non Siano Tracciati

```bash
# Verifica che questi file NON siano tracciati da Git
git status

# Se vedi .env o config.json nella lista, rimuovili:
git rm --cached .env
git rm --cached config.json
git rm --cached dashboard/.env.local
```

### Passo 2: Creare Repository su GitHub

#### 2.1 Creare Nuovo Repository

1. Vai su https://github.com/new
2. Compila i campi:
   - **Repository name**: `sync-web-dashboard` (o il nome che preferisci)
   - **Description**: "Dashboard web per gestire sincronizzazioni Convex → SQL Server"
   - **Visibility**: 
     - **Private** (consigliato per progetti aziendali)
     - Public (solo se vuoi condividerlo pubblicamente)
   - **NON** selezionare "Initialize this repository with a README"
   - **NON** aggiungere .gitignore o license (li hai già)
3. Clicca "Create repository"

#### 2.2 Collegare il Progetto Locale a GitHub

GitHub ti mostrerà i comandi da eseguire. Dalla root del tuo progetto:

```bash
# Inizializza Git (se non l'hai già fatto)
git init

# Aggiungi tutti i file
git add .

# Crea il primo commit
git commit -m "Initial commit: Sync Web Dashboard"

# Collega al repository GitHub (sostituisci con il tuo URL)
git remote add origin https://github.com/TUO-USERNAME/sync-web-dashboard.git

# Rinomina branch in main
git branch -M main

# Push su GitHub
git push -u origin main
```

**Nota**: Sostituisci `TUO-USERNAME` con il tuo username GitHub e `sync-web-dashboard` con il nome del tuo repository.

#### 2.3 Verificare su GitHub

Vai sul tuo repository GitHub e verifica che tutti i file siano stati caricati correttamente.

### Passo 3: Importare Progetto su Vercel

#### 3.1 Accedere a Vercel

1. Vai su https://vercel.com
2. Clicca "Sign Up" o "Log In"
3. Scegli "Continue with GitHub" per collegare il tuo account GitHub
4. Autorizza Vercel ad accedere ai tuoi repository

#### 3.2 Importare il Repository

1. Clicca "Add New..." → "Project"
2. Nella sezione "Import Git Repository":
   - Vedrai la lista dei tuoi repository GitHub
   - Trova `sync-web-dashboard`
   - Clicca "Import"

#### 3.3 Configurare il Progetto

Nella schermata di configurazione:

**1. Project Name**
- Nome: `sync-web-dashboard` (o personalizza)

**2. Framework Preset**
- Dovrebbe rilevare automaticamente "Next.js"
- Se non lo fa, selezionalo manualmente

**3. Root Directory** ⚠️ **IMPORTANTE**
- Clicca "Edit" accanto a "Root Directory"
- Seleziona `dashboard` dalla lista
- Questo è FONDAMENTALE perché il progetto Next.js è nella sottocartella `dashboard`

**4. Build and Output Settings**
- Lascia i valori di default:
  - Build Command: `npm run build`
  - Output Directory: `.next`
  - Install Command: `npm install`

**5. Environment Variables** 🔑

Clicca "Add" per ogni variabile e inserisci i valori:

```bash
# Auth0 Configuration
NEXT_PUBLIC_AUTH0_DOMAIN
Valore: your-tenant.auth0.com

NEXT_PUBLIC_AUTH0_CLIENT_ID
Valore: your-client-id

NEXT_PUBLIC_AUTH0_REDIRECT_URI
Valore: https://temp.vercel.app (lo aggiornerai dopo)

NEXT_PUBLIC_AUTH0_AUDIENCE
Valore: your-api-audience

# Convex Configuration
NEXT_PUBLIC_CONVEX_URL
Valore: https://your-deployment.convex.cloud

# Cron Secret (genera un valore sicuro)
CRON_SECRET
Valore: [genera con il comando sotto]

# Webhook Configuration
WEBHOOK_URL
Valore: https://your-vm-domain.com:5000

WEBHOOK_TOKEN
Valore: your-webhook-token
```

**Come generare CRON_SECRET**:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copia l'output e usalo come valore per `CRON_SECRET`.

**6. Deploy**
- Clicca "Deploy"
- Attendi che il build completi (2-5 minuti)
- Vercel ti mostrerà i log in tempo reale

### Passo 4: Configurazione Post-Deploy

#### 4.1 Ottenere l'URL Vercel

Dopo il deploy, Vercel ti fornirà un URL tipo:
```
https://sync-web-dashboard-abc123.vercel.app
```

Copia questo URL, ti servirà per i prossimi passi.

#### 4.2 Aggiornare Auth0

1. **Vai su Auth0 Dashboard**
   - https://manage.auth0.com
   - Vai su Applications → Your Application

2. **Aggiorna le URL**
   - **Allowed Callback URLs**: Aggiungi il tuo URL Vercel
     ```
     https://sync-web-dashboard-abc123.vercel.app
     ```
   
   - **Allowed Logout URLs**: Aggiungi il tuo URL Vercel
     ```
     https://sync-web-dashboard-abc123.vercel.app
     ```
   
   - **Allowed Web Origins**: Aggiungi il tuo URL Vercel
     ```
     https://sync-web-dashboard-abc123.vercel.app
     ```

3. **Salva le modifiche**
   - Clicca "Save Changes" in fondo alla pagina

#### 4.3 Aggiornare Environment Variable su Vercel

1. **Vai su Vercel Dashboard**
   - Vai al tuo progetto
   - Clicca "Settings" → "Environment Variables"

2. **Aggiorna NEXT_PUBLIC_AUTH0_REDIRECT_URI**
   - Trova la variabile `NEXT_PUBLIC_AUTH0_REDIRECT_URI`
   - Clicca sui tre puntini → "Edit"
   - Sostituisci `https://temp.vercel.app` con il tuo URL Vercel reale
   - Clicca "Save"

3. **Redeploy**
   - Vai su "Deployments"
   - Clicca sui tre puntini sul deployment più recente
   - Clicca "Redeploy"
   - Attendi che il nuovo deploy completi

#### 4.4 Deploy Convex in Produzione

```bash
cd dashboard
npx convex deploy --prod
```

Questo comando:
- Deploya le funzioni Convex in produzione
- Ti fornisce un URL di produzione tipo: `https://your-prod.convex.cloud`

**Aggiorna NEXT_PUBLIC_CONVEX_URL su Vercel**:
1. Copia l'URL di produzione Convex
2. Vai su Vercel → Settings → Environment Variables
3. Modifica `NEXT_PUBLIC_CONVEX_URL` con il nuovo URL
4. Redeploy

#### 4.5 Configurare Environment Variables su Convex

Le funzioni Convex hanno bisogno di alcune variabili:

1. **Vai su Convex Dashboard**
   - https://dashboard.convex.dev
   - Seleziona il tuo progetto
   - Vai su Settings → Environment Variables

2. **Aggiungi le variabili**:
   ```bash
   WEBHOOK_URL=https://your-vm-domain.com:5000
   WEBHOOK_TOKEN=your-webhook-token
   ```

3. **Redeploy Convex**:
   ```bash
   npx convex deploy --prod
   ```

### Passo 5: Test Finale

#### 5.1 Testare il Login

1. Vai al tuo URL Vercel
2. Dovresti vedere la pagina di login
3. Clicca "Login" e autentica con Auth0
4. Dovresti essere reindirizzato al dashboard

#### 5.2 Testare le Funzionalità

- ✅ Crea una sync app di test
- ✅ Modifica la sync app
- ✅ Visualizza i log (se disponibili)
- ✅ Testa le impostazioni SQL e Email
- ✅ Prova il logout

## 🔄 Deploy Automatico

Ora ogni volta che fai push su GitHub, Vercel deploya automaticamente:

```bash
# Fai le tue modifiche
git add .
git commit -m "Descrizione delle modifiche"
git push origin main

# Vercel deploya automaticamente!
```

Puoi vedere i deployment in tempo reale su Vercel Dashboard → Deployments.

## 🌿 Branch e Preview Deployments

Vercel crea automaticamente preview deployments per ogni branch:

```bash
# Crea un nuovo branch per una feature
git checkout -b feature/nuova-funzionalita

# Fai le tue modifiche
git add .
git commit -m "Add nuova funzionalità"
git push origin feature/nuova-funzionalita

# Vercel crea un preview deployment con URL unico!
```

Ogni preview deployment ha il suo URL tipo:
```
https://sync-web-dashboard-git-feature-nuova-funzionalita-username.vercel.app
```

## 🐛 Risoluzione Problemi

### Build Fallisce su Vercel

**Errore: "Cannot find package.json"**
- ✅ Soluzione: Verifica che Root Directory sia impostata su `dashboard`
- Vai su Settings → General → Root Directory

**Errore: "Missing environment variables"**
- ✅ Soluzione: Verifica che tutte le 8 variabili siano configurate
- Vai su Settings → Environment Variables

**Errore: "Module not found"**
- ✅ Soluzione: Verifica che tutte le dipendenze siano in `package.json`
- Prova a fare build locale: `cd dashboard && npm run build`

### App Non Carica

**Auth0 redirect loop infinito**
- ✅ Soluzione: Verifica che `NEXT_PUBLIC_AUTH0_REDIRECT_URI` corrisponda all'URL Vercel
- ✅ Verifica che Auth0 Allowed Callback URLs includa l'URL Vercel

**Errore: "Convex connection failed"**
- ✅ Soluzione: Verifica che `NEXT_PUBLIC_CONVEX_URL` sia corretto
- ✅ Verifica che Convex sia deployato: `npx convex dashboard`

**Webhook non funziona**
- ✅ Verifica che `WEBHOOK_URL` sia accessibile pubblicamente
- ✅ Testa: `curl https://your-vm-domain.com:5000/health`
- ✅ Verifica che `WEBHOOK_TOKEN` corrisponda su Vercel e webhook server

### Git Issues

**File sensibili committati per errore**
```bash
# Rimuovi dal tracking ma mantieni locale
git rm --cached .env
git rm --cached config.json

# Commit e push
git commit -m "Remove sensitive files"
git push origin main
```

**Repository troppo grande**
```bash
# Verifica dimensione
du -sh .git

# Se troppo grande, verifica che node_modules non sia tracciato
git rm -r --cached node_modules
git commit -m "Remove node_modules"
git push origin main
```

## 📊 Monitoring

### Vercel Dashboard

- **Deployments**: Vedi tutti i deployment e i loro log
- **Analytics**: Traffico e performance
- **Logs**: Log in tempo reale delle funzioni serverless

### Convex Dashboard

- **Functions**: Log delle query/mutations
- **Database**: Browser dei dati
- **Logs**: Log in tempo reale del backend

## 🎯 Prossimi Passi

Dopo il deploy:

1. ✅ Configura un dominio personalizzato (opzionale)
2. ✅ Configura le notifiche email
3. ✅ Testa i cron jobs
4. ✅ Monitora i log per errori
5. ✅ Configura alerts (opzionale)

## 📚 Risorse

- **Vercel Docs**: https://vercel.com/docs
- **GitHub Docs**: https://docs.github.com
- **Next.js Deployment**: https://nextjs.org/docs/deployment
- **Convex Docs**: https://docs.convex.dev

## 💡 Tips Utili

1. **Usa Preview Deployments**: Testa le modifiche prima di mergare su main
2. **Rollback Facile**: Puoi rollback a qualsiasi deployment precedente in un click
3. **Environment Variables per Branch**: Puoi avere variabili diverse per production/preview
4. **Custom Domains**: Aggiungi domini personalizzati in Settings → Domains
5. **Team Collaboration**: Invita membri del team al progetto Vercel

## ✅ Checklist Completa

- [ ] Repository GitHub creato
- [ ] Codice pushato su GitHub
- [ ] Progetto importato su Vercel
- [ ] Root Directory impostata su `dashboard`
- [ ] Tutte le 8 environment variables configurate su Vercel
- [ ] Primo deploy completato con successo
- [ ] URL Vercel ottenuto
- [ ] Auth0 Allowed URLs aggiornati
- [ ] `NEXT_PUBLIC_AUTH0_REDIRECT_URI` aggiornato su Vercel
- [ ] Redeploy effettuato
- [ ] Convex deployato in produzione
- [ ] `NEXT_PUBLIC_CONVEX_URL` aggiornato su Vercel
- [ ] Environment variables configurate su Convex
- [ ] Login testato e funzionante
- [ ] Funzionalità principali testate
- [ ] Webhook server configurato e testato

## 🎉 Congratulazioni!

Il tuo dashboard è ora live su Vercel con continuous deployment automatico da GitHub!
