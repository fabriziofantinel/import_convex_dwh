"""
Logging per il sync Convex to SQL Server.
"""

import os
import logging
from datetime import datetime
from typing import Dict, Any, Optional


class SyncLogger:
    """
    Logger per le operazioni di sync.
    
    Crea un file di log con timestamp per ogni esecuzione.
    """
    
    def __init__(self, log_dir: str, app_name: str):
        """
        Inizializza il logger.
        
        Args:
            log_dir: Directory dove salvare i log
            app_name: Nome dell'applicazione Convex
        """
        self.log_dir = log_dir
        self.app_name = app_name
        
        # Crea la directory se non esiste
        os.makedirs(log_dir, exist_ok=True)
        
        # Crea il nome del file di log con timestamp
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        log_filename = f"sync_{app_name}_{timestamp}.log"
        self.log_path = os.path.join(log_dir, log_filename)
        
        # Configura il logger
        self.logger = logging.getLogger(f"sync_{app_name}_{timestamp}")
        self.logger.setLevel(logging.DEBUG)
        
        # Handler per file
        file_handler = logging.FileHandler(self.log_path, encoding='utf-8')
        file_handler.setLevel(logging.DEBUG)
        
        # Handler per console
        console_handler = logging.StreamHandler()
        console_handler.setLevel(logging.INFO)
        
        # Formato log
        formatter = logging.Formatter(
            '[%(asctime)s] [%(levelname)s] %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        file_handler.setFormatter(formatter)
        console_handler.setFormatter(formatter)
        
        self.logger.addHandler(file_handler)
        self.logger.addHandler(console_handler)
    
    def info(self, message: str, **context):
        """Log messaggio informativo."""
        if context:
            message = f"{message} - {context}"
        self.logger.info(message)
    
    def warning(self, message: str, **context):
        """Log warning."""
        if context:
            message = f"{message} - {context}"
        self.logger.warning(message)
    
    def error(self, message: str, error: Optional[Exception] = None, **context):
        """Log errore con stack trace opzionale."""
        if error:
            message = f"{message}: {type(error).__name__}: {str(error)}"
        if context:
            message = f"{message} - {context}"
        self.logger.error(message, exc_info=error is not None)
    
    def log_execution_start(self, params: Dict[str, Any]):
        """Log inizio esecuzione con parametri."""
        self.info(f"Execution started - app: {self.app_name}, params: {params}")
    
    def log_execution_end(self, success: bool, duration: float, stats: Dict[str, Any]):
        """Log fine esecuzione con statistiche."""
        status = "success" if success else "failed"
        self.info(
            f"Execution completed - status: {status}, duration: {duration:.2f}s, stats: {stats}"
        )


__all__ = ['SyncLogger']
