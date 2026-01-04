"""
Scheduled Sync Runner - Windows Task Scheduler Script
Interroga il dashboard per le app schedulate e le esegue

Questo script è progettato per essere eseguito dal Task Scheduler di Windows
ogni 15 minuti. Controlla quali app devono essere sincronizzate in base
alla loro schedulazione e le esegue.
"""

import os
import sys
import requests
import time
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration
DASHBOARD_URL = os.getenv('DASHBOARD_URL', 'https://import-convex-dwh.vercel.app')
WEBHOOK_TOKEN = os.getenv('WEBHOOK_TOKEN', 'test-token-12345')

# Log file
LOG_FILE = 'logs/scheduled_sync_runner.log'


def log(message):
    """Log message to console and file"""
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    log_message = f"[{timestamp}] {message}"
    print(log_message)
    
    # Ensure logs directory exists
    os.makedirs('logs', exist_ok=True)
    
    # Write to log file
    try:
        with open(LOG_FILE, 'a', encoding='utf-8') as f:
            f.write(log_message + '\n')
    except Exception as e:
        print(f"Error writing to log file: {e}")


def get_scheduled_apps():
    """
    Interroga il dashboard per ottenere le app schedulate
    
    Returns:
        list: Lista di app con schedulazione attiva
    """
    try:
        log("Checking for scheduled apps...")
        
        url = f"{DASHBOARD_URL}/api/cron/check-scheduled-syncs"
        
        response = requests.get(
            url,
            timeout=30
        )
        
        if response.status_code != 200:
            log(f"Error getting scheduled apps: HTTP {response.status_code}")
            log(f"Response: {response.text}")
            return []
        
        data = response.json()
        
        if not data.get('apps'):
            log("No scheduled apps found")
            return []
        
        apps = data['apps']
        log(f"Found {len(apps)} scheduled apps")
        
        return apps
    
    except Exception as e:
        log(f"Error getting scheduled apps: {e}")
        return []


def should_run_now(cron_schedule):
    """
    Verifica se l'app deve essere eseguita ora in base al cron schedule
    
    Args:
        cron_schedule: Stringa cron (es: "45 12 * * *")
    
    Returns:
        bool: True se deve essere eseguita ora
    """
    try:
        # Parse cron expression (minute hour day month weekday)
        parts = cron_schedule.split()
        if len(parts) != 5:
            log(f"Invalid cron format: {cron_schedule}")
            return False
        
        minute_cron = parts[0]
        hour_cron = parts[1]
        
        # Get current time
        now = datetime.now()
        current_hour = now.hour
        current_minute = now.minute
        
        # Check if current time matches cron schedule
        # Support for specific values (not wildcards for now)
        if minute_cron != '*' and hour_cron != '*':
            target_minute = int(minute_cron)
            target_hour = int(hour_cron)
            
            # Allow 15-minute window (since Task Scheduler runs every 15 min)
            time_diff = abs((current_hour * 60 + current_minute) - (target_hour * 60 + target_minute))
            
            if time_diff <= 15:
                log(f"Schedule match: {cron_schedule} matches current time {current_hour}:{current_minute:02d}")
                return True
            else:
                log(f"Schedule mismatch: {cron_schedule} vs current time {current_hour}:{current_minute:02d} (diff: {time_diff} min)")
                return False
        
        return False
    
    except Exception as e:
        log(f"Error checking schedule: {e}")
        return False


def trigger_sync(app_name, app_id):
    """
    Trigger sync for an app via dashboard API
    
    Args:
        app_name: Nome dell'app
        app_id: ID dell'app in Convex
    
    Returns:
        bool: True se il sync è stato avviato con successo
    """
    try:
        log(f"Triggering sync for app: {app_name}")
        
        url = f"{DASHBOARD_URL}/api/proxy-trigger-sync"
        
        payload = {
            'app_id': app_id,
            'triggered_by': 'scheduled'
        }
        
        response = requests.post(
            url,
            json=payload,
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                job_id = data.get('job_id')
                log(f"✓ Sync started successfully for {app_name} (job_id: {job_id})")
                return True
            else:
                error = data.get('error', 'Unknown error')
                log(f"✗ Failed to start sync for {app_name}: {error}")
                return False
        else:
            log(f"✗ Failed to start sync for {app_name}: HTTP {response.status_code}")
            log(f"Response: {response.text}")
            return False
    
    except Exception as e:
        log(f"✗ Error triggering sync for {app_name}: {e}")
        return False


def main():
    """Main execution function"""
    log("=" * 70)
    log("SCHEDULED SYNC RUNNER - START")
    log("=" * 70)
    
    # Get scheduled apps from dashboard
    apps = get_scheduled_apps()
    
    if not apps:
        log("No apps to process")
        log("=" * 70)
        return 0
    
    # Process each app
    triggered_count = 0
    skipped_count = 0
    
    for app in apps:
        app_name = app.get('name')
        app_id = app.get('_id')
        cron_schedule = app.get('cron_schedule')
        cron_enabled = app.get('cron_enabled', False)
        
        if not cron_enabled:
            log(f"Skipping {app_name}: cron not enabled")
            skipped_count += 1
            continue
        
        if not cron_schedule:
            log(f"Skipping {app_name}: no cron schedule defined")
            skipped_count += 1
            continue
        
        log(f"Checking app: {app_name} (schedule: {cron_schedule})")
        
        # Check if should run now
        if should_run_now(cron_schedule):
            if trigger_sync(app_name, app_id):
                triggered_count += 1
            else:
                skipped_count += 1
        else:
            log(f"Skipping {app_name}: not time to run")
            skipped_count += 1
    
    log("-" * 70)
    log(f"Summary: {triggered_count} syncs triggered, {skipped_count} skipped")
    log("=" * 70)
    
    return 0


if __name__ == '__main__':
    try:
        exit_code = main()
        sys.exit(exit_code)
    except Exception as e:
        log(f"FATAL ERROR: {e}")
        import traceback
        log(traceback.format_exc())
        sys.exit(1)
