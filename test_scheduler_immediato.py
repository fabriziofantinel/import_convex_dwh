#!/usr/bin/env python3
"""
Test immediato dello scheduler autonomo
"""

import requests
import json
from datetime import datetime

def test_trigger_sync():
    """Testa il trigger sync direttamente"""
    webhook_url = "https://complicative-unimplicitly-greta.ngrok-free.dev/api/sync/app1"
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": "Bearer test-token-12345",
        "ngrok-skip-browser-warning": "true"
    }
    
    payload = {
        "job_id": f"test_immediato_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
        "app_name": "app1", 
        "deploy_key": "prod:blissful-schnauzer-295",
        "tables": None,
        "table_mapping": None,
        "triggered_by": f"test_immediato_{datetime.now().strftime('%H%M%S')}"
    }
    
    print(f"🚀 {datetime.now().strftime('%H:%M:%S')} - Test trigger sync...")
    
    try:
        response = requests.post(
            webhook_url,
            json=payload,
            headers=headers,
            timeout=30
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code in [200, 202]:
            result = response.json()
            if result.get('success'):
                print(f"✅ Sync avviato con successo! Job ID: {result.get('job_id', 'N/A')}")
                return True
            else:
                print(f"❌ Sync fallito: {result.get('error', 'Errore sconosciuto')}")
        else:
            print(f"❌ Errore HTTP: {response.status_code}")
            
    except Exception as e:
        print(f"💥 Errore nel trigger sync: {e}")
    
    return False

if __name__ == "__main__":
    print("=" * 50)
    print("TEST IMMEDIATO SCHEDULER AUTONOMO")
    print("=" * 50)
    test_trigger_sync()