# Deploy su Vercel via GitHub - Guida Rapida

Guida veloce per deployare su Vercel importando da GitHub.

## 🚀 Setup Rapido (5 minuti)

### 1. Push su GitHub

```bash
# Se non hai ancora inizializzato Git
git init
git add .
git commit -m "Initial commit"

# Crea repository su https://github.com/new
# Poi collega e push:
git remote add origin https://github.com/TUO-USERNAME/TUO-REPO.git
git branch -M main
git push -u origin main
```

### 2. Importa su Vercel

1. Vai su https://vercel.com/new
2. Clicca "Import Git Repository"
3. Seleziona il tuo repository
4. **IMPORTANTE**: Imposta Root Directory su `dashboard`
5. Aggiungi le environment variables (vedi sotto)
6. Clicca "Deploy"

### 3. Environment Variables da Aggiungere

```bash
NEXT_PUBLIC_AUTH0_DOMAIN=your-tenant.auth0.com
NEXT_PUBLIC_AUTH0_CLIENT_ID=your-client-id
NEXT_PUBLIC_AUTH0_REDIRECT_URI=https://temp.vercel.app
NEXT_PUBLIC_AUTH0_AUDIENCE=your-api-audience
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
CRON_SECRET=genera-con-comando-sotto
WEBHOOK_URL=https://your-vm-domain.com:5000
WEBHOOK_TOKEN=your-webhook-token
```

**Genera CRON_SECRET**:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Dopo il Primo Deploy

1. **Ottieni URL Vercel** (es: `https://your-app.vercel.app`)

2. **Aggiorna Auth0**:
   - Vai su Auth0 Dashboard → Applications
   - Aggiungi URL Vercel a Allowed Callback URLs
   - Aggiungi URL Vercel a Allowed Logout URLs
   - Aggiungi URL Vercel a Allowed Web Origins

3. **Aggiorna Environment Variable**:
   - Vercel Dashboard → Settings → Environment Variables
   - Modifica `NEXT_PUBLIC_AUTH0_REDIRECT_URI` con URL reale
   - Redeploy

4. **Deploy Convex**:
   ```bash
   cd dashboard
   npx convex deploy --prod
   ```

5. **Testa**:
   - Visita il tuo URL Vercel
   - Prova il login
   - Crea una sync app di test

## 📋 Checklist Veloce

- [ ] Repository su GitHub creato
- [ ] Progetto importato su Vercel
- [ ] Root Directory impostata su `dashboard`
- [ ] Tutte le 8 environment variables aggiunte
- [ ] Primo deploy completato
- [ ] URL Vercel ottenuto
- [ ] Auth0 callback URLs aggiornati
- [ ] `NEXT_PUBLIC_AUTH0_REDIRECT_URI` aggiornato
- [ ] Convex deployato in produzione
- [ ] Login testato e funzionante

## 🔄 Deploy Successivi

Ogni volta che fai push su GitHub, Vercel deploya automaticamente:

```bash
git add .
git commit -m "Your changes"
git push origin main
```

## ⚙️ Configurazione Root Directory

**IMPORTANTE**: Quando importi il progetto su Vercel, devi impostare Root Directory su `dashboard` perché il progetto Next.js è in una sottocartella.

**Come fare**:
1. Durante l'import, cerca "Root Directory"
2. Clicca "Edit"
3. Seleziona `dashboard` dalla lista
4. Conferma

Se dimentichi questo step, il build fallirà!

## 🐛 Problemi Comuni

### Build Fallisce

**Errore: "Cannot find package.json"**
- Soluzione: Imposta Root Directory su `dashboard`

**Errore: "Missing environment variables"**
- Soluzione: Aggiungi tutte le 8 variabili in Settings → Environment Variables

### App Non Carica

**Auth0 redirect loop**
- Soluzione: Verifica che Auth0 Allowed Callback URLs includa il tuo URL Vercel

**Convex connection fails**
- Soluzione: Verifica che `NEXT_PUBLIC_CONVEX_URL` sia corretto

## 📚 Documentazione Completa

Per maggiori dettagli, vedi:
- **[GITHUB_VERCEL_SETUP.md](./GITHUB_VERCEL_SETUP.md)** - Guida completa
- **[VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)** - Deployment Vercel
- **[CONVEX_DEPLOYMENT.md](./CONVEX_DEPLOYMENT.md)** - Deployment Convex

## 💡 Tips

1. **Preview Deployments**: Ogni branch ottiene un URL di preview automatico
2. **Rollback**: Puoi rollback a qualsiasi deployment precedente dalla Dashboard
3. **Custom Domain**: Puoi aggiungere un dominio personalizzato in Settings → Domains
4. **Logs**: Controlla i logs in Deployments → Function Logs

## 🎯 Prossimi Passi

Dopo il deploy:
1. Configura email notifications
2. Testa i cron jobs
3. Monitora i logs
4. Configura alerts (opzionale)
