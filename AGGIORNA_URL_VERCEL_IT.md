# 🔄 Aggiornamento URL ngrok su Vercel

## 📋 Procedura Rapida

### 1. Avvia ngrok
```bash
# Opzione A: Usa lo script
START_NGROK.bat

# Opzione B: Comando diretto
ngrok http 5000
```

### 2. Copia il nuovo URL
Cerca una riga simile a questa nell'output di ngrok:
```
Forwarding    https://abc123-def456.ngrok-free.dev -> http://localhost:5000
```
**Copia l'URL**: `https://abc123-def456.ngrok-free.dev`

### 3. Aggiorna su Vercel
1. Vai su: https://vercel.com/dashboard
2. Clicca su progetto: **import-convex-dwh**
3. Vai in: **Settings** → **Environment Variables**
4. Trova: `NEXT_PUBLIC_WEBHOOK_URL`
5. Clicca **Edit** accanto alla variabile
6. Sostituisci con il nuovo URL ngrok
7. Clicca **Save**

### 4. Redeploy
1. Vai in: **Deployments**
2. Trova l'ultimo deployment (in cima)
3. Clicca sui **3 puntini** → **Redeploy**
4. Conferma il redeploy

### 5. Verifica
1. Vai su: https://import-convex-dwh.vercel.app/scheduling
2. Prova a modificare un orario di schedulazione
3. Verifica che il salvataggio funzioni senza errori

## 🚨 Troubleshooting

### ngrok non trovato
```bash
# Verifica installazione
ngrok version

# Se non installato, scarica da: https://ngrok.com/download
```

### URL non funziona
- Verifica che il webhook server sia attivo (dovrebbe essere già in esecuzione)
- Testa l'URL ngrok nel browser: dovrebbe mostrare una pagina di errore ngrok (normale)

### Vercel non si aggiorna
- Aspetta 1-2 minuti dopo il redeploy
- Controlla che l'URL sia stato salvato correttamente
- Verifica che non ci siano spazi extra nell'URL

## ✅ Checklist Completa

- [ ] ngrok avviato e URL copiato
- [ ] URL aggiornato su Vercel
- [ ] Redeploy completato
- [ ] Test schedulazione riuscito
- [ ] Sistema funzionante

---

**Tempo stimato**: 3-5 minuti