#!/usr/bin/env python3
"""
Monitor per verificare se il fix del cron job funziona alle 02:05
"""

import time
from datetime import datetime

def monitor_cron_fix():
    print("🔧 MONITOR FIX CRON JOB - 02:05")
    print("=" * 50)
    print("Fix applicato:")
    print("- Conversione Roma → UTC nel cron checker")
    print("- Finestra di tolleranza ampliata a 10 minuti")
    print("- Vercel deployment completato")
    print()
    
    target_time = "02:05"
    
    while True:
        now = datetime.now()
        current_time = now.strftime("%H:%M")
        
        print(f"\r🕐 Ora attuale: {current_time} | Target: {target_time} | Fix attivo", end="", flush=True)
        
        if current_time >= "02:05" and current_time <= "02:15":
            print(f"\n\n🎯 ORARIO TARGET RAGGIUNTO: {current_time}")
            print("🔍 Il cron job dovrebbe partire ORA con il fix applicato!")
            print("📋 Controlla:")
            print("1. Webhook server logs (ProcessId 1)")
            print("2. App logs: https://import-convex-dwh.vercel.app/logs")
            print("3. Nuovo job di sync con timestamp 02:05-02:15")
            break
        elif current_time > "02:15":
            print(f"\n\n⏰ FINESTRA SCADUTA: {current_time}")
            print("Se il cron non è partito, il fix non ha funzionato")
            break
        
        time.sleep(10)

if __name__ == "__main__":
    monitor_cron_fix()