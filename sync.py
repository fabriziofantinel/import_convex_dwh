#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Convex to SQL Server Sync Script

Script per sincronizzare dati da Convex a SQL Server.
Eseguibile da linea di comando e schedulabile con Task Manager.
"""

import sys
import io
import argparse
import time
import traceback
import requests
import json as json_module
from datetime import datetime
from pathlib import Path

# Fix encoding for Windows when run from subprocess
# This prevents UnicodeEncodeError with special characters (✓, ✗)
if sys.platform == 'win32':
    try:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')
    except (AttributeError, io.UnsupportedOperation):
        # If stdout/stderr don't have buffer attribute, skip
        pass

from src.config import ConfigurationManager, ConfigurationError
from src.convex import ConvexClient
from src.export import DataExporter
from src.sql import SQLImporter, TypeMapper, ImportResult
from src.logging import SyncLogger
from src.notifications import EmailNotifier


# Exit codes
EXIT_SUCCESS = 0
EXIT_CONFIG_ERROR = 1
EXIT_AUTH_ERROR = 2
EXIT_NETWORK_ERROR = 3
EXIT_DATA_ERROR = 4
EXIT_IMPORT_ERROR = 5


def get_app_config_from_convex(app_name, webhook_url="http://localhost:5000", webhook_token="test-token-12345"):
    """
    Ottiene la configurazione dell'app da Convex tramite il webhook server
    
    Args:
        app_name: Nome dell'app
        webhook_url: URL del webhook server
        webhook_token: Token di autenticazione
    
    Returns:
        Dict con la configurazione dell'app o None se non trovata
    """
    try:
        url = f"{webhook_url}/api/get-app-config/{app_name}"
        headers = {
            'Authorization': f'Bearer {webhook_token}',
            'Content-Type': 'application/json'
        }
        
        response = requests.get(url, headers=headers, timeout=10)
        
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                return result.get('config')
        
        return None
        
    except Exception as e:
        print(f"Warning: Could not get config from Convex: {e}")
        return None


def parse_arguments():
    """
    Parse argomenti da linea di comando
    
    Returns:
        Namespace con argomenti parsed
    """
    parser = argparse.ArgumentParser(
        description='Sync data from Convex to SQL Server',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python sync.py appclinics
  python sync.py appclinics --config custom_config.json
  python sync.py appclinics --config config.json --log-dir ./logs

Exit Codes:
  0 - Success
  1 - Configuration error
  2 - Authentication error
  3 - Network error
  4 - Data error
  5 - Import error
        """
    )
    
    parser.add_argument(
        'app_name',
        type=str,
        help='Nome dell\'applicazione Convex da sincronizzare'
    )
    
    parser.add_argument(
        '--config',
        type=str,
        default='config.json',
        help='Path al file di configurazione (default: config.json)'
    )
    
    parser.add_argument(
        '--log-dir',
        type=str,
        default=None,
        help='Directory per i log (override configurazione)'
    )
    
    return parser.parse_args()


def main():
    """
    Entry point principale dello script
    
    Returns:
        Exit code
    """
    start_time = time.time()
    args = parse_arguments()
    
    logger = None
    
    try:
        # 1. Carica configurazione
        print(f"\n{'='*70}")
        print(f"CONVEX TO SQL SERVER SYNC")
        print(f"{'='*70}")
        print(f"App: {args.app_name}")
        print(f"Config: {args.config}")
        print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"{'='*70}\n")
        
        config_manager = ConfigurationManager()
        
        try:
            config = config_manager.load_config(args.config)
        except ConfigurationError as e:
            print(f"✗ Configuration Error: {e}")
            return EXIT_CONFIG_ERROR
        
        # Try to get app configuration from Convex first, fallback to JSON
        print(f"Fetching app configuration from Convex...")
        convex_app_config = get_app_config_from_convex(args.app_name)
        
        if convex_app_config:
            print(f"✓ App configuration loaded from Convex")
            print(f"  - Tables: {convex_app_config.get('tables', [])}")
            print(f"  - Deploy key: {convex_app_config.get('deploy_key', '')[:20]}...")
            
            # Create ConvexConfig from Convex data
            from src.config import ConvexConfig
            convex_config = ConvexConfig(
                app_name=convex_app_config['name'],
                deploy_key=convex_app_config['deploy_key'],
                tables=convex_app_config.get('tables'),
                table_mapping=convex_app_config.get('table_mapping')
            )
        else:
            print(f"⚠ Could not load from Convex, falling back to JSON config...")
            try:
                convex_config = config_manager.get_convex_config(args.app_name)
                print(f"✓ App configuration loaded from JSON fallback")
            except ConfigurationError as e:
                print(f"✗ App '{args.app_name}' not found in JSON config either")
                return EXIT_CONFIG_ERROR
        
        sql_config = config_manager.get_sql_config()
        email_config = config_manager.get_email_config()
        
        # Override log_dir se specificato
        log_dir = args.log_dir if args.log_dir else config.log_dir
        
        print(f"✓ Configuration loaded")
        print(f"  - Tables: {convex_config.tables or 'all'}")
        print(f"  - SQL Schema: {sql_config.schema}")
        print(f"  - Log Dir: {log_dir}")
        
        # DEBUG: Stampa configurazione dettagliata
        print(f"\nDEBUG - App configuration:")
        print(f"  - App name: {args.app_name}")
        print(f"  - Configured tables: {convex_config.tables}")
        print(f"  - Deploy key: {convex_config.deploy_key[:20]}...")
        print()
        
        # 2. Inizializza logger
        logger = SyncLogger(log_dir, args.app_name)
        logger.log_execution_start({
            'app_name': args.app_name,
            'tables': convex_config.tables or 'all',
            'config_file': args.config
        })
        
        # 3. Inizializza email notifier
        email_notifier = EmailNotifier(email_config, logger)
        
        # 3. Download backup da Convex
        print("Downloading backup from Convex...")
        convex_client = ConvexClient(convex_config.deploy_key, logger=logger)
        
        try:
            backup_data = convex_client.get_backup_data(convex_config.tables)
            total_rows = sum(len(rows) for rows in backup_data.values())
            
            print(f"✓ Backup downloaded")
            print(f"  - Tables: {len(backup_data)}")
            print(f"  - Total rows: {total_rows}\n")
            
            logger.info(f"Backup downloaded - tables: {len(backup_data)}, rows: {total_rows}")
            
        except Exception as e:
            logger.error(f"Failed to download backup", error=e)
            print(f"✗ Error downloading backup: {str(e)}\n")
            
            # Invia notifica email
            email_notifier.send_error_notification(
                app_name=args.app_name,
                error_type="Convex Export Error",
                error_message=str(e),
                stack_trace=traceback.format_exc()
            )
            
            return EXIT_NETWORK_ERROR
        
        # 4. Connessione SQL Server
        print("Connecting to SQL Server...")
        sql_importer = SQLImporter(
            connection_string=sql_config.connection_string,
            schema=sql_config.schema,
            timeout=sql_config.timeout
        )
        
        try:
            sql_importer.connect()
            print(f"✓ Connected to SQL Server")
            print(f"  - Schema: {sql_config.schema}\n")
            
            logger.info("Connected to SQL Server")
            
        except Exception as e:
            logger.error(f"Failed to connect to SQL Server", error=e)
            print(f"✗ Error connecting to SQL Server: {str(e)}\n")
            
            # Invia notifica email
            email_notifier.send_error_notification(
                app_name=args.app_name,
                error_type="SQL Server Connection Error",
                error_message=str(e),
                stack_trace=traceback.format_exc()
            )
            
            return EXIT_NETWORK_ERROR
        
        # 5. Import tabelle
        print("Importing tables...")
        type_mapper = TypeMapper()
        results = []
        
        from src.export import TableData
        
        # Check for tables that exist in Convex but are empty
        configured_tables = convex_config.tables
        if configured_tables:  # Solo se ci sono tabelle configurate
            for table_name in configured_tables:
                if table_name not in backup_data:
                    print(f"  Adding empty '{table_name}' table (configured but not in backup)...")
                    backup_data[table_name] = []  # Tabella vuota
        
        for table_name, rows in backup_data.items():
            # Ottieni nome tabella SQL dal mapping
            sql_table_name = convex_config.get_sql_table_name(table_name)
            
            if not rows:
                # Tabella vuota: crea tabella con schema di base se non esiste
                logger.info(f"Table {table_name} is empty - creating empty table with basic schema")
                
                table_exists = sql_importer.table_exists(sql_table_name)
                
                if not table_exists:
                    print(f"  - {table_name} → {sql_table_name} (create empty)...", end=' ')
                    
                    # Crea tabella vuota con schema di base Convex
                    basic_columns = ['_id', '_creationTime']  # Colonne standard Convex
                    sql_importer.create_table(sql_table_name, basic_columns)
                    
                    print("✓")
                    logger.info(f"Created empty table {sql_table_name} with basic schema")
                    
                    results.append(ImportResult(
                        table_name=table_name,
                        success=True,
                        rows_imported=0,
                        error=None,
                        duration_seconds=0.0
                    ))
                else:
                    print(f"  - {table_name} → {sql_table_name} (exists, empty)...", end=' ')
                    
                    # Tabella esiste ma è vuota: truncate per sicurezza
                    sql_importer.truncate_table(sql_table_name)
                    
                    print("✓")
                    logger.info(f"Table {sql_table_name} exists but source is empty - truncated")
                    
                    results.append(ImportResult(
                        table_name=table_name,
                        success=True,
                        rows_imported=0,
                        error=None,
                        duration_seconds=0.0
                    ))
                
                continue
            
            # Verifica se tabella esiste
            table_exists = sql_importer.table_exists(sql_table_name)
            
            if table_exists:
                print(f"  - {table_name} → {sql_table_name} (truncate + insert)...", end=' ')
                logger.info(f"Truncating table {sql_table_name} before import")
            else:
                print(f"  - {table_name} → {sql_table_name} (create + insert)...", end=' ')
                logger.info(f"Creating table {sql_table_name}")
            
            # Import con auto-create
            result = sql_importer.import_table(
                table_name=sql_table_name,
                rows=rows,
                type_mapper=type_mapper,
                auto_create=True
            )
            
            results.append(result)
            
            if result.success:
                print(f"✓ {result.rows_imported} rows ({result.duration_seconds:.2f}s)")
                logger.info(
                    f"Imported table {table_name} → {sql_table_name}",
                    rows=result.rows_imported,
                    duration=f"{result.duration_seconds:.2f}s"
                )
            else:
                print(f"✗ Error: {result.error}")
                logger.error(f"Failed to import table {table_name} → {sql_table_name}: {result.error}")
        
        # 6. Chiudi connessione
        sql_importer.close()
        
        # 7. Summary
        success_count = sum(1 for r in results if r.success)
        failed_count = len(results) - success_count
        total_rows_imported = sum(r.rows_imported for r in results)
        duration = time.time() - start_time
        
        print(f"\n{'='*70}")
        print("SUMMARY")
        print(f"{'='*70}")
        print(f"Tables processed: {len(results)}")
        print(f"  ✓ Success: {success_count}")
        print(f"  ✗ Failed: {failed_count}")
        print(f"Total rows imported: {total_rows_imported}")
        print(f"Duration: {duration:.2f}s")
        print(f"Log file: {logger.log_path}")
        print(f"{'='*70}\n")
        
        logger.log_execution_end(
            success=failed_count == 0,
            duration=duration,
            stats={
                'tables_processed': len(results),
                'tables_success': success_count,
                'tables_failed': failed_count,
                'total_rows': total_rows_imported
            }
        )
        
        # Return exit code
        if failed_count > 0:
            # Invia notifica email per import parziale
            failed_tables = [r.table_name for r in results if not r.success]
            email_notifier.send_error_notification(
                app_name=args.app_name,
                error_type="Partial Import Failure",
                error_message=f"Failed to import {failed_count} table(s): {', '.join(failed_tables)}",
                stack_trace=None
            )
            return EXIT_IMPORT_ERROR
        
        return EXIT_SUCCESS
        
    except ConfigurationError as e:
        if logger:
            logger.error(f"Configuration error: {str(e)}")
        print(f"\n✗ Configuration Error: {e}\n")
        return EXIT_CONFIG_ERROR
        
    except KeyboardInterrupt:
        if logger:
            logger.warning("Execution interrupted by user")
        print(f"\n\n✗ Interrupted by user\n")
        return EXIT_NETWORK_ERROR
        
    except Exception as e:
        if logger:
            logger.error(f"Unexpected error", error=e)
        print(f"\n✗ Unexpected Error: {str(e)}\n")
        import traceback
        traceback.print_exc()
        return EXIT_DATA_ERROR


if __name__ == '__main__':
    sys.exit(main())
