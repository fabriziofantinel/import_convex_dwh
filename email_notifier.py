"""
Enhanced Email Notifier for Sync Dashboard
Sends HTML email notifications for sync failures and recoveries
"""

import smtplib
import os
import json
import requests
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from typing import Optional, Dict, Any
from dataclasses import dataclass
from jinja2 import Template


@dataclass
class EmailConfig:
    """Email configuration from Convex"""
    smtp_host: str
    smtp_port: int
    smtp_user: str
    smtp_password: str
    from_email: str
    to_emails: list
    use_tls: bool = True


class SyncEmailNotifier:
    """
    Enhanced email notifier for sync dashboard
    Sends HTML emails for sync failures and recoveries
    """
    
    def __init__(self, dashboard_url: str = None, logger=None):
        """
        Initialize email notifier
        
        Args:
            dashboard_url: URL of the dashboard for links
            logger: Optional logger
        """
        self.dashboard_url = dashboard_url or os.getenv('DASHBOARD_URL', 'http://localhost:3000')
        self.logger = logger
        self.templates_dir = os.path.join(os.path.dirname(__file__), 'templates')
        
        # Track last sync status for each app to detect recoveries
        self.last_sync_status = {}
    
    def get_email_config(self) -> Optional[EmailConfig]:
        """
        Get email configuration from Convex via dashboard API
        
        Returns:
            EmailConfig if available, None otherwise
        """
        try:
            # Try to get email config from dashboard
            response = requests.get(
                f"{self.dashboard_url}/api/get-email-config",
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and data.get('config'):
                    config = data['config']
                    return EmailConfig(
                        smtp_host=config['smtp_host'],
                        smtp_port=config['smtp_port'],
                        smtp_user=config['smtp_user'],
                        smtp_password=config['smtp_password'],  # Should be decrypted by dashboard
                        from_email=config['from_email'],
                        to_emails=config['to_emails'],
                        use_tls=config.get('use_tls', True)
                    )
            
            if self.logger:
                self.logger.warning("Email config not available from dashboard")
            return None
            
        except Exception as e:
            if self.logger:
                self.logger.error(f"Failed to get email config: {e}")
            return None
    
    def load_template(self, template_name: str) -> Optional[Template]:
        """
        Load HTML email template
        
        Args:
            template_name: Name of template file (e.g., 'sync_failed_email.html')
            
        Returns:
            Jinja2 Template if found, None otherwise
        """
        try:
            template_path = os.path.join(self.templates_dir, template_name)
            
            if not os.path.exists(template_path):
                if self.logger:
                    self.logger.error(f"Template not found: {template_path}")
                return None
            
            with open(template_path, 'r', encoding='utf-8') as f:
                template_content = f.read()
            
            return Template(template_content)
            
        except Exception as e:
            if self.logger:
                self.logger.error(f"Failed to load template {template_name}: {e}")
            return None
    
    def send_sync_failed_notification(
        self,
        app_name: str,
        app_id: str,
        job_id: str,
        error_message: str,
        started_at: datetime,
        failed_at: datetime,
        stats: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Send sync failed notification email
        
        Args:
            app_name: Name of the application
            app_id: Convex app ID
            job_id: Sync job ID
            error_message: Error message
            started_at: When sync started
            failed_at: When sync failed
            stats: Optional sync statistics
            
        Returns:
            True if email sent successfully
        """
        try:
            # Get email config
            email_config = self.get_email_config()
            if not email_config:
                if self.logger:
                    self.logger.warning("Email config not available, skipping notification")
                return False
            
            # Load template
            template = self.load_template('sync_failed_email.html')
            if not template:
                return False
            
            # Calculate duration
            duration = failed_at - started_at
            duration_str = f"{duration.total_seconds():.1f} seconds"
            
            # Prepare template variables
            template_vars = {
                'app_name': app_name,
                'app_id': app_id,
                'job_id': job_id,
                'error_message': error_message,
                'started_at': started_at.strftime('%Y-%m-%d %H:%M:%S'),
                'failed_at': failed_at.strftime('%Y-%m-%d %H:%M:%S'),
                'duration': duration_str,
                'stats': stats,
                'dashboard_url': self.dashboard_url,
                'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            }
            
            # Render HTML
            html_content = template.render(**template_vars)
            
            # Send email
            subject = f"🚨 Sync Failed - {app_name}"
            success = self._send_html_email(email_config, subject, html_content)
            
            if success:
                # Track this failure for potential recovery detection
                self.last_sync_status[app_name] = 'failed'
                if self.logger:
                    self.logger.info(f"Sync failed notification sent for {app_name}")
            
            return success
            
        except Exception as e:
            if self.logger:
                self.logger.error(f"Failed to send sync failed notification: {e}")
            return False
    
    def send_sync_recovery_notification(
        self,
        app_name: str,
        app_id: str,
        job_id: str,
        completed_at: datetime,
        stats: Optional[Dict[str, Any]] = None,
        previous_failure: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Send sync recovery notification email
        
        Args:
            app_name: Name of the application
            app_id: Convex app ID
            job_id: Sync job ID
            completed_at: When sync completed successfully
            stats: Optional sync statistics
            previous_failure: Optional previous failure info
            
        Returns:
            True if email sent successfully
        """
        try:
            # Get email config
            email_config = self.get_email_config()
            if not email_config:
                if self.logger:
                    self.logger.warning("Email config not available, skipping notification")
                return False
            
            # Load template
            template = self.load_template('sync_recovery_email.html')
            if not template:
                return False
            
            # Calculate duration if stats available
            duration_str = "Unknown"
            if stats and 'duration_seconds' in stats:
                duration_str = f"{stats['duration_seconds']:.1f} seconds"
            
            # Prepare template variables
            template_vars = {
                'app_name': app_name,
                'app_id': app_id,
                'job_id': job_id,
                'completed_at': completed_at.strftime('%Y-%m-%d %H:%M:%S'),
                'duration': duration_str,
                'stats': stats,
                'previous_failure': previous_failure,
                'dashboard_url': self.dashboard_url,
                'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            }
            
            # Render HTML
            html_content = template.render(**template_vars)
            
            # Send email
            subject = f"✅ Sync Recovered - {app_name}"
            success = self._send_html_email(email_config, subject, html_content)
            
            if success:
                # Update status to success
                self.last_sync_status[app_name] = 'success'
                if self.logger:
                    self.logger.info(f"Sync recovery notification sent for {app_name}")
            
            return success
            
        except Exception as e:
            if self.logger:
                self.logger.error(f"Failed to send sync recovery notification: {e}")
            return False
    
    def should_send_recovery_notification(self, app_name: str, current_status: str) -> bool:
        """
        Check if we should send a recovery notification
        
        Args:
            app_name: Name of the application
            current_status: Current sync status
            
        Returns:
            True if recovery notification should be sent
        """
        # Send recovery notification if:
        # 1. Current status is success
        # 2. Last known status was failed
        last_status = self.last_sync_status.get(app_name)
        return current_status == 'success' and last_status == 'failed'
    
    def _send_html_email(self, config: EmailConfig, subject: str, html_content: str) -> bool:
        """
        Send HTML email via SMTP
        
        Args:
            config: Email configuration
            subject: Email subject
            html_content: HTML email content
            
        Returns:
            True if sent successfully
        """
        try:
            # Create message
            msg = MIMEMultipart('alternative')
            msg['From'] = config.from_email
            msg['To'] = ', '.join(config.to_emails)
            msg['Subject'] = subject
            
            # Add HTML content
            html_part = MIMEText(html_content, 'html', 'utf-8')
            msg.attach(html_part)
            
            # Connect to SMTP server
            if config.use_tls:
                server = smtplib.SMTP(config.smtp_host, config.smtp_port)
                server.starttls()
            else:
                server = smtplib.SMTP(config.smtp_host, config.smtp_port)
            
            try:
                # Login and send
                server.login(config.smtp_user, config.smtp_password)
                server.send_message(msg)
                return True
                
            finally:
                server.quit()
                
        except Exception as e:
            if self.logger:
                self.logger.error(f"Failed to send email: {e}")
            return False


# Global email notifier instance
email_notifier = None


def get_email_notifier(dashboard_url: str = None, logger=None) -> SyncEmailNotifier:
    """
    Get or create global email notifier instance
    
    Args:
        dashboard_url: Dashboard URL
        logger: Optional logger
        
    Returns:
        SyncEmailNotifier instance
    """
    global email_notifier
    
    if email_notifier is None:
        email_notifier = SyncEmailNotifier(dashboard_url, logger)
    
    return email_notifier