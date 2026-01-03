# Deploy Veloce su Vercel - 5 Minuti

Guida ultra-rapida per deployare su Vercel tramite GitHub.

**💡 Nota**: Il piano gratuito di Vercel è perfetto per questo progetto! Vedi [VERCEL_FREE_TIER_IT.md](./VERCEL_FREE_TIER_IT.md) per dettagli.

## 🚀 Procedura Veloce

### ⚠️ Importante: Repository in Organizzazione Privata?

Se il tuo repository è in un'organizzazione GitHub privata, Vercel richiede il piano Pro.

**Soluzione rapida (5 minuti)**: Trasferisci il repository nel tuo account personale GitHub.

👉 Vedi **[FIX_PRIVATE_ORG_IT.md](./FIX_PRIVATE_ORG_IT.md)** per la procedura veloce.

Il repository rimane privato, ma Vercel può accedervi gratuitamente!

---

### 1️⃣ Push su GitHub (2 minuti)

```bash
# Dalla root del progetto
git init
git add .
git commit -m "Initial commit"

# Crea repo su https://github.com/new (Private consigliato)
# Poi:
git remote add origin https://github.com/TUO-USERNAME/TUO-REPO.git
git branch -M main
git push -u origin main
```

### 2️⃣ Import su Vercel (2 minuti)

1. Vai su https://vercel.com/new
2. Clicca "Import Git Repository"
3. Seleziona il tuo repository
4. ⚠️ **IMPORTANTE**: Imposta **Root Directory** su `dashboard`
5. Aggiungi le 8 environment variables (vedi sotto)
6. Clicca "Deploy"

### 3️⃣ Environment Variables

```bash
NEXT_PUBLIC_AUTH0_DOMAIN=your-tenant.auth0.com
NEXT_PUBLIC_AUTH0_CLIENT_ID=your-client-id
NEXT_PUBLIC_AUTH0_REDIRECT_URI=https://temp.vercel.app
NEXT_PUBLIC_AUTH0_AUDIENCE=your-api-audience
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
CRON_SECRET=[genera con comando sotto]
WEBHOOK_URL=https://your-vm-domain.com:5000
WEBHOOK_TOKEN=your-webhook-token
```

**Genera CRON_SECRET**:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4️⃣ Post-Deploy (1 minuto)

Dopo il primo deploy, ottieni l'URL Vercel (es: `https://your-app.vercel.app`):

1. **Aggiorna Auth0**:
   - Auth0 Dashboard → Applications → Your App
   - Aggiungi URL Vercel a: Allowed Callback URLs, Allowed Logout URLs, Allowed Web Origins

2. **Aggiorna Vercel**:
   - Vercel → Settings → Environment Variables
   - Modifica `NEXT_PUBLIC_AUTH0_REDIRECT_URI` con URL reale
   - Redeploy

3. **Deploy Convex**:
   ```bash
   cd dashboard
   npx convex deploy --prod
   ```

4. **Testa**: Vai al tuo URL Vercel e prova il login!

## ⚠️ Punti Critici

1. **Root Directory**: DEVE essere `dashboard` (non la root del progetto)
2. **Auth0 Redirect URI**: DEVE corrispondere all'URL Vercel
3. **Convex URL**: DEVE essere il deployment di produzione

## ✅ Checklist Veloce

- [ ] Repo GitHub creato e pushato
- [ ] Importato su Vercel con Root Directory = `dashboard`
- [ ] 8 environment variables aggiunte
- [ ] Deploy completato
- [ ] Auth0 URLs aggiornati
- [ ] `NEXT_PUBLIC_AUTH0_REDIRECT_URI` aggiornato
- [ ] Convex deployato
- [ ] Login testato ✓

## 🔄 Deploy Successivi

Ogni push su GitHub deploya automaticamente:

```bash
git add .
git commit -m "Your changes"
git push origin main
```

## 🐛 Problemi?

**Build fallisce**: Verifica Root Directory = `dashboard`

**Auth0 loop**: Verifica che Redirect URI corrisponda

**Convex fails**: Verifica che URL sia corretto

## 📚 Guide Complete

- [DEPLOY_VERCEL_GITHUB_IT.md](./DEPLOY_VERCEL_GITHUB_IT.md) - Guida completa in italiano
- [GITHUB_VERCEL_SETUP.md](./GITHUB_VERCEL_SETUP.md) - Guida dettagliata in inglese
- [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) - Checklist completa

## 🎉 Fatto!

Il tuo dashboard è live su Vercel!
