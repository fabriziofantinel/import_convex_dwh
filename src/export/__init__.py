"""
Data exporter per filtrare e validare dati da Convex.
"""

from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass


@dataclass
class TableData:
    """Dati di una tabella."""
    name: str
    rows: List[Dict[str, Any]]
    row_count: int


class DataExporter:
    """
    Esporta e filtra dati da Convex.
    """
    
    def __init__(self, logger=None):
        """
        Inizializza l'exporter.
        
        Args:
            logger: Logger opzionale
        """
        self.logger = logger
    
    def export_tables(
        self,
        backup_data: Dict[str, List[Dict[str, Any]]],
        table_filter: Optional[List[str]] = None
    ) -> Dict[str, TableData]:
        """
        Esporta tabelle dal backup con filtro opzionale.
        
        Args:
            backup_data: Dati del backup {table_name: [records]}
            table_filter: Lista tabelle da esportare (None = tutte)
        
        Returns:
            Dizionario {table_name: TableData}
        """
        result = {}
        
        # Se non c'è filtro, esporta tutto
        if table_filter is None:
            for table_name, rows in backup_data.items():
                result[table_name] = TableData(
                    name=table_name,
                    rows=rows,
                    row_count=len(rows)
                )
            return result
        
        # Valida ed esporta solo le tabelle richieste
        valid_tables, missing_tables = self.validate_tables(backup_data, table_filter)
        
        # Log warning per tabelle mancanti
        for table_name in missing_tables:
            if self.logger:
                self.logger.warning(f"Tabella '{table_name}' non trovata nel backup")
        
        # Esporta solo le tabelle valide
        for table_name in valid_tables:
            rows = backup_data[table_name]
            result[table_name] = TableData(
                name=table_name,
                rows=rows,
                row_count=len(rows)
            )
        
        return result
    
    def validate_tables(
        self,
        backup_data: Dict[str, List[Dict[str, Any]]],
        requested_tables: List[str]
    ) -> Tuple[List[str], List[str]]:
        """
        Valida esistenza tabelle richieste.
        
        Args:
            backup_data: Dati del backup
            requested_tables: Tabelle richieste
        
        Returns:
            (tabelle_valide, tabelle_mancanti)
        """
        available_tables = set(backup_data.keys())
        requested_set = set(requested_tables)
        
        valid_tables = list(requested_set & available_tables)
        missing_tables = list(requested_set - available_tables)
        
        return valid_tables, missing_tables


__all__ = ['DataExporter', 'TableData']
