#!/usr/bin/env python3
"""
Test script per verificare la connettività del webhook server
"""

import requests
import json
import sys
from datetime import datetime

def test_webhook_server():
    """Testa la connettività del webhook server locale"""
    
    print("🔍 Test Connettività Webhook Server")
    print("=" * 50)
    
    # Test 1: Health check
    try:
        print("1. Test health check...")
        response = requests.get("http://localhost:5000/health", timeout=5)
        if response.status_code == 200:
            print("   ✅ Webhook server risponde correttamente")
        else:
            print(f"   ❌ Webhook server errore: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"   ❌ Webhook server non raggiungibile: {e}")
        return False
    
    # Test 2: Fetch tables endpoint
    try:
        print("2. Test fetch-tables endpoint...")
        headers = {
            "Content-Type": "application/json",
            "Authorization": "Bearer test-token-12345"
        }
        data = {"app_name": "test"}
        
        response = requests.post(
            "http://localhost:5000/api/fetch-tables", 
            headers=headers,
            json=data,
            timeout=10
        )
        
        if response.status_code == 200:
            print("   ✅ Endpoint fetch-tables funzionante")
        else:
            print(f"   ⚠️  Endpoint fetch-tables risposta: {response.status_code}")
            print(f"      Messaggio: {response.text[:100]}...")
    except requests.exceptions.RequestException as e:
        print(f"   ❌ Errore fetch-tables: {e}")
    
    # Test 3: Sync endpoint
    try:
        print("3. Test sync endpoint...")
        headers = {
            "Content-Type": "application/json",
            "Authorization": "Bearer test-token-12345"
        }
        data = {"app_name": "test"}
        
        response = requests.post(
            "http://localhost:5000/api/sync/test", 
            headers=headers,
            json=data,
            timeout=10
        )
        
        if response.status_code == 200:
            print("   ✅ Endpoint sync funzionante")
        else:
            print(f"   ⚠️  Endpoint sync risposta: {response.status_code}")
            print(f"      Messaggio: {response.text[:100]}...")
    except requests.exceptions.RequestException as e:
        print(f"   ❌ Errore sync: {e}")
    
    return True

def test_ngrok_connectivity(ngrok_url):
    """Testa la connettività tramite ngrok"""
    
    print(f"\n🌐 Test Connettività ngrok: {ngrok_url}")
    print("=" * 50)
    
    try:
        # Test health check tramite ngrok
        response = requests.get(f"{ngrok_url}/health", timeout=10)
        if response.status_code == 200:
            print("   ✅ ngrok tunnel funzionante")
            return True
        else:
            print(f"   ❌ ngrok errore: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"   ❌ ngrok non raggiungibile: {e}")
        return False

def main():
    print(f"🚀 Test Connettività Webhook - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # Test webhook server locale
    webhook_ok = test_webhook_server()
    
    if not webhook_ok:
        print("\n❌ PROBLEMA: Webhook server non funzionante")
        print("   Soluzione: Riavvia il webhook server con START_WEBHOOK.bat")
        sys.exit(1)
    
    # Test ngrok se fornito come argomento
    if len(sys.argv) > 1:
        ngrok_url = sys.argv[1].rstrip('/')
        ngrok_ok = test_ngrok_connectivity(ngrok_url)
        
        if not ngrok_ok:
            print(f"\n❌ PROBLEMA: ngrok tunnel non funzionante")
            print("   Soluzione: Riavvia ngrok e aggiorna l'URL su Vercel")
            sys.exit(1)
    else:
        print("\n💡 Per testare ngrok, esegui:")
        print("   python test_webhook_connectivity.py https://your-ngrok-url.ngrok-free.dev")
    
    print("\n✅ TUTTO OK: Sistema webhook funzionante!")
    print("\n📋 Prossimi passi:")
    print("   1. Assicurati che ngrok sia attivo")
    print("   2. Aggiorna NEXT_PUBLIC_WEBHOOK_URL su Vercel")
    print("   3. Testa la schedulazione dall'app")

if __name__ == "__main__":
    main()