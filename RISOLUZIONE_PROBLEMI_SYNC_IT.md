# 🔧 Risoluzione Problemi Sync Schedulato

## Situazione Attuale

Il sistema di sync schedulato presenta alcuni problemi che impediscono l'esecuzione automatica:

### ✅ Problemi Risolti
- **Webhook Server**: ✅ Riavviato e funzionante su http://localhost:5000
- **Convex**: ✅ Configurato correttamente su produzione
- **GitHub Integration**: ✅ Token e repository configurati su Vercel

### ❌ Problemi da Risolvere

#### 1. ngrok Non Attivo
- **Problema**: L'URL ngrok `https://complicative-unimplicitly-greta.ngrok-free.dev` non è più raggiungibile (404)
- **Impatto**: Vercel non può comunicare con il webhook server locale

#### 2. Cron Job Non Aggiornato
- **Problema**: Il `vercel.json` mostra `31 22 * * *` (23:31 Roma) invece di `9 0 * * *` (01:09 Roma)
- **Causa**: L'ultimo aggiornamento del cron job non è andato a buon fine

## 🚀 Soluzione Rapida

### Passo 1: Riavvia ngrok
```bash
# Apri un nuovo terminale e avvia ngrok
ngrok http 5000
```

### Passo 2: Aggiorna URL su Vercel
1. Copia il nuovo URL ngrok (es: `https://abc123.ngrok-free.dev`)
2. Vai su [Vercel Dashboard](https://vercel.com/dashboard)
3. Seleziona il progetto `import-convex-dwh`
4. Vai in **Settings** → **Environment Variables**
5. Aggiorna `NEXT_PUBLIC_WEBHOOK_URL` con il nuovo URL ngrok
6. Clicca **Redeploy** per applicare le modifiche

### Passo 3: Testa il Sistema
1. Vai su https://import-convex-dwh.vercel.app/scheduling
2. Imposta un nuovo orario di test (es: 5 minuti da ora attuale)
3. Salva la configurazione
4. Verifica che il messaggio confermi l'aggiornamento su GitHub

## 🔍 Verifica Funzionamento

### Test Manuale Sync
```bash
# Testa il webhook direttamente
curl -X POST http://localhost:5000/sync \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token-12345" \
  -d '{"app_name": "test"}'
```

### Verifica Cron Job
1. Controlla il file `dashboard/vercel.json` su GitHub
2. Verifica che l'orario sia corretto in formato UTC
3. Esempio: 01:09 Roma = 00:09 UTC = `9 0 * * *`

## 📋 Checklist Completa

- [ ] Webhook server in esecuzione (✅ Fatto)
- [ ] ngrok attivo con nuovo URL
- [ ] URL ngrok aggiornato su Vercel
- [ ] Vercel redeployato
- [ ] Cron schedule aggiornato correttamente
- [ ] Test manuale sync funzionante
- [ ] Test schedulazione con orario vicino

## 🆘 Se Continua a Non Funzionare

### Opzione A: Debug Dettagliato
1. Controlla i log di Vercel: https://vercel.com/dashboard → Progetto → Functions
2. Verifica i log del webhook server locale
3. Testa la connettività ngrok → webhook server

### Opzione B: Aggiornamento Manuale
Se l'aggiornamento automatico continua a fallire:

1. Modifica manualmente `dashboard/vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/check-scheduled-syncs",
      "schedule": "9 0 * * *"
    }
  ]
}
```

2. Commit e push:
```bash
git add dashboard/vercel.json
git commit -m "Update cron schedule to 01:09 Rome time"
git push origin main
```

## 💡 Suggerimenti

- **Orari di Test**: Usa orari vicini (2-3 minuti) per test rapidi
- **Fuso Orario**: Ricorda che Roma è UTC+1 (inverno) o UTC+2 (estate)
- **Vercel Free**: Massimo 1 cron job al giorno
- **ngrok**: L'URL cambia ad ogni riavvio (versione gratuita)

---

**Prossimi Passi**: Riavvia ngrok, aggiorna l'URL su Vercel, e testa con un nuovo orario di schedulazione.