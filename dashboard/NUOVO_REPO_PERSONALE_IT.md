# Creare Nuovo Repository Personale per Vercel

Guida rapida per creare un nuovo repository sul tuo account GitHub personale e deployare su Vercel.

## 🎯 Vantaggi di Questa Soluzione

- ✅ Repository dell'organizzazione rimane intatto
- ✅ Completamente gratuito con Vercel
- ✅ Repository personale privato
- ✅ Continuous deployment automatico
- ✅ Setup in 5 minuti

## 🚀 Procedura Completa

### Passo 1: Crea Nuovo Repository su GitHub (1 minuto)

1. **Vai su GitHub**
   - Apri https://github.com/new

2. **Configura il repository**
   - **Repository name**: `sync-web-dashboard` (o il nome che preferisci)
   - **Description**: "Dashboard web per gestire sync Convex → SQL Server"
   - **Visibility**: **Private** ✅ (importante!)
   - **NON** selezionare "Initialize this repository with a README"
   - **NON** aggiungere .gitignore o license

3. **Crea il repository**
   - Clicca "Create repository"
   - GitHub ti mostrerà i comandi per il push

### Passo 2: Collega il Progetto Locale al Nuovo Repository (2 minuti)

Dalla root del tuo progetto (dove hai il codice):

```bash
# Se hai già un remote "origin" dall'organizzazione, rimuovilo
git remote remove origin

# Aggiungi il nuovo remote al tuo repository personale
git remote add origin https://github.com/TUO-USERNAME/sync-web-dashboard.git

# Verifica che sia corretto
git remote -v

# Dovresti vedere:
# origin  https://github.com/TUO-USERNAME/sync-web-dashboard.git (fetch)
# origin  https://github.com/TUO-USERNAME/sync-web-dashboard.git (push)
```

**Sostituisci**:
- `TUO-USERNAME` con il tuo username GitHub personale
- `sync-web-dashboard` con il nome che hai scelto

### Passo 3: Push del Codice (30 secondi)

```bash
# Assicurati di essere sul branch main
git branch -M main

# Push del codice al nuovo repository
git push -u origin main
```

### Passo 4: Verifica su GitHub (10 secondi)

1. Vai su `https://github.com/TUO-USERNAME/sync-web-dashboard`
2. Verifica che tutti i file siano stati caricati
3. Il repository è privato (solo tu puoi vederlo)

### Passo 5: Deploy su Vercel (2 minuti)

Ora segui la guida normale: **DEPLOY_VELOCE_IT.md**

1. **Vai su Vercel**
   - https://vercel.com/new

2. **Importa il repository**
   - Clicca "Import Git Repository"
   - Seleziona il tuo nuovo repository personale
   - Clicca "Import"

3. **Configura il progetto**
   - **Root Directory**: `dashboard` ⚠️ IMPORTANTE
   - **Framework**: Next.js (auto-rilevato)
   - **Build Command**: `npm run build` (default)

4. **Aggiungi Environment Variables**
   
   Clicca "Add" per ogni variabile:

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

5. **Deploy**
   - Clicca "Deploy"
   - Attendi 2-3 minuti

### Passo 6: Post-Deploy (1 minuto)

Dopo il deploy, ottieni l'URL Vercel (es: `https://sync-web-dashboard-abc123.vercel.app`):

1. **Aggiorna Auth0**
   - Auth0 Dashboard → Applications → Your App
   - Aggiungi URL Vercel a:
     - Allowed Callback URLs
     - Allowed Logout URLs
     - Allowed Web Origins

2. **Aggiorna Vercel**
   - Vercel → Settings → Environment Variables
   - Modifica `NEXT_PUBLIC_AUTH0_REDIRECT_URI` con URL reale
   - Redeploy

3. **Deploy Convex**
   ```bash
   cd dashboard
   npx convex deploy --prod
   ```

4. **Testa**
   - Vai al tuo URL Vercel
   - Prova il login
   - Verifica che tutto funzioni

## ✅ Fatto!

Ora hai:
- ✅ Repository personale privato su GitHub
- ✅ Dashboard deployato su Vercel (gratis)
- ✅ Continuous deployment automatico
- ✅ Repository dell'organizzazione intatto

## 🔄 Workflow Futuro

Ogni volta che fai modifiche:

```bash
# Fai le tue modifiche
git add .
git commit -m "Descrizione modifiche"
git push origin main

# Vercel deploya automaticamente!
```

## 🔒 Sicurezza

**Repository Privato**:
- Solo tu puoi accedervi
- Puoi aggiungere collaboratori se necessario
- Vercel accede tramite OAuth (sicuro)

**Environment Variables**:
- Configurate su Vercel (sicure)
- Mai committate su Git
- Criptate da Vercel

## 💡 Sincronizzazione con Repository Organizzazione (Opzionale)

Se vuoi mantenere sincronizzati entrambi i repository:

### Opzione A: Push su Entrambi

```bash
# Aggiungi il repository dell'organizzazione come secondo remote
git remote add org https://github.com/ORGANIZATION/REPO-NAME.git

# Push su entrambi
git push origin main      # Repository personale (per Vercel)
git push org main         # Repository organizzazione (backup)
```

### Opzione B: Solo Repository Personale

Usa solo il repository personale per Vercel. Il repository dell'organizzazione rimane come backup/archivio.

## 📋 Checklist Completa

- [ ] Nuovo repository creato su GitHub (privato)
- [ ] Remote Git aggiornato localmente
- [ ] Codice pushato sul nuovo repository
- [ ] Repository visibile su GitHub
- [ ] Progetto importato su Vercel
- [ ] Root Directory impostata su `dashboard`
- [ ] Tutte le 8 environment variables aggiunte
- [ ] Deploy completato con successo
- [ ] URL Vercel ottenuto
- [ ] Auth0 callback URLs aggiornati
- [ ] `NEXT_PUBLIC_AUTH0_REDIRECT_URI` aggiornato
- [ ] Convex deployato in produzione
- [ ] Login testato e funzionante

## ❓ FAQ

**Q: Posso cancellare il repository dell'organizzazione?**
A: Puoi, ma è meglio tenerlo come backup. Non costa nulla.

**Q: Posso aggiungere collaboratori al repository personale?**
A: Sì! Vai su Settings → Collaborators and teams

**Q: Cosa succede se faccio modifiche nel repository dell'organizzazione?**
A: Devi copiarle manualmente nel repository personale, o configurare due remote (vedi sopra)

**Q: Il repository personale è sicuro?**
A: Sì, è privato. Solo tu (e i collaboratori che aggiungi) possono accedervi.

**Q: Posso usare un nome diverso per il repository?**
A: Sì, usa il nome che preferisci. Ricorda solo di aggiornare l'URL nel comando `git remote add`

## 🎉 Vantaggi di Questa Soluzione

1. **Non tocchi il repository dell'organizzazione**
   - Rimane intatto
   - Nessun trasferimento necessario
   - Nessuna autorizzazione richiesta

2. **Completamente gratuito**
   - Vercel free tier
   - GitHub repository privato gratuito
   - Convex free tier

3. **Continuous deployment**
   - Ogni push deploya automaticamente
   - Preview deployments per branch
   - Rollback facile

4. **Flessibilità**
   - Puoi sincronizzare con l'organizzazione se vuoi
   - Puoi aggiungere collaboratori
   - Puoi trasferirlo in futuro se necessario

## 📚 Prossimi Passi

1. Segui questa guida per creare il repository
2. Deploy su Vercel
3. Configura Auth0 e Convex
4. Testa l'applicazione
5. Inizia a usare il dashboard!

---

**Hai bisogno di aiuto?** Controlla le altre guide:
- **DEPLOY_VELOCE_IT.md** - Guida deploy veloce
- **VERCEL_FREE_TIER_IT.md** - Dettagli piano gratuito
- **DEPLOY_VERCEL_GITHUB_IT.md** - Guida completa
