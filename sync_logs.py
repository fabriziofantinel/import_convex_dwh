#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Sync Logs Export Script

Script per esportare i log di sincronizzazione (sync_jobs) da Convex Dashboard a SQL Server DWH.
Eseguibile da linea di comando e schedulabile con Task Scheduler.

Uso:
    python sync_logs.py
    python sync_logs.py --days 30
"""

import sys
import io
import argparse
import time
import pyodbc
import requests
from datetime import datetime

# Fix encoding for Windows
if sys.platform == 'win32':
    try:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')
    except (AttributeError, io.UnsupportedOperation):
        pass

# Configurazione
CONVEX_URL = "https://blissful-schnauzer-295.convex.cloud"
SQL_CONNECTION = "Driver={SQL Server};Server=18.197.31.166;Database=DWH_LAKE;UID=sa;PWD=Prim0Gr0up21@;"
SQL_SCHEMA = "dbo"
TABLE_NAME = "convex_dashboard_sync_jobs"


def fetch_sync_jobs_from_convex(days=None):
    """
    Recupera i sync_jobs da Convex usando l'API HTTP
    
    Args:
        days: Numero di giorni da recuperare (None = tutti)
    
    Returns:
        Lista di sync_jobs
    """
    try:
        # Convex HTTP API per query
        url = f"{CONVEX_URL}/api/query"
        
        # Prepara i parametri
        args = {"limit": 1000}
        if days:
            from_date = int((datetime.now().timestamp() - days * 24 * 60 * 60) * 1000)
            args["from_date"] = from_date
        
        payload = {
            "path": "queries:getAllSyncJobs",
            "args": args,
            "format": "json"
        }
        
        headers = {
            "Content-Type": "application/json"
        }
        
        response = requests.post(url, json=payload, headers=headers, timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            if "value" in result:
                return result["value"]
            return result
        else:
            print(f"Error fetching from Convex: {response.status_code}")
            print(response.text)
            return []
            
    except Exception as e:
        print(f"Error connecting to Convex: {e}")
        return []


def fetch_sync_jobs_via_vercel():
    """
    Recupera i sync_jobs tramite l'API Vercel (alternativa)
    """
    try:
        url = "https://import-convex-dwh.vercel.app/api/get-all-sync-jobs"
        
        response = requests.get(url, timeout=30)
        
        if response.status_code == 200:
            return response.json()
        else:
            print(f"Error fetching from Vercel API: {response.status_code}")
            return []
            
    except Exception as e:
        print(f"Error connecting to Vercel API: {e}")
        return []


def create_table_if_not_exists(cursor):
    """
    Crea la tabella sync_jobs se non esiste
    """
    create_sql = f"""
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = '{TABLE_NAME}' AND schema_id = SCHEMA_ID('{SQL_SCHEMA}'))
    BEGIN
        CREATE TABLE [{SQL_SCHEMA}].[{TABLE_NAME}] (
            [_id] NVARCHAR(255) PRIMARY KEY,
            [app_id] NVARCHAR(255),
            [app_name] NVARCHAR(255),
            [status] NVARCHAR(50),
            [triggered_by] NVARCHAR(50),
            [started_at] DATETIME2,
            [completed_at] DATETIME2,
            [duration_seconds] INT,
            [tables_processed] INT,
            [rows_imported] INT,
            [error_message] NVARCHAR(MAX),
            [log_content] NVARCHAR(MAX),
            [_creationTime] DATETIME2,
            [sync_timestamp] DATETIME2 DEFAULT GETDATE()
        )
    END
    """
    cursor.execute(create_sql)
    cursor.commit()


def convert_timestamp(ts):
    """
    Converte timestamp Convex (millisecondi) in datetime
    """
    if ts is None:
        return None
    try:
        return datetime.fromtimestamp(ts / 1000)
    except:
        return None


def import_sync_jobs(jobs, cursor):
    """
    Importa i sync_jobs in SQL Server (MERGE - upsert)
    """
    if not jobs:
        return 0
    
    imported = 0
    
    for job in jobs:
        try:
            # Prepara i valori
            _id = job.get('_id', '')
            app_id = job.get('app_id', '')
            app_name = job.get('app_name', '')
            status = job.get('status', '')
            triggered_by = job.get('triggered_by', 'manual')
            started_at = convert_timestamp(job.get('started_at'))
            completed_at = convert_timestamp(job.get('completed_at'))
            duration_seconds = job.get('duration_seconds')
            tables_processed = job.get('tables_processed')
            rows_imported = job.get('rows_imported')
            error_message = job.get('error_message', '')
            log_content = job.get('log_content', '')
            creation_time = convert_timestamp(job.get('_creationTime'))
            
            # MERGE (upsert)
            merge_sql = f"""
            MERGE [{SQL_SCHEMA}].[{TABLE_NAME}] AS target
            USING (SELECT ? AS _id) AS source
            ON target._id = source._id
            WHEN MATCHED THEN
                UPDATE SET
                    app_id = ?,
                    app_name = ?,
                    status = ?,
                    triggered_by = ?,
                    started_at = ?,
                    completed_at = ?,
                    duration_seconds = ?,
                    tables_processed = ?,
                    rows_imported = ?,
                    error_message = ?,
                    log_content = ?,
                    _creationTime = ?,
                    sync_timestamp = GETDATE()
            WHEN NOT MATCHED THEN
                INSERT (_id, app_id, app_name, status, triggered_by, started_at, completed_at, 
                        duration_seconds, tables_processed, rows_imported, error_message, log_content, _creationTime)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
            """
            
            cursor.execute(merge_sql, (
                # Source
                _id,
                # Update values
                app_id, app_name, status, triggered_by, started_at, completed_at,
                duration_seconds, tables_processed, rows_imported, error_message, log_content, creation_time,
                # Insert values
                _id, app_id, app_name, status, triggered_by, started_at, completed_at,
                duration_seconds, tables_processed, rows_imported, error_message, log_content, creation_time
            ))
            
            imported += 1
            
        except Exception as e:
            print(f"  Error importing job {job.get('_id', 'unknown')}: {e}")
    
    cursor.commit()
    return imported


def main():
    """Entry point principale"""
    parser = argparse.ArgumentParser(description='Export sync logs from Convex to SQL Server')
    parser.add_argument('--days', type=int, default=None, help='Number of days to export (default: all)')
    args = parser.parse_args()
    
    start_time = time.time()
    
    print(f"\n{'='*70}")
    print("SYNC LOGS EXPORT - Convex Dashboard → SQL Server")
    print(f"{'='*70}")
    print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Days filter: {args.days or 'All'}")
    print(f"{'='*70}\n")
    
    # 1. Fetch sync_jobs da Convex
    print("Fetching sync jobs from Convex...")
    jobs = fetch_sync_jobs_from_convex(args.days)
    
    if not jobs:
        print("  Trying alternative method via Vercel API...")
        jobs = fetch_sync_jobs_via_vercel()
    
    if not jobs:
        print("✗ No sync jobs found or error fetching data")
        return 1
    
    print(f"✓ Found {len(jobs)} sync jobs\n")
    
    # 2. Connect to SQL Server
    print("Connecting to SQL Server...")
    try:
        conn = pyodbc.connect(SQL_CONNECTION, timeout=30)
        cursor = conn.cursor()
        print("✓ Connected to SQL Server\n")
    except Exception as e:
        print(f"✗ Error connecting to SQL Server: {e}")
        return 1
    
    # 3. Create table if not exists
    print("Checking/creating table...")
    try:
        create_table_if_not_exists(cursor)
        print(f"✓ Table [{SQL_SCHEMA}].[{TABLE_NAME}] ready\n")
    except Exception as e:
        print(f"✗ Error creating table: {e}")
        conn.close()
        return 1
    
    # 4. Import sync_jobs
    print("Importing sync jobs...")
    try:
        imported = import_sync_jobs(jobs, cursor)
        print(f"✓ Imported/updated {imported} sync jobs\n")
    except Exception as e:
        print(f"✗ Error importing: {e}")
        conn.close()
        return 1
    
    # 5. Close connection
    conn.close()
    
    # Summary
    duration = time.time() - start_time
    print(f"{'='*70}")
    print("SUMMARY")
    print(f"{'='*70}")
    print(f"Sync jobs processed: {len(jobs)}")
    print(f"Sync jobs imported: {imported}")
    print(f"Duration: {duration:.2f}s")
    print(f"{'='*70}\n")
    
    return 0


if __name__ == '__main__':
    sys.exit(main())
