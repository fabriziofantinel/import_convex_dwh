# Fix Errore CORS per Fetch Tables

## Problema Risolto
L'errore CORS che impediva alla dashboard di recuperare le tabelle dal webhook server è stato risolto.

## Errore Originale
```
Access to fetch at 'https://complicative-unimplicitly-greta.ngrok-free.dev/api/sync/app1' 
from origin 'https://import-convex-dwh.vercel.app' has been blocked by CORS policy: 
Response to preflight request doesn't pass access control check: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## Soluzione Implementata

### 1. Configurazione CORS Specifica
Aggiornato `webhook_server.py` con configurazioni CORS specifiche per Vercel:

```python
CORS(app, 
     origins=[
         'https://import-convex-dwh.vercel.app',
         'http://localhost:3000',
         'https://*.vercel.app'
     ],
     methods=['GET', 'POST', 'OPTIONS'],
     allow_headers=['Content-Type', 'Authorization'],
     supports_credentials=True
)
```

### 2. Handler Preflight Esplicito
Aggiunto handler per richieste OPTIONS (preflight):

```python
@app.before_request
def handle_preflight():
    """Handle CORS preflight requests"""
    if request.method == "OPTIONS":
        response = jsonify({'status': 'ok'})
        response.headers.add("Access-Control-Allow-Origin", "https://import-convex-dwh.vercel.app")
        response.headers.add('Access-Control-Allow-Headers', "Content-Type,Authorization")
        response.headers.add('Access-Control-Allow-Methods', "GET,POST,OPTIONS")
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response
```

### 3. Server Riavviato
Il webhook server è stato riavviato con le nuove configurazioni.

## Stato Attuale
- ✅ Webhook server in esecuzione su porta 5000
- ✅ CORS configurato per Vercel
- ✅ ngrok attivo: `https://complicative-unimplicitly-greta.ngrok-free.dev`
- ✅ Handler preflight implementato

## Test
Ora puoi provare a:
1. Creare una nuova applicazione nella dashboard
2. Cliccare su "Fetch Tables" 
3. Il sistema dovrebbe recuperare le tabelle senza errori CORS

## Note Tecniche
- Le richieste preflight (OPTIONS) sono ora gestite correttamente
- L'origine Vercel è esplicitamente autorizzata
- Le intestazioni necessarie sono incluse nelle risposte