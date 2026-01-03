# Fix "Failed to fetch" - Riavvio ngrok

## Problema
L'errore "Failed to fetch" indica che Vercel non riesce a raggiungere il webhook server tramite ngrok.

## Causa
ngrok si è disconnesso o l'URL è cambiato. ngrok gratuito cambia URL ad ogni riavvio.

## Soluzione

### Passo 1: Riavvia ngrok
1. Apri un **nuovo terminale** (CMD o PowerShell)
2. Vai nella cartella del progetto:
   ```cmd
   cd C:\Fabrizio\ProgettiKiro\Abaddon_DWH
   ```
3. Avvia ngrok:
   ```cmd
   ngrok http 5000
   ```
4. **Copia il nuovo URL HTTPS** (esempio: `https://abc123.ngrok-free.dev`)

### Passo 2: Aggiorna Vercel
1. Vai su [vercel.com](https://vercel.com)
2. Seleziona il progetto `import-convex-dwh`
3. Vai su **Settings** → **Environment Variables**
4. Trova `NEXT_PUBLIC_WEBHOOK_URL`
5. **Modifica** il valore con il nuovo URL ngrok
6. **Salva** e **Redeploy** il progetto

### Passo 3: Verifica
1. Torna alla dashboard
2. Prova a premere "Sync Now"
3. Dovrebbe funzionare senza errori

## Stato Attuale
- ✅ Webhook server attivo (porta 5000)
- ❌ ngrok non attivo
- ❌ URL ngrok su Vercel obsoleto

## Comandi Rapidi

**Avvia ngrok:**
```cmd
ngrok http 5000
```

**Test locale webhook:**
```cmd
curl http://localhost:5000/health
```

## Note
- ngrok gratuito cambia URL ad ogni riavvio
- Tieni sempre ngrok aperto in un terminale separato
- Il webhook server deve rimanere attivo (porta 5000)
- Dopo ogni riavvio di ngrok, aggiorna l'URL su Vercel