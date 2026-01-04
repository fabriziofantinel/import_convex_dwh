#!/usr/bin/env python3
"""
Test rapido per verificare che webhook e ngrok funzionino
"""

import requests
import json

def test_health():
    """Test endpoint /health"""
    print("=" * 60)
    print("TEST WEBHOOK HEALTH")
    print("=" * 60)
    
    # Test locale
    print("\n1. Test locale (http://localhost:5000/health)")
    try:
        response = requests.get("http://localhost:5000/health", timeout=5)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Webhook server attivo")
            print(f"   Running syncs: {data.get('running_syncs', [])}")
        else:
            print(f"   ❌ Errore: {response.text}")
    except Exception as e:
        print(f"   ❌ Errore: {e}")
    
    # Test ngrok
    print("\n2. Test ngrok (https://complicative-unimplicitly-greta.ngrok-free.dev/health)")
    try:
        response = requests.get(
            "https://complicative-unimplicitly-greta.ngrok-free.dev/health",
            headers={"ngrok-skip-browser-warning": "true"},
            timeout=10
        )
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ ngrok tunnel attivo")
            print(f"   Running syncs: {data.get('running_syncs', [])}")
        else:
            print(f"   ❌ Errore: {response.text}")
    except Exception as e:
        print(f"   ❌ Errore: {e}")
    
    print("\n" + "=" * 60)

def test_fetch_tables():
    """Test endpoint /api/fetch-tables"""
    print("\n3. Test fetch-tables")
    
    url = "https://complicative-unimplicitly-greta.ngrok-free.dev/api/fetch-tables"
    headers = {
        "Content-Type": "application/json",
        "Authorization": "Bearer test-token-12345",
        "ngrok-skip-browser-warning": "true"
    }
    payload = {
        "deploy_key": "dev:bold-husky-496|eyJ2MiI6ImFkNGNmOGI4YjBhYzRlYWY5NGRlYTFhZGI2Njg1NTcyIn0="
    }
    
    try:
        print(f"   URL: {url}")
        print(f"   Sending request...")
        response = requests.post(url, json=payload, headers=headers, timeout=60)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                tables = data.get('tables', [])
                print(f"   ✅ Fetch tables funziona!")
                print(f"   Tabelle trovate: {len(tables)}")
                if tables:
                    print(f"   Prime 5 tabelle: {tables[:5]}")
            else:
                print(f"   ❌ Errore: {data.get('error')}")
        else:
            print(f"   ❌ Errore HTTP: {response.text[:200]}")
    except Exception as e:
        print(f"   ❌ Errore: {e}")

if __name__ == "__main__":
    test_health()
    test_fetch_tables()
    
    print("\n" + "=" * 60)
    print("CONCLUSIONE")
    print("=" * 60)
    print("Se tutti i test sono ✅, il sistema è pronto!")
    print("Ora vai su Vercel e verifica NEXT_PUBLIC_WEBHOOK_URL")
    print("=" * 60)
