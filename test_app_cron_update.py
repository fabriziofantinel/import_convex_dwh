#!/usr/bin/env python3
"""
Test per simulare esattamente la chiamata che fa l'app all'API update-cron-schedule
"""

import requests
import json
from datetime import datetime

def test_app_cron_update():
    """Simula la chiamata dell'app all'API di aggiornamento cron"""
    
    print("🧪 Test Aggiornamento Cron dall'App")
    print("=" * 60)
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # URL dell'API su Vercel (come la chiama l'app)
    api_url = "https://import-convex-dwh.vercel.app/api/update-cron-schedule"
    
    # Payload esatto che invia l'app (01:27 Roma)
    payload = {
        "cron_schedule": "27 1 * * *"  # 01:27 Roma
    }
    
    headers = {
        "Content-Type": "application/json",
        "User-Agent": "Test-App-Simulation"
    }
    
    print(f"🌐 URL: {api_url}")
    print(f"📤 Payload: {json.dumps(payload, indent=2)}")
    print()
    
    try:
        print("📡 Invio richiesta...")
        response = requests.post(
            api_url,
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
                print("✅ RISPOSTA JSON:")
                print(json.dumps(result, indent=2))
                print()
                
                # Analizza la risposta
                if result.get('success'):
                    print("🎉 SUCCESSO: API ha confermato l'aggiornamento")
                    if result.get('github_updated'):
                        print("✅ GitHub aggiornato correttamente")
                    else:
                        print("❌ GitHub NON aggiornato")
                        print(f"   Errore: {result.get('error', 'Sconosciuto')}")
                else:
                    print("❌ FALLIMENTO: API ha restituito success=false")
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
        print("🔌 ERRORE CONNESSIONE: Impossibile raggiungere l'API")
    except Exception as e:
        print(f"💥 ERRORE IMPREVISTO: {e}")
    
    print()
    print("=" * 60)
    print("🎯 CONCLUSIONI:")
    print("- Se Status Code = 200 e success = true: API funziona")
    print("- Se github_updated = false: Problema credenziali GitHub")
    print("- Se Status Code != 200: Problema nell'API")
    print("- Se timeout/connessione: Problema di rete")
    print("=" * 60)

if __name__ == "__main__":
    test_app_cron_update()