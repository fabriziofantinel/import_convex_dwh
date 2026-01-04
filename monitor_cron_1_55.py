#!/usr/bin/env python3
"""
Monitor in tempo reale per il cron job delle 01:55
"""

import requests
import json
import time
from datetime import datetime

def monitor_cron_155():
    """Monitor per cron job 01:55"""
    
    print("🕐 MONITOR CRON JOB 01:55")
    print("=" * 60)
    
    target_time = "01:55"
    
    while True:
        now = datetime.now()
        current_time = now.strftime("%H:%M")
        
        print(f"\r🕐 Ora attuale: {current_time} | Target: {target_time}", end="", flush=True)
        
        # Se siamo alle 01:55 o poco dopo, inizia il monitoraggio intensivo
        if current_time >= "01:55" and current_time <= "02:05":
            print(f"\n\n🎯 ORARIO TARGET RAGGIUNTO: {current_time}")
            print("🔍 Inizio monitoraggio intensivo...")
            
            # Monitora per 10 minuti
            for i in range(20):  # 20 controlli ogni 30 secondi = 10 minuti
                try:
                    print(f"\n📋 Controllo {i+1}/20 - {datetime.now().strftime('%H:%M:%S')}")
                    
                    # Controlla i log più recenti
                    response = requests.get(
                        "https://import-convex-dwh.vercel.app/api/cron/check-scheduled-syncs",
                        timeout=10
                    )
                    
                    if response.status_code == 200:
                        data = response.json()
                        print(f"✅ API Health: {data.get('status')}")
                        
                        if data.get('apps'):
                            app = data['apps'][0]
                            print(f"📅 Schedule: {app.get('cron_schedule')}")
                            print(f"🔄 Enabled: {app.get('cron_enabled')}")
                    
                    # Controlla se ci sono nuovi job di sync
                    # (Questo richiederebbe l'API dei log, ma per ora monitoriamo solo lo stato)
                    
                    print("⏳ Attendo 30 secondi...")
                    time.sleep(30)
                    
                except Exception as e:
                    print(f"❌ Errore durante il controllo: {e}")
                    time.sleep(30)
            
            print(f"\n🏁 MONITORAGGIO COMPLETATO")
            print("📊 Risultati:")
            print("- Se hai visto nuovi job di sync: ✅ CRON FUNZIONA")
            print("- Se non hai visto nuovi job: ❌ Problema nel cron")
            print("\n🔍 Controlla manualmente i log su:")
            print("https://import-convex-dwh.vercel.app/logs")
            break
        
        # Se è troppo presto, aspetta
        elif current_time < "01:55":
            time.sleep(30)  # Controlla ogni 30 secondi
        
        # Se è troppo tardi, esci
        elif current_time > "02:05":
            print(f"\n\n⏰ ORARIO SCADUTO: {current_time}")
            print("Il cron job doveva partire alle 01:55")
            print("Controlla manualmente i log per vedere se è partito")
            break

if __name__ == "__main__":
    try:
        monitor_cron_155()
    except KeyboardInterrupt:
        print("\n\n🛑 Monitoraggio interrotto dall'utente")
    except Exception as e:
        print(f"\n\n💥 Errore nel monitoraggio: {e}")