# Setup GitHub e Deploy su Vercel

Guida per configurare il repository GitHub e deployare su Vercel.

## Prerequisiti

- Account GitHub
- Account Vercel
- Git installato localmente

## Passo 1: Preparare il Repository

### 1.1 Verificare .gitignore

Assicurati che il file `.gitignore` nella root del progetto includa:

```gitignore
# Dependencies
node_modules/
dashboard/node_modules/

# Environment variables
.env
.env.local
.env.*.local
dashboard/.env
dashboard/.env.local
dashboard/.env.*.local

# Build output
.next/
dashboard/.next/
out/
dashboard/out/
dist/
dashboard/dist/

# Convex
.convex/
dashboard/.convex/
dashboard/convex/_generated/

# Testing
coverage/
dashboard/coverage/
.nyc_output/

# Logs
logs/
*.log
npm-debug.log*

# OS files
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo

# Python
__pycache__/
*.py[cod]
*$py.class
.pytest_cache/
venv/
env/

# Temporary files
*.tmp
temp/
```

### 1.2 Creare .gitignore per dashboard (se non esiste)

Crea `dashboard/.gitignore`:

```gitignore
# Dependencies
node_modules

# Environment variables
.env
.env.local
.env.*.local

# Build output
.next
out
dist

# Convex
.convex
convex/_generated

# Testing
coverage
.nyc_output

# Logs
*.log
npm-debug.log*

# OS files
.DS_Store
Thumbs.db

# IDE
.vscode
.idea
*.swp
*.swo
```

## Passo 2: Creare Repository GitHub

### Opzione A: Nuovo Repository

1. **Vai su GitHub**
   - Vai a https://github.com/new
   - Nome repository: `sync-web-dashboard` (o il nome che preferisci)
   - Descrizione: "Web dashboard per gestire sync Convex → SQL Server"
   - Visibilità: Private (consigliato per progetti aziendali)
   - NON inizializzare con README, .gitignore o license (li hai già)

2. **Inizializza Git localmente**
   ```bash
   # Dalla root del progetto
   git init
   git add .
   git commit -m "Initial commit: Sync Web Dashboard"
   ```

3. **Collega al repository remoto**
   ```bash
   # Sostituisci con il tuo username e repository
   git remote add origin https://github.com/TUO-USERNAME/sync-web-dashboard.git
   git branch -M main
   git push -u origin main
   ```

### Opzione B: Repository Esistente

Se hai già un repository:

```bash
# Dalla root del progetto
git add .
git commit -m "Add dashboard deployment configuration"
git push origin main
```

## Passo 3: Collegare Vercel a GitHub

### 3.1 Importare Progetto su Vercel

1. **Vai su Vercel**
   - Vai a https://vercel.com/new
   - Clicca "Add New..." → "Project"

2. **Importa Repository GitHub**
   - Clicca "Import Git Repository"
   - Se è la prima volta, autorizza Vercel ad accedere a GitHub
   - Seleziona il repository `sync-web-dashboard`
   - Clicca "Import"

### 3.2 Configurare il Progetto

Nella schermata di configurazione:

1. **Project Name**: `sync-web-dashboard` (o personalizza)

2. **Framework Preset**: Next.js (dovrebbe essere rilevato automaticamente)

3. **Root Directory**: `dashboard`
   - Clicca "Edit" accanto a Root Directory
   - Seleziona la cartella `dashboard`
   - Questo è IMPORTANTE perché il progetto Next.js è nella sottocartella

4. **Build and Output Settings**:
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)
   - Install Command: `npm install` (default)

5. **Environment Variables**:
   - Clicca "Add" per ogni variabile
   - Aggiungi tutte le variabili necessarie (vedi sotto)

### 3.3 Aggiungere Environment Variables

Aggiungi queste variabili una per una:

```bash
# Auth0
NEXT_PUBLIC_AUTH0_DOMAIN=your-tenant.auth0.com
NEXT_PUBLIC_AUTH0_CLIENT_ID=your-client-id
NEXT_PUBLIC_AUTH0_REDIRECT_URI=https://your-app.vercel.app
NEXT_PUBLIC_AUTH0_AUDIENCE=your-api-audience

# Convex
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud

# Cron Secret (genera con: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
CRON_SECRET=your-secure-random-secret

# Webhook
WEBHOOK_URL=https://your-vm-domain.com:5000
WEBHOOK_TOKEN=your-webhook-token
```

**Nota**: Per `NEXT_PUBLIC_AUTH0_REDIRECT_URI`, usa temporaneamente un placeholder come `https://temp.vercel.app`. Lo aggiornerai dopo il primo deploy.

6. **Deploy**
   - Clicca "Deploy"
   - Attendi che il build completi (2-5 minuti)

## Passo 4: Post-Deployment

### 4.1 Ottenere URL Vercel

Dopo il deploy, Vercel ti fornirà un URL tipo:
- `https://sync-web-dashboard-abc123.vercel.app`

### 4.2 Aggiornare Auth0 Redirect URI

1. **Aggiorna variabile d'ambiente**:
   - Vai su Vercel Dashboard → Project → Settings → Environment Variables
   - Trova `NEXT_PUBLIC_AUTH0_REDIRECT_URI`
   - Clicca "Edit"
   - Sostituisci con il tuo URL Vercel reale
   - Clicca "Save"

2. **Aggiorna Auth0 Dashboard**:
   - Vai su Auth0 Dashboard → Applications → Your Application
   - Aggiungi il tuo URL Vercel a:
     - Allowed Callback URLs: `https://your-app.vercel.app`
     - Allowed Logout URLs: `https://your-app.vercel.app`
     - Allowed Web Origins: `https://your-app.vercel.app`
   - Clicca "Save Changes"

3. **Redeploy**:
   - Torna su Vercel Dashboard → Deployments
   - Clicca "..." sul deployment più recente
   - Clicca "Redeploy"

### 4.3 Configurare Custom Domain (Opzionale)

Se hai un dominio personalizzato:

1. Vai su Vercel Dashboard → Project → Settings → Domains
2. Aggiungi il tuo dominio (es: `dashboard.tuodominio.com`)
3. Configura i DNS records come indicato da Vercel
4. Aggiorna `NEXT_PUBLIC_AUTH0_REDIRECT_URI` con il nuovo dominio
5. Aggiorna Auth0 Allowed URLs con il nuovo dominio

## Passo 5: Continuous Deployment

Ora ogni push su GitHub triggerà automaticamente un deploy:

### Deploy Automatici

- **Push su `main`**: Deploy in produzione
- **Push su altri branch**: Deploy di preview
- **Pull Request**: Deploy di preview con URL unico

### Disabilitare Auto-Deploy (se necessario)

Se vuoi deployare manualmente:

1. Vai su Vercel Dashboard → Project → Settings → Git
2. Trova "Ignored Build Step"
3. Aggiungi uno script custom per controllare quando deployare

## Passo 6: Deploy Convex

Non dimenticare di deployare anche Convex:

```bash
cd dashboard
npx convex deploy --prod
```

Copia l'URL di deployment e aggiornalo in Vercel:
1. Vercel Dashboard → Settings → Environment Variables
2. Aggiorna `NEXT_PUBLIC_CONVEX_URL`
3. Redeploy

## Workflow Completo di Deploy

### Deploy Iniziale

```bash
# 1. Commit e push su GitHub
git add .
git commit -m "Ready for production"
git push origin main

# 2. Deploy Convex
cd dashboard
npx convex deploy --prod

# 3. Aggiorna NEXT_PUBLIC_CONVEX_URL su Vercel
# (via Dashboard)

# 4. Redeploy su Vercel
# (automatico dopo push, o manuale via Dashboard)
```

### Deploy Successivi

```bash
# 1. Fai le tue modifiche
git add .
git commit -m "Your changes"
git push origin main

# 2. Se hai modificato Convex functions
cd dashboard
npx convex deploy --prod

# 3. Vercel deploya automaticamente
```

## Troubleshooting

### Build Fallisce su Vercel

**Errore: Cannot find module**
- Verifica che tutte le dipendenze siano in `package.json`
- Verifica che Root Directory sia impostata su `dashboard`

**Errore: Environment variable not found**
- Verifica che tutte le variabili d'ambiente siano configurate
- Ricorda: le variabili `NEXT_PUBLIC_*` devono essere disponibili al build time

**Errore: Build timeout**
- Vercel free tier ha timeout di 45 secondi
- Considera upgrade a Pro per timeout di 15 minuti

### Deploy Funziona ma App Non Carica

**Auth0 redirect loop**
- Verifica che `NEXT_PUBLIC_AUTH0_REDIRECT_URI` corrisponda all'URL Vercel
- Verifica che Auth0 Allowed Callback URLs includa l'URL Vercel

**Convex connection fails**
- Verifica che `NEXT_PUBLIC_CONVEX_URL` sia corretto
- Verifica che Convex sia deployato: `npx convex dashboard`

### Git Issues

**File troppo grandi**
- Verifica che `node_modules` sia in `.gitignore`
- Verifica che `.next` sia in `.gitignore`
- Usa `git rm --cached -r node_modules` se già committato

**Merge conflicts**
- Risolvi i conflitti localmente
- Commit e push

## Comandi Utili

```bash
# Verificare status Git
git status

# Vedere commit history
git log --oneline

# Creare nuovo branch per feature
git checkout -b feature/nome-feature

# Tornare a main
git checkout main

# Vedere deployments Vercel
vercel ls

# Vedere logs Vercel
vercel logs

# Rollback a deployment precedente
# (via Vercel Dashboard → Deployments → Promote to Production)
```

## Best Practices

1. **Branch Strategy**:
   - `main`: produzione
   - `develop`: sviluppo
   - `feature/*`: nuove feature

2. **Commit Messages**:
   - Usa messaggi descrittivi
   - Esempio: "feat: add email notifications"
   - Esempio: "fix: resolve auth redirect loop"

3. **Environment Variables**:
   - Non committare mai file `.env` con valori reali
   - Usa `.env.example` per documentare variabili necessarie
   - Ruota secrets regolarmente

4. **Testing Prima del Deploy**:
   - Testa localmente: `npm run build && npm start`
   - Verifica che tutti i test passino: `npm test`
   - Usa preview deployments per testare prima di mergare su main

## Risorse

- **Vercel Docs**: https://vercel.com/docs
- **GitHub Docs**: https://docs.github.com
- **Next.js Deployment**: https://nextjs.org/docs/deployment

## Supporto

Se hai problemi:
1. Controlla i logs su Vercel Dashboard → Deployments → Function Logs
2. Controlla i logs Convex: `npx convex logs --prod`
3. Verifica le variabili d'ambiente: Vercel Dashboard → Settings → Environment Variables
