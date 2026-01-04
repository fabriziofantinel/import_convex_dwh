#!/usr/bin/env python3
"""
Scheduler autonomo che sostituisce il cron di Vercel
Esegue il sync all'orario impostato senza dipendere da Vercel
"""

import schedule
import time
import requests
import json
from datetime import datetime
from dotenv import load_dotenv
import os
import threading

load_dotenv()

class SyncScheduler:
    def __init__(self):
        self.app_api_url = "https://import-convex-dwh.vercel.app/api/cron/check-scheduled-syncs"
        self.trigger_url = "https://import-convex-dwh.vercel.app/api/cron/app1"
        self.current_schedule = None
        self.running = True
        
    def get_current_schedule(self):
        """Ottiene l'orario attuale dall'app"""
        try:
            response = requests.get(self.app_api_url, timeout=10)
            if response.status_code == 200:
                data = response.json()
                if data.get('apps') and len(data['apps']) > 0:
                    cron_schedule = data['apps'][0].get('cron_schedule')
                    enabled = data['apps'][0].get('cron_enabled')
                    return cron_schedule, enabled
        except Exception as e:
            print(f"Errore nel recuperare schedule: {e}")
        return None, False
    
    def parse_cron_to_time(self, cron_schedule):
        """Converte cron schedule in orario (es: '30 14 * * *' -> '14:30')"""
        try:
            parts = cron_schedule.split(' ')
            if len(parts) >= 2:
                minute = parts[0]
                hour = parts[1]
                # Assicurati che siano numeri validi e formatta con zero padding
                minute_int = int(minute)
                hour_int = int(hour)
                return f"{hour_int:02d}:{minute_int:02d}"
        except Exception as e:
            print(f"Errore parsing cron '{cron_schedule}': {e}")
        return None
    
    def trigger_sync(self):
        """Triggera il sync via webhook seguendo il pattern dell'app"""
        print(f"🚀 {datetime.now().strftime('%H:%M:%S')} - Triggering sync...")
        
        try:
            # Step 1: Crea il job in Convex tramite l'API di Vercel
            prepare_url = "https://import-convex-dwh.vercel.app/api/cron/app1"
            prepare_headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {os.getenv('CRON_SECRET', 'e2a34dab6d5c92a02aa2adf4e041529330ba8afc1114d5132a919660e1832ddd')}"
            }
            
            prepare_response = requests.post(
                prepare_url,
                headers=prepare_headers,
                timeout=30
            )
            
            if prepare_response.status_code != 200:
                print(f"❌ Errore nella preparazione job: {prepare_response.status_code} - {prepare_response.text}")
                return
            
            job_data = prepare_response.json()
            if not job_data.get('success'):
                print(f"❌ Preparazione job fallita: {job_data.get('error', 'Errore sconosciuto')}")
                return
            
            print(f"✅ Job creato in Convex: {job_data.get('job_id')}")
            
            # Step 2: Triggera il webhook con il job_id reale
            webhook_headers = {
                "Content-Type": "application/json",
                "Authorization": "Bearer test-token-12345",
                "ngrok-skip-browser-warning": "true"
            }
            
            webhook_payload = {
                "job_id": job_data.get('job_id'),
                "app_name": job_data.get('app_name', 'app1'),
                "deploy_key": job_data.get('deploy_key'),
                "tables": job_data.get('tables'),
                "table_mapping": job_data.get('table_mapping')
            }
            
            webhook_response = requests.post(
                self.webhook_url,
                json=webhook_payload,
                headers=webhook_headers,
                timeout=30
            )
            
            if webhook_response.status_code in [200, 202]:
                result = webhook_response.json()
                if result.get('success'):
                    print(f"✅ Sync avviato con successo! Job ID: {result.get('job_id', 'N/A')}")
                else:
                    print(f"❌ Sync fallito: {result.get('error', 'Errore sconosciuto')}")
            else:
                print(f"❌ Errore HTTP webhook: {webhook_response.status_code} - {webhook_response.text[:100]}")
                
        except Exception as e:
            print(f"💥 Errore nel trigger sync: {e}")
    
    def update_schedule(self):
        """Aggiorna la schedulazione se è cambiata"""
        cron_schedule, enabled = self.get_current_schedule()
        
        if not enabled:
            if self.current_schedule:
                print("🔄 Schedulazione disabilitata - rimuovo job")
                schedule.clear()
                self.current_schedule = None
            return
        
        if cron_schedule != self.current_schedule:
            print(f"🔄 Aggiorno schedulazione: {self.current_schedule} -> {cron_schedule}")
            
            # Rimuovi vecchia schedulazione
            schedule.clear()
            
            # Aggiungi nuova schedulazione
            time_str = self.parse_cron_to_time(cron_schedule)
            if time_str:
                schedule.every().day.at(time_str).do(self.trigger_sync)
                self.current_schedule = cron_schedule
                print(f"✅ Schedulazione impostata per le {time_str} ogni giorno")
            else:
                print(f"❌ Formato cron non valido: {cron_schedule}")
    
    def run(self):
        """Esegue il scheduler"""
        print("🕐 Avvio Sync Scheduler Autonomo")
        print("=" * 50)
        
        while self.running:
            try:
                # Aggiorna schedulazione ogni minuto
                self.update_schedule()
                
                # Esegue job schedulati
                schedule.run_pending()
                
                # Mostra stato ogni 30 secondi
                if datetime.now().second % 30 == 0:
                    jobs = schedule.get_jobs()
                    if jobs:
                        next_run = jobs[0].next_run
                        print(f"⏰ {datetime.now().strftime('%H:%M:%S')} - Prossimo sync: {next_run.strftime('%H:%M:%S')}")
                    else:
                        print(f"⏰ {datetime.now().strftime('%H:%M:%S')} - Nessuna schedulazione attiva")
                
                time.sleep(1)
                
            except KeyboardInterrupt:
                print("\n🛑 Scheduler fermato dall'utente")
                self.running = False
            except Exception as e:
                print(f"💥 Errore scheduler: {e}")
                time.sleep(5)

if __name__ == "__main__":
    scheduler = SyncScheduler()
    scheduler.run()