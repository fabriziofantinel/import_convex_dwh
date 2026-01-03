# Guida Setup Auth0 e Convex

## ⚠️ Stato Attuale

Il progetto è configurato ma richiede:
1. ✅ Codice implementato (Task 1, 2, 3 completi)
2. ❌ Convex deployment (necessario per build)
3. ❌ Auth0 configurato (necessario per autenticazione)

## 🔧 Setup Passo per Passo

### Step 1: Deploy Convex (OBBLIGATORIO per build)

```bash
cd dashboard
npx convex dev
```

**Cosa succede:**
1. Ti chiederà di fare login (si apre il browser)
2. Ti chiederà di creare un progetto o selezionarne uno
3. Genererà i file in `convex/_generated/`
4. Ti darà un URL tipo: `https://happy-animal-123.convex.cloud`

**Copia l'URL** e aggiungilo a `.env.local`:
```env
NEXT_PUBLIC_CONVEX_URL=https://happy-animal-123.convex.cloud
```

**⚠️ IMPORTANTE**: Lascia `npx convex dev` in esecuzione in un terminale separato durante lo sviluppo!

---

### Step 2: Configura Auth0

#### 2.1 Crea Account Auth0
1. Vai su [auth0.com](https://auth0.com)
2. Registrati (gratuito)
3. Crea un tenant (es: `dev-abc123`)

#### 2.2 Crea Application
1. Dashboard → Applications → Applications
2. Click "Create Application"
3. Nome: `Sync Web Dashboard`
4. Type: **Single Page Application**
5. Click "Create"

#### 2.3 Configura Application Settings
Nella pagina dell'application:

**Application URIs:**
- **Allowed Callback URLs**: 
  ```
  http://localhost:3000
  ```
- **Allowed Logout URLs**: 
  ```
  http://localhost:3000
  ```
- **Allowed Web Origins**: 
  ```
  http://localhost:3000
  ```

**Salva le modifiche!**

#### 2.4 Copia le Credenziali
Nella stessa pagina, trovi:
- **Domain**: `dev-abc123.us.auth0.com`
- **Client ID**: `xYz123AbC456DeF789`

#### 2.5 Crea API (per Audience)
1. Dashboard → Applications → APIs
2. Click "Create API"
3. Compila:
   - **Name**: `Sync Dashboard API`
   - **Identifier**: `https://sync-dashboard-api` (questo è il tuo AUDIENCE!)
   - **Signing Algorithm**: RS256
4. Click "Create"

---

### Step 3: Aggiorna .env.local

Apri `dashboard/.env.local` e compila:

```env
# Auth0 Configuration
NEXT_PUBLIC_AUTH0_DOMAIN=dev-abc123.us.auth0.com
NEXT_PUBLIC_AUTH0_CLIENT_ID=xYz123AbC456DeF789
NEXT_PUBLIC_AUTH0_REDIRECT_URI=http://localhost:3000
NEXT_PUBLIC_AUTH0_AUDIENCE=https://sync-dashboard-api

# Convex Configuration
NEXT_PUBLIC_CONVEX_URL=https://happy-animal-123.convex.cloud

# Cron Secret (genera una stringa random)
CRON_SECRET=your-random-secret-here

# Webhook Configuration (VM Windows - configurare dopo)
WEBHOOK_URL=
WEBHOOK_TOKEN=
```

**Come generare CRON_SECRET:**
```bash
# PowerShell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})

# O usa un generatore online
# https://www.random.org/strings/
```

---

### Step 4: Verifica Setup

#### 4.1 Verifica Convex
```bash
# In un terminale separato
cd dashboard
npx convex dev
```

Dovresti vedere:
```
✔ Convex functions ready!
  https://your-deployment.convex.cloud
  
Watching for file changes...
```

#### 4.2 Verifica Build
```bash
# In un altro terminale
cd dashboard
npm run build
```

Dovrebbe compilare senza errori!

#### 4.3 Avvia Dev Server
```bash
npm run dev
```

#### 4.4 Testa Autenticazione
1. Apri browser: `http://localhost:3000`
2. Dovresti essere reindirizzato a `/login`
3. Poi reindirizzato ad Auth0
4. Dopo login, torni alla dashboard

---

## ✅ Checklist Verifica

- [ ] Convex deployato (`npx convex dev` in esecuzione)
- [ ] File `convex/_generated/` esistono
- [ ] Auth0 application creata
- [ ] Auth0 API creata (per audience)
- [ ] Callback URLs configurati in Auth0
- [ ] `.env.local` compilato con tutti i valori
- [ ] `npm run build` funziona
- [ ] `npm run dev` funziona
- [ ] Login Auth0 funziona

---

## 🐛 Troubleshooting

### Errore: "Cannot find module './_generated/server'"
**Soluzione**: Devi fare il deploy di Convex prima:
```bash
npx convex dev
```

### Errore: "redirect_uri_mismatch" su Auth0
**Soluzione**: Verifica che in Auth0 Settings → Allowed Callback URLs ci sia:
```
http://localhost:3000
```

### Errore: "audience is required"
**Soluzione**: 
1. Crea una API in Auth0
2. Copia l'Identifier
3. Aggiungilo a `.env.local` come `NEXT_PUBLIC_AUTH0_AUDIENCE`

### Build fallisce con errori TypeScript
**Soluzione**: Assicurati che `npx convex dev` sia in esecuzione e abbia generato i file in `_generated/`

### Login non funziona
**Soluzione**: 
1. Verifica che tutti i valori in `.env.local` siano corretti
2. Verifica che le Callback URLs in Auth0 siano configurate
3. Riavvia il dev server dopo aver modificato `.env.local`

---

## 📞 Prossimi Passi

Dopo aver completato il setup:

1. ✅ Convex e Auth0 configurati
2. ✅ Login funzionante
3. 🔜 **Task 4**: Implementare Dashboard UI
4. 🔜 **Task 5**: Implementare gestione applicazioni
5. 🔜 **Task 9**: Implementare Flask webhook server

---

## 💡 Tips

- **Convex Dev**: Lascia sempre `npx convex dev` in esecuzione durante lo sviluppo
- **Environment Variables**: Riavvia il dev server dopo aver modificato `.env.local`
- **Auth0 Free Tier**: Supporta fino a 7000 utenti attivi/mese
- **Convex Free Tier**: 1GB storage, 1M function calls/mese

---

**Hai bisogno di aiuto?** Fammi sapere quale step non funziona!
