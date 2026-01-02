from dataclasses import dataclass
from typing import Dict, List, Optional

@dataclass
class ConvexConfig:
    app_name: str
    deploy_key: str
    tables: Optional[List[str]] = None
    table_mapping: Optional[Dict[str, str]] = None  # convex_table -> sql_table
    
    def __post_init__(self):
        if not self.app_name or not isinstance(self.app_name, str):
            raise ValueError("app_name must be a non-empty string")
        if not self.deploy_key or not isinstance(self.deploy_key, str):
            raise ValueError("deploy_key must be a non-empty string")
        if self.tables is not None and not isinstance(self.tables, list):
            raise ValueError("tables must be a list or None")
        if self.table_mapping is not None and not isinstance(self.table_mapping, dict):
            raise ValueError("table_mapping must be a dictionary or None")
    
    def get_sql_table_name(self, convex_table: str) -> str:
        """
        Ottiene il nome della tabella SQL per una tabella Convex.
        Se non c'è mapping, usa lo stesso nome.
        
        Args:
            convex_table: Nome tabella Convex
            
        Returns:
            Nome tabella SQL
        """
        if self.table_mapping and convex_table in self.table_mapping:
            return self.table_mapping[convex_table]
        return convex_table

@dataclass
class SQLConfig:
    connection_string: str
    schema: str
    timeout: int = 30
    
    def __post_init__(self):
        if not self.connection_string or not isinstance(self.connection_string, str):
            raise ValueError("connection_string must be a non-empty string")
        if not self.schema or not isinstance(self.schema, str):
            raise ValueError("schema must be a non-empty string")
        if not isinstance(self.timeout, int) or self.timeout <= 0:
            raise ValueError("timeout must be a positive integer")

@dataclass
class EmailConfig:
    smtp_host: str
    smtp_port: int
    smtp_user: str
    smtp_password: str
    from_email: str
    to_emails: List[str]
    use_tls: bool = True
    
    def __post_init__(self):
        if not self.smtp_host or not isinstance(self.smtp_host, str):
            raise ValueError("smtp_host must be a non-empty string")
        if not isinstance(self.smtp_port, int) or self.smtp_port <= 0 or self.smtp_port > 65535:
            raise ValueError("smtp_port must be a valid port number (1-65535)")
        if not self.smtp_user or not isinstance(self.smtp_user, str):
            raise ValueError("smtp_user must be a non-empty string")
        if not self.smtp_password or not isinstance(self.smtp_password, str):
            raise ValueError("smtp_password must be a non-empty string")
        if not self.from_email or not isinstance(self.from_email, str):
            raise ValueError("from_email must be a non-empty string")
        if not self.to_emails or not isinstance(self.to_emails, list) or len(self.to_emails) == 0:
            raise ValueError("to_emails must be a non-empty list")
        for email in self.to_emails:
            if not isinstance(email, str) or not email:
                raise ValueError("All email addresses in to_emails must be non-empty strings")
        if not isinstance(self.use_tls, bool):
            raise ValueError("use_tls must be a boolean")

@dataclass
class Config:
    convex_apps: Dict[str, ConvexConfig]
    sql: SQLConfig
    email: EmailConfig
    log_dir: str = "logs"
    retry_attempts: int = 3
    retry_backoff: float = 2.0
    
    def __post_init__(self):
        if not self.convex_apps or not isinstance(self.convex_apps, dict):
            raise ValueError("convex_apps must be a non-empty dictionary")
        if len(self.convex_apps) == 0:
            raise ValueError("convex_apps must contain at least one application")
        for app_name, convex_config in self.convex_apps.items():
            if not isinstance(app_name, str) or not app_name:
                raise ValueError("All app names in convex_apps must be non-empty strings")
            if not isinstance(convex_config, ConvexConfig):
                raise ValueError(f"convex_apps['{app_name}'] must be a ConvexConfig instance")
        if not isinstance(self.sql, SQLConfig):
            raise ValueError("sql must be a SQLConfig instance")
        if not isinstance(self.email, EmailConfig):
            raise ValueError("email must be an EmailConfig instance")
        if not self.log_dir or not isinstance(self.log_dir, str):
            raise ValueError("log_dir must be a non-empty string")
        if not isinstance(self.retry_attempts, int) or self.retry_attempts < 1:
            raise ValueError("retry_attempts must be a positive integer")
        if not isinstance(self.retry_backoff, (int, float)) or self.retry_backoff <= 0:
            raise ValueError("retry_backoff must be a positive number")

class ConfigurationError(Exception):
    pass

class ConfigurationManager:
    def __init__(self):
        self._config: Optional[Config] = None
    
    def load_config(self, config_path: str) -> Config:
        import json
        import os
        
        if not os.path.exists(config_path):
            raise ConfigurationError(f"Configuration file not found: {config_path}")
        
        try:
            with open(config_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
        except json.JSONDecodeError as e:
            raise ConfigurationError(f"Invalid JSON in configuration file: {e}")
        except Exception as e:
            raise ConfigurationError(f"Error reading configuration file: {e}")
        
        try:
            convex_apps_data = data.get('convex_apps', {})
            if not convex_apps_data:
                raise ConfigurationError("Missing required field: convex_apps")
            
            convex_apps = {}
            for app_name, app_config in convex_apps_data.items():
                convex_apps[app_name] = ConvexConfig(
                    app_name=app_name,
                    deploy_key=app_config.get('deploy_key', ''),
                    tables=app_config.get('tables'),
                    table_mapping=app_config.get('table_mapping')
                )
            
            sql_data = data.get('sql_server', {})
            if not sql_data:
                raise ConfigurationError("Missing required field: sql_server")
            
            sql_config = SQLConfig(
                connection_string=sql_data.get('connection_string', ''),
                schema=sql_data.get('schema', ''),
                timeout=sql_data.get('timeout', 30)
            )
            
            email_data = data.get('email', {})
            if not email_data:
                raise ConfigurationError("Missing required field: email")
            
            email_config = EmailConfig(
                smtp_host=email_data.get('smtp_host', ''),
                smtp_port=email_data.get('smtp_port', 0),
                smtp_user=email_data.get('smtp_user', ''),
                smtp_password=email_data.get('smtp_password', ''),
                from_email=email_data.get('from_email', ''),
                to_emails=email_data.get('to_emails', []),
                use_tls=email_data.get('use_tls', True)
            )
            
            self._config = Config(
                convex_apps=convex_apps,
                sql=sql_config,
                email=email_config,
                log_dir=data.get('log_dir', 'logs'),
                retry_attempts=data.get('retry_attempts', 3),
                retry_backoff=data.get('retry_backoff', 2.0)
            )
            
            return self._config
            
        except ValueError as e:
            raise ConfigurationError(f"Configuration validation failed: {e}")
        except KeyError as e:
            raise ConfigurationError(f"Missing required configuration field: {e}")
        except Exception as e:
            raise ConfigurationError(f"Error parsing configuration: {e}")
    
    def get_convex_config(self, app_name: str) -> ConvexConfig:
        if self._config is None:
            raise ConfigurationError("Configuration not loaded. Call load_config() first.")
        
        if app_name not in self._config.convex_apps:
            available_apps = ', '.join(self._config.convex_apps.keys())
            raise ConfigurationError(
                f"Application '{app_name}' not found in configuration. "
                f"Available applications: {available_apps}"
            )
        
        return self._config.convex_apps[app_name]
    
    def get_sql_config(self) -> SQLConfig:
        if self._config is None:
            raise ConfigurationError("Configuration not loaded. Call load_config() first.")
        return self._config.sql
    
    def get_email_config(self) -> EmailConfig:
        if self._config is None:
            raise ConfigurationError("Configuration not loaded. Call load_config() first.")
        return self._config.email

__all__ = ['ConvexConfig', 'SQLConfig', 'EmailConfig', 'Config', 'ConfigurationManager', 'ConfigurationError']
