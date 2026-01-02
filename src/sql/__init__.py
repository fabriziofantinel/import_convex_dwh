"""
SQL Module - Type Mapper and SQL Server utilities
"""
import json
import time
import pyodbc
from typing import Any, Dict, Optional, List
from dataclasses import dataclass
from datetime import datetime


class TypeMapper:
    """
    Mappa tipi di dati Convex a tipi SQL Server e converte valori
    """
    
    # Mappatura tipi Convex -> SQL Server
    TYPE_MAPPING = {
        'string': 'NVARCHAR(MAX)',
        'number': 'FLOAT',
        'boolean': 'BIT',
        'null': 'NULL',
        'id': 'NVARCHAR(50)',
        'array': 'NVARCHAR(MAX)',  # Serializzato come JSON
        'object': 'NVARCHAR(MAX)',  # Serializzato come JSON
    }
    
    def map_convex_to_sql(self, convex_type: str) -> str:
        """
        Mappa tipo Convex a tipo SQL Server
        
        Args:
            convex_type: Tipo di dato Convex
            
        Returns:
            Tipo SQL Server corrispondente
            
        Raises:
            ValueError: Se il tipo Convex non è supportato
        """
        if convex_type not in self.TYPE_MAPPING:
            raise ValueError(f"Unsupported Convex type: {convex_type}")
        
        return self.TYPE_MAPPING[convex_type]
    
    def convert_value(self, value: Any, convex_type: str) -> Any:
        """
        Converte valore da formato Convex a formato SQL Server
        
        Args:
            value: Valore da convertire
            convex_type: Tipo Convex del valore
            
        Returns:
            Valore convertito per SQL Server
        """
        # Gestione valori null
        if value is None:
            return None
        
        # Conversione basata sul tipo
        if convex_type == 'string':
            return str(value)
        
        elif convex_type == 'number':
            return float(value)
        
        elif convex_type == 'boolean':
            return bool(value)
        
        elif convex_type == 'id':
            return str(value)
        
        elif convex_type == 'array':
            # Serializza array come JSON
            return json.dumps(value)
        
        elif convex_type == 'object':
            # Serializza object come JSON
            return json.dumps(value)
        
        elif convex_type == 'null':
            return None
        
        else:
            raise ValueError(f"Unsupported Convex type: {convex_type}")
    
    def infer_convex_type(self, value: Any) -> str:
        """
        Inferisce il tipo Convex da un valore Python
        
        Args:
            value: Valore da cui inferire il tipo
            
        Returns:
            Tipo Convex inferito
        """
        if value is None:
            return 'null'
        
        if isinstance(value, bool):
            return 'boolean'
        
        if isinstance(value, (int, float)):
            return 'number'
        
        if isinstance(value, str):
            # Distingui tra id e string (id tipicamente hanno formato specifico)
            if len(value) == 16 and value.isalnum():
                return 'id'
            return 'string'
        
        if isinstance(value, list):
            return 'array'
        
        if isinstance(value, dict):
            return 'object'
        
        # Default a string per tipi sconosciuti
        return 'string'
    
    def get_table_schema_sql(self, table_name: str, schema: Dict[str, str]) -> str:
        """
        Genera SQL CREATE TABLE per una tabella Convex
        
        Args:
            table_name: Nome della tabella
            schema: Dizionario column_name -> convex_type
            
        Returns:
            Statement SQL CREATE TABLE
        """
        columns = []
        
        for column_name, convex_type in schema.items():
            sql_type = self.map_convex_to_sql(convex_type)
            columns.append(f"    [{column_name}] {sql_type}")
        
        columns_sql = ',\n'.join(columns)
        
        return f"""CREATE TABLE [{table_name}] (
{columns_sql}
);"""


@dataclass
class ImportResult:
    """Risultato dell'import di una tabella"""
    table_name: str
    success: bool
    rows_imported: int
    error: Optional[str] = None
    duration_seconds: float = 0.0



class SQLImporter:
    """
    Gestisce connessione a SQL Server e import dati
    """
    
    def __init__(self, connection_string: str, schema: str, timeout: int = 30):
        """
        Inizializza SQL Importer
        
        Args:
            connection_string: Stringa di connessione SQL Server
            schema: Schema SQL Server dove importare i dati
            timeout: Timeout connessione in secondi
        """
        self.connection_string = connection_string
        self.schema = schema
        self.timeout = timeout
        self.connection = None
        self.cursor = None
    
    def connect(self) -> bool:
        """
        Stabilisce connessione a SQL Server
        
        Returns:
            True se connessione riuscita
            
        Raises:
            Exception: Se connessione fallisce
        """
        try:
            self.connection = pyodbc.connect(
                self.connection_string,
                timeout=self.timeout
            )
            self.cursor = self.connection.cursor()
            return True
        except Exception as e:
            raise Exception(f"Failed to connect to SQL Server: {str(e)}")
    
    def close(self):
        """Chiude connessione SQL Server"""
        if self.cursor:
            self.cursor.close()
        if self.connection:
            self.connection.close()
    
    def table_exists(self, table_name: str) -> bool:
        """
        Verifica se tabella esiste nello schema
        
        Args:
            table_name: Nome della tabella
            
        Returns:
            True se tabella esiste
        """
        if not self.connection:
            raise Exception("Not connected to SQL Server")
        
        query = """
            SELECT COUNT(*) 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
        """
        
        self.cursor.execute(query, (self.schema, table_name))
        count = self.cursor.fetchone()[0]
        return count > 0
    
    def create_table(self, table_name: str, columns: List[str]):
        """
        Crea tabella con tutti i campi come NVARCHAR(MAX)
        
        Args:
            table_name: Nome della tabella
            columns: Lista nomi colonne
        """
        if not self.connection:
            raise Exception("Not connected to SQL Server")
        
        # Crea definizione colonne (tutte NVARCHAR(MAX))
        column_defs = [f"[{col}] NVARCHAR(MAX)" for col in columns]
        columns_sql = ',\n    '.join(column_defs)
        
        # Query CREATE TABLE
        query = f"""
CREATE TABLE [{self.schema}].[{table_name}] (
    {columns_sql}
)
"""
        
        self.cursor.execute(query)
        self.connection.commit()
    
    def import_table(
        self, 
        table_name: str,
        rows: List[Dict[str, Any]], 
        type_mapper: TypeMapper,
        auto_create: bool = True
    ) -> ImportResult:
        """
        Importa dati di una tabella con TRUNCATE prima dell'insert
        
        Args:
            table_name: Nome della tabella
            rows: Lista di righe da importare
            type_mapper: TypeMapper per conversione valori
            auto_create: Se True, crea la tabella se non esiste
            
        Returns:
            ImportResult con statistiche
        """
        start_time = time.time()
        
        try:
            # Verifica esistenza tabella
            table_exists = self.table_exists(table_name)
            
            if not table_exists:
                if auto_create and rows:
                    # Crea tabella con colonne dalla prima riga
                    columns = list(rows[0].keys())
                    self.create_table(table_name, columns)
                else:
                    return ImportResult(
                        table_name=table_name,
                        success=False,
                        rows_imported=0,
                        error=f"Table {table_name} does not exist in schema {self.schema}",
                        duration_seconds=time.time() - start_time
                    )
            else:
                # Tabella esiste: TRUNCATE prima dell'import
                self.truncate_table(table_name)
            
            # Import righe
            rows_imported = self.bulk_insert(table_name, rows, type_mapper)
            
            return ImportResult(
                table_name=table_name,
                success=True,
                rows_imported=rows_imported,
                duration_seconds=time.time() - start_time
            )
            
        except Exception as e:
            return ImportResult(
                table_name=table_name,
                success=False,
                rows_imported=0,
                error=str(e),
                duration_seconds=time.time() - start_time
            )
    
    def bulk_insert(
        self, 
        table_name: str, 
        rows: List[Dict[str, Any]],
        type_mapper: TypeMapper
    ) -> int:
        """
        Esegue bulk insert ottimizzato
        
        Args:
            table_name: Nome della tabella
            rows: Lista di righe da inserire
            type_mapper: TypeMapper per conversione valori
            
        Returns:
            Numero di righe inserite
            
        Raises:
            Exception: Se insert fallisce
        """
        if not rows:
            return 0
        
        if not self.connection:
            raise Exception("Not connected to SQL Server")
        
        # Ottieni colonne dalla prima riga
        columns = list(rows[0].keys())
        
        # Costruisci query INSERT
        columns_sql = ', '.join([f'[{col}]' for col in columns])
        placeholders = ', '.join(['?' for _ in columns])
        query = f"INSERT INTO [{self.schema}].[{table_name}] ({columns_sql}) VALUES ({placeholders})"
        
        # Prepara valori per bulk insert
        values_list = []
        for row in rows:
            # Converti valori usando type_mapper
            converted_values = []
            for col in columns:
                value = row.get(col)
                # Inferisci tipo e converti
                convex_type = type_mapper.infer_convex_type(value)
                converted_value = type_mapper.convert_value(value, convex_type)
                converted_values.append(converted_value)
            values_list.append(tuple(converted_values))
        
        # Esegui bulk insert
        try:
            self.cursor.executemany(query, values_list)
            self.connection.commit()
            return len(values_list)
        except Exception as e:
            self.connection.rollback()
            raise Exception(f"Bulk insert failed: {str(e)}")
    
    def truncate_table(self, table_name: str):
        """
        Svuota tabella prima dell'import
        
        Args:
            table_name: Nome della tabella
        """
        if not self.connection:
            raise Exception("Not connected to SQL Server")
        
        query = f"TRUNCATE TABLE [{self.schema}].[{table_name}]"
        self.cursor.execute(query)
        self.connection.commit()
