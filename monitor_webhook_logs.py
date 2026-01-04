#!/usr/bin/env python3
"""
Monitor webhook server logs in real-time
"""

import time
import requests
from datetime import datetime

def monitor_webhook_logs():
    """Monitor webhook server activity"""
    
    print("🔍 Monitoraggio Webhook Server in Tempo Reale")
    print("=" * 60)
    print(f"Ora inizio: {datetime.now().strftime('%H:%M:%S')}")
    print("Premi Ctrl+C per fermare il monitoraggio")
    print("=" * 60)
    print()
    
    last_check = datetime.now()
    
    try:
        while True:
            current_time = datetime.now()
            
            # Test connettività ogni 30 secondi
            if (current_time - last_check).seconds >= 30:
                try:
                    response = requests.get("http://localhost:5000/health", timeout=5)
                    if response.status_code == 200:
                        data = response.json()
                        running_syncs = data.get('running_syncs', [])
                        
                        status = "🟢 ATTIVO"
                        if running_syncs:
                            status += f" - Sync in corso: {', '.join(running_syncs)}"
                        
                        print(f"[{current_time.strftime('%H:%M:%S')}] {status}")
                    else:
                        print(f"[{current_time.strftime('%H:%M:%S')}] 🔴 ERRORE - Status: {response.status_code}")
                        
                except requests.exceptions.RequestException as e:
                    print(f"[{current_time.strftime('%H:%M:%S')}] 🔴 DISCONNESSO - {e}")
                
                last_check = current_time
            
            # Controlla se è l'orario del test (01:23)
            if current_time.hour == 1 and current_time.minute == 23:
                print(f"[{current_time.strftime('%H:%M:%S')}] ⏰ ORARIO TEST RAGGIUNTO!")
                print("Monitoraggio intensivo per i prossimi 2 minuti...")
                
                # Monitoraggio intensivo per 2 minuti
                end_time = current_time.replace(minute=25)
                while datetime.now() < end_time:
                    try:
                        response = requests.get("http://localhost:5000/health", timeout=2)
                        if response.status_code == 200:
                            data = response.json()
                            running_syncs = data.get('running_syncs', [])
                            
                            if running_syncs:
                                print(f"[{datetime.now().strftime('%H:%M:%S')}] 🚀 SYNC ATTIVO: {', '.join(running_syncs)}")
                            else:
                                print(f"[{datetime.now().strftime('%H:%M:%S')}] ⏳ In attesa...")
                    except:
                        print(f"[{datetime.now().strftime('%H:%M:%S')}] ❌ Errore connessione")
                    
                    time.sleep(5)  # Check ogni 5 secondi durante il test
                
                print("Fine monitoraggio intensivo.")
                break
            
            time.sleep(10)  # Check ogni 10 secondi normalmente
            
    except KeyboardInterrupt:
        print(f"\n[{datetime.now().strftime('%H:%M:%S')}] Monitoraggio interrotto dall'utente")
    except Exception as e:
        print(f"\n[{datetime.now().strftime('%H:%M:%S')}] Errore: {e}")

if __name__ == "__main__":
    monitor_webhook_logs()