# Fix URL Convex Produzione su Vercel

## Problema
Vercel è configurato per utilizzare l'URL di sviluppo di Convex invece di quello di produzione.

## URL Corretti
- **Sviluppo**: `https://clever-porcupine-404.convex.cloud`
- **Produzione**: `https://blissful-schnauzer-295.convex.cloud` ← **Questo deve essere su Vercel**

## Soluzione

### Passo 1: Accedi a Vercel Dashboard
1. Vai su [vercel.com](https://vercel.com)
2. Accedi al tuo account
3. Seleziona il progetto `import-convex-dwh`

### Passo 2: Modifica Variabile d'Ambiente
1. Vai su **Settings** → **Environment Variables**
2. Trova la variabile `NEXT_PUBLIC_CONVEX_URL`
3. Clicca su **Edit**
4. Cambia il valore da:
   ```
   https://clever-porcupine-404.convex.cloud
   ```
   a:
   ```
   https://blissful-schnauzer-295.convex.cloud
   ```
5. Clicca **Save**

### Passo 3: Redeploy
1. Vai su **Deployments**
2. Clicca sui tre puntini dell'ultimo deployment
3. Seleziona **Redeploy**
4. Conferma il redeploy

## Verifica
Dopo il redeploy, la dashboard dovrebbe funzionare correttamente e la pagina `/logs` dovrebbe caricare senza errori.

## Note
- L'URL di produzione contiene tutte le funzioni aggiornate inclusa `getAllSyncJobs`
- L'URL di sviluppo era quello che stavi usando localmente
- Vercel deve sempre puntare alla produzione per funzionare correttamente