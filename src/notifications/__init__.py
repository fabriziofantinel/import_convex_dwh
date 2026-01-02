"""
Email notifications per errori di sync
"""

import smtplib
import traceback
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from typing import Optional
from dataclasses import dataclass


@dataclass
class EmailConfig:
    """Configurazione email"""
    smtp_host: str
    smtp_port: int
    smtp_user: str
    smtp_password: str
    from_email: str
    to_emails: list
    use_tls: bool = True


class EmailNotifier:
    """
    Invia notifiche email in caso di errore
    """
    
    def __init__(self, config: EmailConfig, logger=None):
        """
        Inizializza EmailNotifier
        
        Args:
            config: Configurazione email
            logger: Logger opzionale
        """
        self.config = config
        self.logger = logger
    
    def send_error_notification(
        self,
        app_name: str,
        error_type: str,
        error_message: str,
        stack_trace: Optional[str] = None,
        timestamp: Optional[datetime] = None
    ) -> bool:
        """
        Invia email di notifica errore
        
        Args:
            app_name: Nome applicazione
            error_type: Tipo di errore
            error_message: Messaggio di errore
            stack_trace: Stack trace opzionale
            timestamp: Timestamp errore (default: now)
            
        Returns:
            True se email inviata con successo
        """
        if timestamp is None:
            timestamp = datetime.now()
        
        try:
            # Crea messaggio email
            subject = f"[ERROR] Convex Sync Failed - {app_name}"
            body = self._format_error_email(
                app_name=app_name,
                error_type=error_type,
                error_message=error_message,
                stack_trace=stack_trace,
                timestamp=timestamp
            )
            
            # Invia email
            self._send_email(subject, body)
            
            if self.logger:
                self.logger.info(f"Error notification sent to {', '.join(self.config.to_emails)}")
            
            return True
            
        except Exception as e:
            if self.logger:
                self.logger.error(f"Failed to send error notification: {str(e)}")
            return False
    
    def _format_error_email(
        self,
        app_name: str,
        error_type: str,
        error_message: str,
        stack_trace: Optional[str],
        timestamp: datetime
    ) -> str:
        """
        Formatta email di errore
        
        Args:
            app_name: Nome applicazione
            error_type: Tipo di errore
            error_message: Messaggio di errore
            stack_trace: Stack trace opzionale
            timestamp: Timestamp errore
            
        Returns:
            Corpo email formattato
        """
        body = f"""Convex to SQL Server Sync Error Report

Application: {app_name}
Timestamp: {timestamp.strftime('%Y-%m-%d %H:%M:%S')}
Error Type: {error_type}

Error Message:
{error_message}
"""
        
        if stack_trace:
            body += f"""
Stack Trace:
{stack_trace}
"""
        
        body += """
Please check the logs for more details.

---
This is an automated message from Convex to SQL Server Sync.
"""
        
        return body
    
    def _send_email(self, subject: str, body: str):
        """
        Invia email via SMTP
        
        Args:
            subject: Oggetto email
            body: Corpo email
            
        Raises:
            Exception: Se invio fallisce
        """
        # Crea messaggio
        msg = MIMEMultipart()
        msg['From'] = self.config.from_email
        msg['To'] = ', '.join(self.config.to_emails)
        msg['Subject'] = subject
        
        # Aggiungi corpo
        msg.attach(MIMEText(body, 'plain'))
        
        # Connetti a SMTP e invia
        if self.config.use_tls:
            server = smtplib.SMTP(self.config.smtp_host, self.config.smtp_port)
            server.starttls()
        else:
            server = smtplib.SMTP(self.config.smtp_host, self.config.smtp_port)
        
        try:
            server.login(self.config.smtp_user, self.config.smtp_password)
            server.send_message(msg)
        finally:
            server.quit()


__all__ = ['EmailNotifier', 'EmailConfig']
