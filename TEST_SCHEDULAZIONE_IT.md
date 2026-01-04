# 🧪 Test Schedulazione Sistema

## ⏰ Test Programmato

**Ora attuale**: 01:18 (Roma)  
**Orario test**: 01:23 (Roma) - tra 5 minuti  
**Formato cron**: `23 1 * * *`  
**Conversione UTC**: `23 0 * * *` (00:23 UTC)

## 📋 Procedura Test

### 1. Imposta Schedulazione
1. Vai su: https://import-convex-dwh.vercel.app/scheduling
2. Clicca "Edit Schedule" su una delle applicazioni
3. Abilita la schedulazione (checkbox)
4. Inserisci: `23 1 * * *`
5. Clicca "Save"

### 2. Verifica Messaggio
Dovresti vedere un messaggio simile a:
```
Schedulazione aggiornata con successo!

Orario Roma: 23 1 * * *
Orario UTC: 23 0 * * *

Il file vercel.json è stato aggiornato su GitHub.
Vercel farà il deployment automaticamente.
```

### 3. Controlla GitHub
1. Vai su: https://github.com/fabriziofantinel/import_convex_dwh
2. Apri: `dashboard/vercel.json`
3. Verifica che mostri: `"schedule": "23 0 * * *"`

### 4. Attendi Esecuzione
- **Orario previsto**: 01:23 (tra ~5 minuti)
- **Monitoraggio**: Controlla i log del webhook server
- **Verifica**: Vai su /logs nell'app per vedere i risultati

## 🔍 Monitoraggio in Tempo Reale

### Log Webhook Server
Il webhook server mostrerà:
```
[app_name] Starting sync job [job_id]
[app_name] ✓ Sync completed successfully
```

### Log Vercel
Vai su: https://vercel.com/dashboard → import-convex-dwh → Functions
Cerca i log della funzione cron alle 01:23

## ✅ Risultati Attesi

Se tutto funziona:
1. ✅ Schedulazione salvata senza errori
2. ✅ vercel.json aggiornato su GitHub
3. ✅ Vercel deployment completato
4. ✅ Cron job eseguito alle 01:23
5. ✅ Webhook chiamato correttamente
6. ✅ Sync completato con successo
7. ✅ Log visibili nell'app

## 🚨 Possibili Problemi

### Errore nel salvataggio
- Verifica che ngrok sia attivo
- Controlla che l'URL sia corretto su Vercel

### Cron job non parte
- Verifica l'orario in vercel.json
- Controlla i log di Vercel Functions

### Webhook non risponde
- Verifica che il webhook server sia attivo
- Testa la connettività ngrok

---

**Inizia il test ora!** ⏰