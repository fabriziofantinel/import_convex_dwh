#!/usr/bin/env python3
"""
Test dell'API update-cron-schedule per diagnosticare il problema
"""

import requests
import json
from datetime import datetime

def test_cron_update_api():
    """Testa l'API di aggiornamento del cron job"""
    
    print("🔍 Test API Update Cron Schedule")
    print("=" * 50)
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # URL dell'API su Vercel
    api_url = "https://import-convex-dwh.vercel.app/api/update-cron-schedule"
    
    # Payload di test (01:30 Roma)
    test_payload = {
        "cron_schedule": "30 1 * * *"
    }
    
    print(f"🎯 URL: {api_url}")
    print(f"📦 Payload: {json.dumps(test_payload, indent=2)}")
    print()
    
    try:
        print("📡 Invio richiesta...")
        response = requests.post(
            api_url,
            json=test_payload,
            headers={
                'Content-Type': 'application/json',
                'User-Agent': 'Test-Script/1.0'
            },
            timeout=30
        )
        
        print(f"📊 Status Code: {response.status_code}")
        print(f"📋 Headers: {dict(response.headers)}")
        print()
        
        if response.status_code == 200:
            try:
                result = response.json()
                print("✅ RISPOSTA JSON:")
                print(json.dumps(result, indent=2))
                
                if result.get('success'):
                    print("\n🎉 SUCCESSO: API ha funzionato!")
                    if result.get('github_updated'):
                        print("✅ GitHub aggiornato correttamente")
                    else:
                        print("❌ GitHub NON aggiornato")
                else:
                    print(f"\n❌ ERRORE: {result.get('error', 'Errore sconosciuto')}")
                    
            except json.JSONDecodeError:
                print("❌ ERRORE: Risposta non è JSON valido")
                print(f"Contenuto: {response.text[:500]}...")
        else:
            print(f"❌ ERRORE HTTP: {response.status_code}")
            print(f"Contenuto: {response.text[:500]}...")
            
    except requests.exceptions.Timeout:
        print("❌ ERRORE: Timeout della richiesta (30s)")
    except requests.exceptions.ConnectionError as e:
        print(f"❌ ERRORE: Problema di connessione - {e}")
    except Exception as e:
        print(f"❌ ERRORE: {type(e).__name__}: {e}")

def test_github_api_directly():
    """Testa l'accesso diretto alle API GitHub"""
    
    print("\n" + "=" * 50)
    print("🔍 Test Accesso GitHub API")
    print("=" * 50)
    
    # Simula quello che fa l'API
    github_repo = "fabriziofantinel/import_convex_dwh"
    file_path = "dashboard/vercel.json"
    
    print(f"📂 Repository: {github_repo}")
    print(f"📄 File: {file_path}")
    print()
    
    try:
        # Test accesso al file
        url = f"https://api.github.com/repos/{github_repo}/contents/{file_path}"
        print(f"🔗 URL: {url}")
        
        response = requests.get(url, timeout=10)
        print(f"📊 Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ File accessibile da GitHub API")
            print(f"📏 Dimensione: {data.get('size', 'N/A')} bytes")
            print(f"🔄 SHA: {data.get('sha', 'N/A')[:10]}...")
        else:
            print(f"❌ Errore accesso file: {response.status_code}")
            print(f"Messaggio: {response.text[:200]}...")
            
    except Exception as e:
        print(f"❌ ERRORE: {e}")

if __name__ == "__main__":
    test_cron_update_api()
    test_github_api_directly()
    
    print("\n" + "=" * 50)
    print("🎯 CONCLUSIONI:")
    print("- Se l'API restituisce errori, il problema è nella configurazione")
    print("- Se l'API funziona ma GitHub non si aggiorna, problema nelle credenziali")
    print("- Se tutto funziona, il problema è nell'interfaccia dell'app")
    print("=" * 50)