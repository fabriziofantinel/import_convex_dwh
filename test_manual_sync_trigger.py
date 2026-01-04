#!/usr/bin/env python3
"""
Test per triggerare manualmente un sync e verificare che funzioni
"""

import requests
import json
from datetime import datetime

def test_manual_sync():
    """Test trigger manuale sync"""
    
    print("🚀 TEST TRIGGER MANUALE SYNC")
    print("=" * 60)
    print(f"🕐 Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # URL del webhook per trigger manuale
    webhook_url = "https://complicative-unimplicitly-greta.ngrok-free.dev/api/sync"
    
    # Payload per trigger sync
    payload = {
        "app_name": "app1",  # Nome dell'app da sincronizzare
        "triggered_by": "manual_test"
    }
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": "Bearer test-token-12345",
        "User-Agent": "Manual-Sync-Test"
    }
    
    print(f"🌐 URL Webhook: {webhook_url}")
    print(f"📤 Payload: {json.dumps(payload, indent=2)}")
    print()
    
    try:
        print("📡 Invio richiesta sync manuale...")
        response = requests.post(
            webhook_url,
            json=payload,
            headers=headers,
            timeout=30
        )
        
        print(f"📊 Status Code: {response.status_code}")
        print(f"⏱️  Response Time: {response.elapsed.total_seconds():.2f}s")
        print()
        
        if response.status_code == 200:
            try:
                result = response.json()
                print("✅ RISPOSTA SYNC:")
                print(json.dumps(result, indent=2))
                
                if result.get('success'):
                    print("\n🎉 SYNC AVVIATO CON SUCCESSO!")
                    if 'job_id' in result:
                        print(f"   Job ID: {result['job_id']}")
                    print("   Controlla i log nell'app per vedere il progresso")
                else:
                    print("\n❌ SYNC FALLITO")
                    print(f"   Errore: {result.get('error', 'Sconosciuto')}")
                    
            except json.JSONDecodeError:
                print("❌ ERRORE: Risposta non è JSON valido")
                print(f"   Contenuto: {response.text[:200]}...")
        else:
            print(f"❌ ERRORE HTTP: {response.status_code}")
            print(f"   Messaggio: {response.text[:200]}...")
            
    except requests.exceptions.Timeout:
        print("⏰ TIMEOUT: La richiesta ha impiegato più di 30 secondi")
    except requests.exceptions.ConnectionError:
        print("🔌 ERRORE CONNESSIONE: Impossibile raggiungere il webhook")
        print("   Verifica che ngrok sia attivo e il webhook server in esecuzione")
    except Exception as e:
        print(f"💥 ERRORE IMPREVISTO: {e}")
    
    print("\n" + "=" * 60)
    print("🎯 VERIFICA RISULTATI:")
    print("1. Se sync avviato: vai su https://import-convex-dwh.vercel.app/logs")
    print("2. Controlla se appare un nuovo job di sync")
    print("3. Verifica lo stato del job (running/completed/failed)")
    print("4. Se funziona manualmente, il problema è solo nel timing del cron")
    print("=" * 60)

if __name__ == "__main__":
    test_manual_sync()