#!/usr/bin/env python3
"""
Debug per il problema cron 1:42 - verifica stato e forza aggiornamento
"""

import requests
import json
from datetime import datetime

def debug_cron_142():
    """Debug completo per il problema 1:42"""
    
    print("🔍 DEBUG CRON 1:42")
    print("=" * 60)
    print(f"🕐 Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # 1. Verifica stato app
    print("📋 STEP 1: Verifica Stato App")
    print("-" * 40)
    
    try:
        response = requests.get("https://import-convex-dwh.vercel.app/api/cron/check-scheduled-syncs")
        if response.status_code == 200:
            data = response.json()
            print("✅ Stato app:")
            print(json.dumps(data, indent=2))
            
            if data.get('apps'):
                app = data['apps'][0]
                print(f"\n📅 App schedulazione: {app.get('cron_schedule')}")
                print(f"🔄 Cron abilitato: {app.get('cron_enabled')}")
        else:
            print(f"❌ Errore: {response.status_code}")
            
    except Exception as e:
        print(f"💥 Errore: {e}")
    
    # 2. Forza aggiornamento vercel.json
    print(f"\n📋 STEP 2: Forza Aggiornamento vercel.json")
    print("-" * 40)
    
    try:
        response = requests.post(
            "https://import-convex-dwh.vercel.app/api/update-cron-schedule",
            json={"cron_schedule": "42 1 * * *"},
            timeout=30
        )
        
        print(f"📊 Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Risposta aggiornamento:")
            print(json.dumps(result, indent=2))
            
            if result.get('github_updated'):
                print("\n🎉 GitHub dovrebbe essere aggiornato!")
                print(f"   Orario Roma: {result['rome_schedule']}")
                print(f"   Orario UTC: {result['utc_schedule']}")
            else:
                print("\n❌ GitHub NON aggiornato")
                print(f"   Errore: {result.get('error', 'Sconosciuto')}")
        else:
            print(f"❌ Errore HTTP: {response.text}")
            
    except Exception as e:
        print(f"💥 Errore: {e}")
    
    # 3. Test manuale cron job
    print(f"\n📋 STEP 3: Test Manuale Cron Job")
    print("-" * 40)
    
    print("⚠️  NOTA: Il cron job automatico potrebbe non funzionare se:")
    print("   1. vercel.json non è aggiornato su GitHub")
    print("   2. Vercel non ha fatto il rideploy")
    print("   3. L'orario è già passato per oggi")
    
    # Calcola prossima esecuzione
    now = datetime.now()
    if now.hour < 1 or (now.hour == 1 and now.minute < 42):
        print(f"\n⏰ Prossima esecuzione: Oggi alle 01:42")
    else:
        print(f"\n⏰ Prossima esecuzione: Domani alle 01:42")
    
    print(f"\n🎯 AZIONI NECESSARIE:")
    print("1. Verificare che vercel.json su GitHub sia aggiornato")
    print("2. Controllare deployment Vercel dopo l'aggiornamento")
    print("3. Se necessario, triggerare sync manualmente")
    print("4. Aspettare domani alle 01:42 per test automatico")
    
    print("\n" + "=" * 60)

if __name__ == "__main__":
    debug_cron_142()