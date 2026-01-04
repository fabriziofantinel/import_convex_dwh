#!/usr/bin/env python3
"""
Test immediato per verificare se il cron job delle 01:55 funzionerà
"""

import requests
import json
from datetime import datetime

def test_immediato():
    """Test completo del sistema prima delle 01:55"""
    
    print("🚀 TEST IMMEDIATO SISTEMA CRON 01:55")
    print("=" * 60)
    print(f"🕐 Ora attuale: {datetime.now().strftime('%H:%M:%S')}")
    print()
    
    # Test 1: Verifica configurazione app
    print("📋 TEST 1: Configurazione App")
    print("-" * 40)
    
    try:
        response = requests.get("https://import-convex-dwh.vercel.app/api/cron/check-scheduled-syncs")
        if response.status_code == 200:
            data = response.json()
            app = data['apps'][0]
            schedule = app.get('cron_schedule')
            enabled = app.get('cron_enabled')
            
            print(f"✅ Schedule: {schedule}")
            print(f"✅ Enabled: {enabled}")
            
            if schedule == "55 1 * * *" and enabled:
                print("🎉 CONFIGURAZIONE CORRETTA!")
            else:
                print("❌ CONFIGURAZIONE ERRATA!")
                return
        else:
            print(f"❌ Errore API: {response.status_code}")
            return
    except Exception as e:
        print(f"💥 Errore: {e}")
        return
    
    # Test 2: Verifica webhook con bypass ngrok warning
    print(f"\n📋 TEST 2: Webhook Server")
    print("-" * 40)
    
    webhook_url = "https://complicative-unimplicitly-greta.ngrok-free.dev/api/sync"
    
    # Headers per bypassare il warning di ngrok
    headers = {
        "Content-Type": "application/json",
        "Authorization": "Bearer test-token-12345",
        "User-Agent": "Vercel-Cron-Job",
        "ngrok-skip-browser-warning": "true"  # Bypass ngrok warning
    }
    
    payload = {
        "app_name": "app1",
        "triggered_by": "test_pre_cron"
    }
    
    try:
        print("📡 Test connessione webhook...")
        response = requests.post(
            webhook_url,
            json=payload,
            headers=headers,
            timeout=15
        )
        
        print(f"📊 Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ WEBHOOK FUNZIONA!")
            print(f"   Risposta: {result.get('message', 'N/A')}")
            
            if result.get('success'):
                print("🎉 SYNC TEST AVVIATO CON SUCCESSO!")
                print("   Il sistema è pronto per il cron delle 01:55")
            else:
                print("⚠️  Webhook risponde ma sync non avviato")
                print(f"   Errore: {result.get('error', 'Sconosciuto')}")
        else:
            print(f"❌ WEBHOOK NON FUNZIONA: {response.status_code}")
            print(f"   Risposta: {response.text[:200]}...")
            
    except Exception as e:
        print(f"💥 Errore webhook: {e}")
    
    # Test 3: Verifica file vercel.json
    print(f"\n📋 TEST 3: Verifica Deployment")
    print("-" * 40)
    
    try:
        # Test API update per confermare che GitHub è aggiornato
        response = requests.post(
            "https://import-convex-dwh.vercel.app/api/update-cron-schedule",
            json={"cron_schedule": "55 1 * * *"},
            timeout=10
        )
        
        if response.status_code == 200:
            result = response.json()
            if result.get('github_updated'):
                print("✅ GITHUB AGGIORNATO!")
                print(f"   UTC Schedule: {result['utc_schedule']}")
            else:
                print("❌ GitHub non aggiornato")
        else:
            print(f"❌ Errore update API: {response.status_code}")
            
    except Exception as e:
        print(f"💥 Errore update test: {e}")
    
    # Conclusioni
    print(f"\n🎯 CONCLUSIONI PRE-CRON")
    print("=" * 60)
    
    now = datetime.now()
    minutes_to_155 = (55 - now.minute) if now.hour == 1 and now.minute < 55 else 0
    
    if minutes_to_155 > 0:
        print(f"⏰ Mancano {minutes_to_155} minuti alle 01:55")
        print("📋 COSA ASPETTARSI:")
        print("   1. Alle 00:55 UTC (01:55 Roma) Vercel eseguirà il cron")
        print("   2. Il cron chiamerà /api/cron/check-scheduled-syncs")
        print("   3. Questo dovrebbe triggerare il webhook")
        print("   4. Il webhook avvierà il sync")
        print("   5. Vedrai un nuovo job nei log dell'app")
        
        print(f"\n🔍 MONITORAGGIO:")
        print("   - Controlla i log alle 01:56-02:00")
        print("   - Vai su https://import-convex-dwh.vercel.app/logs")
        print("   - Cerca job con timestamp 01:55-02:00")
    else:
        print("⏰ L'orario 01:55 è già passato")
        print("   Controlla i log per vedere se il cron è partito")
    
    print("\n" + "=" * 60)

if __name__ == "__main__":
    test_immediato()