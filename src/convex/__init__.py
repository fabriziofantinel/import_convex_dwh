"""
Convex client per scaricare backup.
"""

import subprocess
import zipfile
import json
import os
import tempfile
import time
from typing import Dict, List, Any, Optional, Callable
from datetime import datetime


class ConvexError(Exception):
    """Errore generico di Convex."""
    pass


def retry_with_backoff(
    func: Callable,
    max_attempts: int = 3,
    backoff_factor: float = 2.0,
    logger=None
) -> Any:
    """
    Esegue una funzione con retry e backoff esponenziale.
    
    Args:
        func: Funzione da eseguire
        max_attempts: Numero massimo di tentativi
        backoff_factor: Fattore di crescita del delay
        logger: Logger opzionale per registrare i retry
    
    Returns:
        Risultato della funzione
    
    Raises:
        Ultima eccezione se tutti i tentativi falliscono
    """
    last_exception = None
    
    for attempt in range(max_attempts):
        try:
            return func()
        except Exception as e:
            last_exception = e
            
            if attempt == max_attempts - 1:
                # Ultimo tentativo fallito
                raise
            
            # Calcola delay con backoff esponenziale
            delay = backoff_factor ** attempt
            
            if logger:
                logger.warning(
                    f"Retry {attempt + 1}/{max_attempts} after {delay}s - Error: {str(e)}"
                )
            
            time.sleep(delay)
    
    # Non dovrebbe mai arrivare qui, ma per sicurezza
    raise last_exception


class ConvexClient:
    """
    Client semplificato per scaricare backup da Convex.
    
    Usa il CLI di Convex (npx convex export) per scaricare i backup.
    """
    
    def __init__(self, deploy_key: str, logger=None):
        """
        Inizializza il client Convex.
        
        Args:
            deploy_key: Deploy key di Convex (formato: preview:team:project|token)
            logger: Logger opzionale per registrare le operazioni
        """
        self.deploy_key = deploy_key
        self.logger = logger
    
    def download_backup(self, output_path: Optional[str] = None, max_retries: int = 3) -> str:
        """
        Scarica un backup da Convex con retry automatico.
        
        Args:
            output_path: Path dove salvare il backup ZIP (default: temp file)
            max_retries: Numero massimo di tentativi (default: 3)
        
        Returns:
            Path del file ZIP scaricato
        
        Raises:
            ConvexError: Se il download fallisce dopo tutti i retry
        """
        def _download():
            # Usa un file temporaneo se non specificato
            nonlocal output_path
            if output_path is None:
                temp_dir = tempfile.gettempdir()
                output_path = os.path.join(
                    temp_dir, 
                    f"convex_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
                )
            
            # Imposta la variabile d'ambiente con la deploy key
            env = os.environ.copy()
            env['CONVEX_DEPLOY_KEY'] = self.deploy_key
            
            # Esegui il comando convex export
            result = subprocess.run(
                [r"C:\Program Files\nodejs\npx.cmd", "convex", "export", "--path", output_path],
                env=env,
                capture_output=True,
                text=True,
                timeout=300,  # 5 minuti
                shell=False  # Cambiato da True a False per sicurezza
            )
            
            # Parse l'output per estrarre informazioni sul backup
            snapshot_info = self._parse_export_output(result.stdout, result.stderr)
            
            # Log dell'output del comando (contiene info sul backup scaricato)
            if self.logger:
                if snapshot_info:
                    self.logger.info(f"Snapshot info: timestamp={snapshot_info.get('timestamp', 'N/A')}, url={snapshot_info.get('url', 'N/A')}")
                if result.stdout:
                    self.logger.info(f"Convex export output:\n{result.stdout}")
                if result.stderr:
                    self.logger.info(f"Convex export details:\n{result.stderr}")
            
            # Mostra info sul backup nella console
            if snapshot_info:
                timestamp_display = snapshot_info.get('timestamp_formatted', snapshot_info.get('timestamp', 'N/A'))
                print(f"  Snapshot created: {timestamp_display}")
                if snapshot_info.get('url'):
                    print(f"  Dashboard: {snapshot_info.get('url')}")
            
            if result.returncode != 0:
                raise ConvexError(
                    f"Errore durante il download del backup: {result.stderr}"
                )
            
            # Verifica che il file esista
            if not os.path.exists(output_path):
                raise ConvexError(f"File backup non trovato: {output_path}")
            
            return output_path
        
        # Usa retry con backoff
        try:
            return retry_with_backoff(_download, max_attempts=max_retries, logger=self.logger)
        except subprocess.TimeoutExpired:
            raise ConvexError("Timeout durante il download del backup (> 5 minuti)")
        except Exception as e:
            if isinstance(e, ConvexError):
                raise
            raise ConvexError(f"Errore durante il download: {str(e)}")
    
    def _parse_export_output(self, stdout: str, stderr: str) -> Dict[str, str]:
        """
        Parse l'output del comando convex export per estrarre informazioni sul backup.
        
        Args:
            stdout: Standard output del comando
            stderr: Standard error del comando
        
        Returns:
            Dizionario con informazioni sul backup (timestamp, url, etc.)
        """
        info = {}
        
        # Cerca timestamp nel stderr (formato: "Created snapshot export at timestamp 1766487443024722602")
        import re
        
        combined_output = stdout + "\n" + stderr
        
        # Cerca timestamp
        timestamp_match = re.search(r'timestamp\s+(\d+)', combined_output)
        if timestamp_match:
            timestamp_raw = timestamp_match.group(1)
            info['timestamp'] = timestamp_raw
            
            # Converti timestamp (sembra essere in nanosecondi)
            try:
                # Prova a convertire da nanosecondi a secondi
                timestamp_seconds = int(timestamp_raw) / 1_000_000_000
                dt = datetime.fromtimestamp(timestamp_seconds)
                info['timestamp_formatted'] = dt.strftime('%Y-%m-%d %H:%M:%S')
            except:
                info['timestamp_formatted'] = timestamp_raw
        
        # Cerca URL dashboard
        url_match = re.search(r'https://dashboard\.convex\.dev/[^\s]+', combined_output)
        if url_match:
            info['url'] = url_match.group(0)
        
        return info
    
    def extract_backup(self, zip_path: str, extract_dir: Optional[str] = None) -> Dict[str, List[Dict[str, Any]]]:
        """
        Estrae e legge i dati da un backup ZIP di Convex.
        
        Args:
            zip_path: Path del file ZIP del backup
            extract_dir: Directory dove estrarre (default: temp dir)
        
        Returns:
            Dizionario {table_name: [records]}
        
        Raises:
            ConvexError: Se l'estrazione fallisce
        """
        if extract_dir is None:
            extract_dir = tempfile.mkdtemp(prefix="convex_extract_")
        
        try:
            tables_data = {}
            
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                # Estrai tutto
                zip_ref.extractall(extract_dir)
                
                # Trova tutti i file documents.jsonl
                for filename in zip_ref.namelist():
                    if filename.endswith('/documents.jsonl'):
                        table_name = filename.split('/')[0]
                        
                        # Leggi i record
                        records = []
                        doc_path = os.path.join(extract_dir, filename)
                        
                        with open(doc_path, 'r', encoding='utf-8') as f:
                            for line in f:
                                if line.strip():
                                    records.append(json.loads(line))
                        
                        tables_data[table_name] = records
            
            return tables_data
            
        except Exception as e:
            raise ConvexError(f"Errore durante l'estrazione del backup: {str(e)}")
    
    def get_backup_data(self, table_filter: Optional[List[str]] = None) -> Dict[str, List[Dict[str, Any]]]:
        """
        Scarica ed estrae i dati da Convex in un'unica operazione.
        
        Args:
            table_filter: Lista di tabelle da estrarre (None = tutte le tabelle)
        
        Returns:
            Dizionario {table_name: [records]}
        
        Raises:
            ConvexError: Se l'operazione fallisce
        """
        # Scarica il backup (mostra automaticamente info sul snapshot)
        zip_path = self.download_backup()
        
        try:
            # Estrai i dati
            all_data = self.extract_backup(zip_path)
            
            # Filtra le tabelle se richiesto
            if table_filter is not None:
                filtered_data = {}
                for table_name in table_filter:
                    if table_name in all_data:
                        filtered_data[table_name] = all_data[table_name]
                    else:
                        # Tabella non trovata - log warning ma continua
                        print(f"⚠ Warning: Tabella '{table_name}' non trovata nel backup")
                
                return filtered_data
            
            return all_data
            
        finally:
            # Pulisci il file ZIP temporaneo
            if os.path.exists(zip_path):
                try:
                    os.remove(zip_path)
                except:
                    pass  # Ignora errori di pulizia


__all__ = ['ConvexClient', 'ConvexError', 'retry_with_backoff']
