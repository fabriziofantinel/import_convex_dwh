#!/usr/bin/env python3
"""
Script per verificare lo stato attuale della schedulazione cron
"""

import requests
import json
from datetime import datetime

def check_github_vercel_json():
    """Verifica il contenuto di vercel.json su GitHub"""
    print("🔍 Verifica vercel.json su GitHub")
    print("=" * 50)
    
    try:
        # Richiesta pubblica (senza token) per vedere il file
        url = "https://api.github.com/repos/fabriziofantinel/import_convex_dwh/contents/dashboard/vercel.json"
        response = requests.get(url)
        
        if response.status_code == 200:
            data = response.json()
            import base64
            content = base64.b64decode(data['content']).decode('utf-8')
            vercel_config = json.loads(content)
            
            print("✅ File vercel.json trovato su GitHub:")
            print(json.dumps(vercel_config, indent=2))
            
            if 'crons' in vercel_config and vercel_config['crons']:
                cron_job = vercel_config['crons'][0]
                schedule = cron_job.get('schedule', 'N/A')
                print(f"\n📅 Schedulazione attuale: {schedule}")
                
                # Converti da UTC a Roma
                parts = schedule.split(' ')
                if len(parts) >= 2:
                    utc_hour = int(parts[1])
                    rome_hour = (utc_hour + 1) % 24  # UTC+1 per CET
                    print(f"🇮🇹 Orario Roma: {parts[0]} {rome_hour} * * * ({rome_hour:02d}:{parts[0]} ogni giorno)")
            
        else:
            print(f"❌ Errore: {response.status_code}")
            print(response.text)
            
    except Exception as e:
        print(f"💥 Errore: {e}")

def test_api_update():
    """Testa l'API di aggiornamento con un nuovo orario"""
    print("\n🧪 Test API Aggiornamento")
    print("=" * 50)
    
    # Test con orario 01:35 Roma
    test_schedule = "35 1 * * *"
    
    try:
        response = requests.post(
            "https://import-convex-dwh.vercel.app/api/update-cron-schedule",
            json={"cron_schedule": test_schedule},
            timeout=30
        )
        
        print(f"📤 Test con: {test_schedule} (01:35 Roma)")
        print(f"📊 Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Risposta:")
            print(json.dumps(result, indent=2))
        else:
            print(f"❌ Errore: {response.text}")
            
    except Exception as e:
        print(f"💥 Errore: {e}")

if __name__ == "__main__":
    print(f"🕐 Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    check_github_vercel_json()
    test_api_update()
    
    print("\n" + "=" * 50)
    print("🎯 CONCLUSIONI:")
    print("- Se GitHub mostra l'orario aggiornato: tutto funziona")
    print("- Se l'API test funziona: sistema operativo")
    print("- Vercel si aggiorna automaticamente da GitHub")