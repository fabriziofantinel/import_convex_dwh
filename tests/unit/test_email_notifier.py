"""
Unit tests per EmailNotifier
"""
import pytest
from datetime import datetime
from src.notifications import EmailNotifier, EmailConfig


class TestEmailNotifier:
    """Test per la classe EmailNotifier"""
    
    def test_format_error_email_basic(self):
        """Test formattazione email di errore base"""
        config = EmailConfig(
            smtp_host="smtp.example.com",
            smtp_port=587,
            smtp_user="user@example.com",
            smtp_password="password",
            from_email="from@example.com",
            to_emails=["to@example.com"]
        )
        
        notifier = EmailNotifier(config)
        
        timestamp = datetime(2025, 12, 23, 10, 30, 0)
        body = notifier._format_error_email(
            app_name="test-app",
            error_type="TestError",
            error_message="Test error message",
            stack_trace=None,
            timestamp=timestamp
        )
        
        assert "test-app" in body
        assert "TestError" in body
        assert "Test error message" in body
        assert "2025-12-23 10:30:00" in body
    
    def test_format_error_email_with_stack_trace(self):
        """Test formattazione email con stack trace"""
        config = EmailConfig(
            smtp_host="smtp.example.com",
            smtp_port=587,
            smtp_user="user@example.com",
            smtp_password="password",
            from_email="from@example.com",
            to_emails=["to@example.com"]
        )
        
        notifier = EmailNotifier(config)
        
        timestamp = datetime(2025, 12, 23, 10, 30, 0)
        stack_trace = "Traceback (most recent call last):\n  File test.py, line 10\n    raise Exception('test')"
        
        body = notifier._format_error_email(
            app_name="test-app",
            error_type="TestError",
            error_message="Test error message",
            stack_trace=stack_trace,
            timestamp=timestamp
        )
        
        assert "Stack Trace:" in body
        assert stack_trace in body
    
    def test_email_config_creation(self):
        """Test creazione EmailConfig"""
        config = EmailConfig(
            smtp_host="smtp.gmail.com",
            smtp_port=587,
            smtp_user="user@gmail.com",
            smtp_password="password",
            from_email="from@gmail.com",
            to_emails=["to1@example.com", "to2@example.com"],
            use_tls=True
        )
        
        assert config.smtp_host == "smtp.gmail.com"
        assert config.smtp_port == 587
        assert config.smtp_user == "user@gmail.com"
        assert config.smtp_password == "password"
        assert config.from_email == "from@gmail.com"
        assert len(config.to_emails) == 2
        assert config.use_tls is True
    
    def test_email_config_default_tls(self):
        """Test valore default use_tls"""
        config = EmailConfig(
            smtp_host="smtp.gmail.com",
            smtp_port=587,
            smtp_user="user@gmail.com",
            smtp_password="password",
            from_email="from@gmail.com",
            to_emails=["to@example.com"]
        )
        
        assert config.use_tls is True
    
    def test_format_error_email_contains_required_fields(self):
        """Test che email contenga tutti i campi richiesti"""
        config = EmailConfig(
            smtp_host="smtp.example.com",
            smtp_port=587,
            smtp_user="user@example.com",
            smtp_password="password",
            from_email="from@example.com",
            to_emails=["to@example.com"]
        )
        
        notifier = EmailNotifier(config)
        
        timestamp = datetime.now()
        body = notifier._format_error_email(
            app_name="my-app",
            error_type="NetworkError",
            error_message="Connection timeout",
            stack_trace="Stack trace here",
            timestamp=timestamp
        )
        
        # Verifica presenza campi obbligatori
        assert "Application:" in body
        assert "my-app" in body
        assert "Timestamp:" in body
        assert "Error Type:" in body
        assert "NetworkError" in body
        assert "Error Message:" in body
        assert "Connection timeout" in body
        assert "Stack Trace:" in body
        assert "Stack trace here" in body
