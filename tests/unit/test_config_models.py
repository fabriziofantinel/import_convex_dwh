"""
Unit tests for configuration data models.
"""

import pytest
import json
import tempfile
import os
from src.config import ConvexConfig, SQLConfig, EmailConfig, Config, ConfigurationManager, ConfigurationError


class TestConvexConfig:
    """Tests for ConvexConfig dataclass."""
    
    def test_valid_convex_config(self):
        """Test creating a valid ConvexConfig."""
        config = ConvexConfig(
            app_name="test-app",
            deploy_key="prod:xxxxx|yyyyy",
            tables=["users", "orders"]
        )
        assert config.app_name == "test-app"
        assert config.deploy_key == "prod:xxxxx|yyyyy"
        assert config.tables == ["users", "orders"]
    
    def test_convex_config_without_tables(self):
        """Test ConvexConfig with tables=None (export all)."""
        config = ConvexConfig(
            app_name="test-app",
            deploy_key="prod:xxxxx|yyyyy"
        )
        assert config.tables is None
    
    def test_convex_config_empty_app_name(self):
        """Test that empty app_name raises ValueError."""
        with pytest.raises(ValueError, match="app_name must be a non-empty string"):
            ConvexConfig(app_name="", deploy_key="key")
    
    def test_convex_config_empty_deploy_key(self):
        """Test that empty deploy_key raises ValueError."""
        with pytest.raises(ValueError, match="deploy_key must be a non-empty string"):
            ConvexConfig(app_name="app", deploy_key="")


class TestSQLConfig:
    """Tests for SQLConfig dataclass."""
    
    def test_valid_sql_config(self):
        """Test creating a valid SQLConfig."""
        config = SQLConfig(
            connection_string="Server=myserver;Database=DWH;",
            schema="convex_data",
            timeout=60
        )
        assert config.connection_string == "Server=myserver;Database=DWH;"
        assert config.schema == "convex_data"
        assert config.timeout == 60
    
    def test_sql_config_default_timeout(self):
        """Test SQLConfig with default timeout."""
        config = SQLConfig(
            connection_string="Server=myserver;Database=DWH;",
            schema="convex_data"
        )
        assert config.timeout == 30
    
    def test_sql_config_empty_connection_string(self):
        """Test that empty connection_string raises ValueError."""
        with pytest.raises(ValueError, match="connection_string must be a non-empty string"):
            SQLConfig(connection_string="", schema="schema")
    
    def test_sql_config_empty_schema(self):
        """Test that empty schema raises ValueError."""
        with pytest.raises(ValueError, match="schema must be a non-empty string"):
            SQLConfig(connection_string="conn", schema="")
    
    def test_sql_config_invalid_timeout(self):
        """Test that invalid timeout raises ValueError."""
        with pytest.raises(ValueError, match="timeout must be a positive integer"):
            SQLConfig(connection_string="conn", schema="schema", timeout=0)


class TestEmailConfig:
    """Tests for EmailConfig dataclass."""
    
    def test_valid_email_config(self):
        """Test creating a valid EmailConfig."""
        config = EmailConfig(
            smtp_host="smtp.gmail.com",
            smtp_port=587,
            smtp_user="user@example.com",
            smtp_password="password",
            from_email="from@example.com",
            to_emails=["admin@example.com", "dev@example.com"]
        )
        assert config.smtp_host == "smtp.gmail.com"
        assert config.smtp_port == 587
        assert config.use_tls is True
    
    def test_email_config_use_tls_false(self):
        """Test EmailConfig with use_tls=False."""
        config = EmailConfig(
            smtp_host="smtp.example.com",
            smtp_port=25,
            smtp_user="user",
            smtp_password="pass",
            from_email="from@example.com",
            to_emails=["to@example.com"],
            use_tls=False
        )
        assert config.use_tls is False
    
    def test_email_config_empty_smtp_host(self):
        """Test that empty smtp_host raises ValueError."""
        with pytest.raises(ValueError, match="smtp_host must be a non-empty string"):
            EmailConfig(
                smtp_host="",
                smtp_port=587,
                smtp_user="user",
                smtp_password="pass",
                from_email="from@example.com",
                to_emails=["to@example.com"]
            )
    
    def test_email_config_invalid_port(self):
        """Test that invalid port raises ValueError."""
        with pytest.raises(ValueError, match="smtp_port must be a valid port number"):
            EmailConfig(
                smtp_host="smtp.example.com",
                smtp_port=99999,
                smtp_user="user",
                smtp_password="pass",
                from_email="from@example.com",
                to_emails=["to@example.com"]
            )
    
    def test_email_config_empty_to_emails(self):
        """Test that empty to_emails list raises ValueError."""
        with pytest.raises(ValueError, match="to_emails must be a non-empty list"):
            EmailConfig(
                smtp_host="smtp.example.com",
                smtp_port=587,
                smtp_user="user",
                smtp_password="pass",
                from_email="from@example.com",
                to_emails=[]
            )


class TestConfig:
    """Tests for main Config dataclass."""
    
    def test_valid_config(self):
        """Test creating a valid Config."""
        convex_config = ConvexConfig(
            app_name="test-app",
            deploy_key="key"
        )
        sql_config = SQLConfig(
            connection_string="conn",
            schema="schema"
        )
        email_config = EmailConfig(
            smtp_host="smtp.example.com",
            smtp_port=587,
            smtp_user="user",
            smtp_password="pass",
            from_email="from@example.com",
            to_emails=["to@example.com"]
        )
        
        config = Config(
            convex_apps={"test-app": convex_config},
            sql=sql_config,
            email=email_config
        )
        
        assert "test-app" in config.convex_apps
        assert config.log_dir == "logs"
        assert config.retry_attempts == 3
        assert config.retry_backoff == 2.0
    
    def test_config_empty_convex_apps(self):
        """Test that empty convex_apps raises ValueError."""
        sql_config = SQLConfig(connection_string="conn", schema="schema")
        email_config = EmailConfig(
            smtp_host="smtp.example.com",
            smtp_port=587,
            smtp_user="user",
            smtp_password="pass",
            from_email="from@example.com",
            to_emails=["to@example.com"]
        )
        
        with pytest.raises(ValueError, match="convex_apps must be a non-empty dictionary"):
            Config(
                convex_apps={},
                sql=sql_config,
                email=email_config
            )
    
    def test_config_custom_values(self):
        """Test Config with custom log_dir and retry settings."""
        convex_config = ConvexConfig(app_name="app", deploy_key="key")
        sql_config = SQLConfig(connection_string="conn", schema="schema")
        email_config = EmailConfig(
            smtp_host="smtp.example.com",
            smtp_port=587,
            smtp_user="user",
            smtp_password="pass",
            from_email="from@example.com",
            to_emails=["to@example.com"]
        )
        
        config = Config(
            convex_apps={"app": convex_config},
            sql=sql_config,
            email=email_config,
            log_dir="custom_logs",
            retry_attempts=5,
            retry_backoff=3.0
        )
        
        assert config.log_dir == "custom_logs"
        assert config.retry_attempts == 5
        assert config.retry_backoff == 3.0


class TestConfigurationManager:
    """Tests for ConfigurationManager class."""
    
    def test_load_valid_config(self):
        """Test loading a valid configuration file."""
        config_data = {
            "convex_apps": {
                "test-app": {
                    "deploy_key": "prod:xxxxx|yyyyy",
                    "tables": ["users", "orders"]
                }
            },
            "sql_server": {
                "connection_string": "Server=myserver;Database=DWH;",
                "schema": "convex_data",
                "timeout": 30
            },
            "email": {
                "smtp_host": "smtp.gmail.com",
                "smtp_port": 587,
                "smtp_user": "user@example.com",
                "smtp_password": "password",
                "from_email": "from@example.com",
                "to_emails": ["admin@example.com"]
            },
            "log_dir": "logs",
            "retry_attempts": 3,
            "retry_backoff": 2.0
        }
        
        # Create temporary config file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            json.dump(config_data, f)
            temp_path = f.name
        
        try:
            manager = ConfigurationManager()
            config = manager.load_config(temp_path)
            
            assert "test-app" in config.convex_apps
            assert config.sql.schema == "convex_data"
            assert config.email.smtp_host == "smtp.gmail.com"
            assert config.log_dir == "logs"
        finally:
            os.unlink(temp_path)
    
    def test_load_config_file_not_found(self):
        """Test that missing config file raises ConfigurationError."""
        manager = ConfigurationManager()
        
        with pytest.raises(ConfigurationError, match="Configuration file not found"):
            manager.load_config("nonexistent.json")
    
    def test_load_config_invalid_json(self):
        """Test that malformed JSON raises ConfigurationError."""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            f.write("{ invalid json }")
            temp_path = f.name
        
        try:
            manager = ConfigurationManager()
            with pytest.raises(ConfigurationError, match="Invalid JSON"):
                manager.load_config(temp_path)
        finally:
            os.unlink(temp_path)
    
    def test_load_config_missing_convex_apps(self):
        """Test that missing convex_apps field raises ConfigurationError."""
        config_data = {
            "sql_server": {
                "connection_string": "conn",
                "schema": "schema"
            },
            "email": {
                "smtp_host": "smtp.example.com",
                "smtp_port": 587,
                "smtp_user": "user",
                "smtp_password": "pass",
                "from_email": "from@example.com",
                "to_emails": ["to@example.com"]
            }
        }
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            json.dump(config_data, f)
            temp_path = f.name
        
        try:
            manager = ConfigurationManager()
            with pytest.raises(ConfigurationError, match="Missing required field: convex_apps"):
                manager.load_config(temp_path)
        finally:
            os.unlink(temp_path)
    
    def test_load_config_missing_sql_server(self):
        """Test that missing sql_server field raises ConfigurationError."""
        config_data = {
            "convex_apps": {
                "app": {
                    "deploy_key": "key"
                }
            },
            "email": {
                "smtp_host": "smtp.example.com",
                "smtp_port": 587,
                "smtp_user": "user",
                "smtp_password": "pass",
                "from_email": "from@example.com",
                "to_emails": ["to@example.com"]
            }
        }
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            json.dump(config_data, f)
            temp_path = f.name
        
        try:
            manager = ConfigurationManager()
            with pytest.raises(ConfigurationError, match="Missing required field: sql_server"):
                manager.load_config(temp_path)
        finally:
            os.unlink(temp_path)
    
    def test_load_config_missing_email(self):
        """Test that missing email field raises ConfigurationError."""
        config_data = {
            "convex_apps": {
                "app": {
                    "deploy_key": "key"
                }
            },
            "sql_server": {
                "connection_string": "conn",
                "schema": "schema"
            }
        }
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            json.dump(config_data, f)
            temp_path = f.name
        
        try:
            manager = ConfigurationManager()
            with pytest.raises(ConfigurationError, match="Missing required field: email"):
                manager.load_config(temp_path)
        finally:
            os.unlink(temp_path)
    
    def test_load_config_invalid_field_value(self):
        """Test that invalid field values raise ConfigurationError."""
        config_data = {
            "convex_apps": {
                "app": {
                    "deploy_key": ""  # Empty deploy_key should fail validation
                }
            },
            "sql_server": {
                "connection_string": "conn",
                "schema": "schema"
            },
            "email": {
                "smtp_host": "smtp.example.com",
                "smtp_port": 587,
                "smtp_user": "user",
                "smtp_password": "pass",
                "from_email": "from@example.com",
                "to_emails": ["to@example.com"]
            }
        }
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            json.dump(config_data, f)
            temp_path = f.name
        
        try:
            manager = ConfigurationManager()
            with pytest.raises(ConfigurationError, match="Configuration validation failed"):
                manager.load_config(temp_path)
        finally:
            os.unlink(temp_path)
    
    def test_get_convex_config(self):
        """Test getting Convex config for a specific app."""
        config_data = {
            "convex_apps": {
                "app1": {
                    "deploy_key": "key1",
                    "tables": ["users"]
                },
                "app2": {
                    "deploy_key": "key2"
                }
            },
            "sql_server": {
                "connection_string": "conn",
                "schema": "schema"
            },
            "email": {
                "smtp_host": "smtp.example.com",
                "smtp_port": 587,
                "smtp_user": "user",
                "smtp_password": "pass",
                "from_email": "from@example.com",
                "to_emails": ["to@example.com"]
            }
        }
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            json.dump(config_data, f)
            temp_path = f.name
        
        try:
            manager = ConfigurationManager()
            manager.load_config(temp_path)
            
            app1_config = manager.get_convex_config("app1")
            assert app1_config.app_name == "app1"
            assert app1_config.deploy_key == "key1"
            assert app1_config.tables == ["users"]
            
            app2_config = manager.get_convex_config("app2")
            assert app2_config.app_name == "app2"
            assert app2_config.tables is None
        finally:
            os.unlink(temp_path)
    
    def test_get_convex_config_not_loaded(self):
        """Test that getting config before loading raises ConfigurationError."""
        manager = ConfigurationManager()
        
        with pytest.raises(ConfigurationError, match="Configuration not loaded"):
            manager.get_convex_config("app")
    
    def test_get_convex_config_app_not_found(self):
        """Test that requesting non-existent app raises ConfigurationError."""
        config_data = {
            "convex_apps": {
                "app1": {
                    "deploy_key": "key1"
                }
            },
            "sql_server": {
                "connection_string": "conn",
                "schema": "schema"
            },
            "email": {
                "smtp_host": "smtp.example.com",
                "smtp_port": 587,
                "smtp_user": "user",
                "smtp_password": "pass",
                "from_email": "from@example.com",
                "to_emails": ["to@example.com"]
            }
        }
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            json.dump(config_data, f)
            temp_path = f.name
        
        try:
            manager = ConfigurationManager()
            manager.load_config(temp_path)
            
            with pytest.raises(ConfigurationError, match="Application 'nonexistent' not found"):
                manager.get_convex_config("nonexistent")
        finally:
            os.unlink(temp_path)
    
    def test_get_sql_config(self):
        """Test getting SQL Server configuration."""
        config_data = {
            "convex_apps": {
                "app": {
                    "deploy_key": "key"
                }
            },
            "sql_server": {
                "connection_string": "Server=myserver;Database=DWH;",
                "schema": "convex_data",
                "timeout": 60
            },
            "email": {
                "smtp_host": "smtp.example.com",
                "smtp_port": 587,
                "smtp_user": "user",
                "smtp_password": "pass",
                "from_email": "from@example.com",
                "to_emails": ["to@example.com"]
            }
        }
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            json.dump(config_data, f)
            temp_path = f.name
        
        try:
            manager = ConfigurationManager()
            manager.load_config(temp_path)
            
            sql_config = manager.get_sql_config()
            assert sql_config.connection_string == "Server=myserver;Database=DWH;"
            assert sql_config.schema == "convex_data"
            assert sql_config.timeout == 60
        finally:
            os.unlink(temp_path)
    
    def test_get_sql_config_not_loaded(self):
        """Test that getting SQL config before loading raises ConfigurationError."""
        manager = ConfigurationManager()
        
        with pytest.raises(ConfigurationError, match="Configuration not loaded"):
            manager.get_sql_config()
    
    def test_get_email_config(self):
        """Test getting email configuration."""
        config_data = {
            "convex_apps": {
                "app": {
                    "deploy_key": "key"
                }
            },
            "sql_server": {
                "connection_string": "conn",
                "schema": "schema"
            },
            "email": {
                "smtp_host": "smtp.gmail.com",
                "smtp_port": 587,
                "smtp_user": "user@example.com",
                "smtp_password": "password",
                "from_email": "from@example.com",
                "to_emails": ["admin@example.com", "dev@example.com"],
                "use_tls": False
            }
        }
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            json.dump(config_data, f)
            temp_path = f.name
        
        try:
            manager = ConfigurationManager()
            manager.load_config(temp_path)
            
            email_config = manager.get_email_config()
            assert email_config.smtp_host == "smtp.gmail.com"
            assert email_config.smtp_port == 587
            assert email_config.to_emails == ["admin@example.com", "dev@example.com"]
            assert email_config.use_tls is False
        finally:
            os.unlink(temp_path)
    
    def test_get_email_config_not_loaded(self):
        """Test that getting email config before loading raises ConfigurationError."""
        manager = ConfigurationManager()
        
        with pytest.raises(ConfigurationError, match="Configuration not loaded"):
            manager.get_email_config()
