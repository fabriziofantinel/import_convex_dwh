"""
Audit Logging Module for Webhook Server
Requirements: 10.7 - Log all sync executions
"""

import json
import time
import threading
from datetime import datetime
from typing import Dict, Any, Optional
import requests
import os


class AuditLogger:
    """
    Audit logger for webhook server operations
    """
    
    def __init__(self, convex_webhook_url: str = None):
        """
        Initialize audit logger
        
        Args:
            convex_webhook_url: URL to send audit logs to Convex
        """
        self.convex_webhook_url = convex_webhook_url
        self.lock = threading.Lock()
        
        # Local log file for backup
        self.log_file = 'logs/audit.log'
        os.makedirs(os.path.dirname(self.log_file), exist_ok=True)
    
    def _get_client_ip(self, request) -> str:
        """Get client IP from Flask request"""
        # Check for forwarded headers
        forwarded_for = request.headers.get('X-Forwarded-For')
        if forwarded_for:
            return forwarded_for.split(',')[0].strip()
        
        real_ip = request.headers.get('X-Real-IP')
        if real_ip:
            return real_ip.strip()
        
        return request.remote_addr or 'unknown'
    
    def _sanitize_details(self, details: Dict[str, Any]) -> Dict[str, Any]:
        """Remove sensitive information from details"""
        sanitized = details.copy()
        
        sensitive_fields = [
            'password', 'password_encrypted', 'smtp_password', 
            'smtp_password_encrypted', 'deploy_key', 'token', 'secret'
        ]
        
        for field in sensitive_fields:
            if field in sanitized:
                value = sanitized[field]
                if isinstance(value, str) and len(value) > 0:
                    if len(value) > 4:
                        sanitized[field] = value[:2] + '*' * (len(value) - 4) + value[-2:]
                    else:
                        sanitized[field] = '*' * len(value)
        
        return sanitized
    
    def _log_to_file(self, entry: Dict[str, Any]):
        """Log entry to local file as backup"""
        try:
            with self.lock:
                with open(self.log_file, 'a', encoding='utf-8') as f:
                    f.write(json.dumps(entry) + '\n')
        except Exception as e:
            print(f"[AUDIT] Failed to write to log file: {e}")
    
    def _send_to_convex(self, entry: Dict[str, Any]):
        """Send audit log entry to Convex"""
        if not self.convex_webhook_url:
            return
        
        try:
            response = requests.post(
                f"{self.convex_webhook_url}/api/audit-log",
                json=entry,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code != 200:
                print(f"[AUDIT] Failed to send to Convex: {response.status_code}")
        
        except Exception as e:
            print(f"[AUDIT] Error sending to Convex: {e}")
    
    def log_event(
        self,
        event_type: str,
        user_id: str,
        resource_type: str,
        details: Dict[str, Any],
        request=None,
        user_email: str = None,
        resource_id: str = None,
        resource_name: str = None
    ):
        """
        Log an audit event
        
        Args:
            event_type: Type of event (sync_triggered, sync_completed, etc.)
            user_id: User ID (or 'system' for automated events)
            resource_type: Type of resource (sync_job, webhook_request, etc.)
            details: Event details
            request: Flask request object (optional)
            user_email: User email (optional)
            resource_id: Resource ID (optional)
            resource_name: Resource name (optional)
        """
        try:
            entry = {
                'event_type': event_type,
                'user_id': user_id,
                'user_email': user_email,
                'resource_type': resource_type,
                'resource_id': resource_id,
                'resource_name': resource_name,
                'details': self._sanitize_details(details),
                'ip_address': self._get_client_ip(request) if request else 'server',
                'user_agent': request.headers.get('User-Agent') if request else 'webhook-server',
                'timestamp': int(time.time() * 1000),  # milliseconds
            }
            
            # Log to file first (synchronous)
            self._log_to_file(entry)
            
            # Send to Convex (asynchronous)
            threading.Thread(
                target=self._send_to_convex,
                args=(entry,),
                daemon=True
            ).start()
            
            print(f"[AUDIT] {event_type}: {resource_type}:{resource_id or 'unknown'} by {user_id}")
        
        except Exception as e:
            print(f"[AUDIT] Failed to log event: {e}")
    
    def log_sync_triggered(
        self,
        job_id: str,
        app_name: str,
        trigger_type: str,
        user_id: str = 'system',
        request=None
    ):
        """Log sync trigger event"""
        self.log_event(
            event_type=f'sync_triggered_{trigger_type}',
            user_id=user_id,
            resource_type='sync_job',
            details={
                'app_name': app_name,
                'trigger_type': trigger_type,
            },
            request=request,
            resource_id=job_id,
            resource_name=f'{app_name} sync'
        )
    
    def log_sync_completed(
        self,
        job_id: str,
        app_name: str,
        status: str,
        stats: Dict[str, Any] = None,
        error_message: str = None
    ):
        """Log sync completion event"""
        details = {
            'app_name': app_name,
            'status': status,
        }
        
        if stats:
            details.update({
                'duration_seconds': stats.get('duration_seconds'),
                'tables_processed': stats.get('tables_processed'),
                'rows_imported': stats.get('rows_imported'),
            })
        
        if error_message:
            details['error_message'] = error_message
        
        self.log_event(
            event_type='sync_completed' if status == 'success' else 'sync_failed',
            user_id='system',
            resource_type='sync_job',
            details=details,
            user_email='system@webhook',
            resource_id=job_id,
            resource_name=f'{app_name} sync'
        )
    
    def log_webhook_request(
        self,
        endpoint: str,
        method: str,
        status_code: int,
        request,
        response_time_ms: float = None,
        error_message: str = None
    ):
        """Log webhook request"""
        details = {
            'endpoint': endpoint,
            'method': method,
            'status_code': status_code,
            'response_time_ms': response_time_ms,
        }
        
        if error_message:
            details['error_message'] = error_message
        
        self.log_event(
            event_type='webhook_request',
            user_id='client',
            resource_type='webhook_request',
            details=details,
            request=request,
            resource_name=f'{method} {endpoint}'
        )
    
    def log_rate_limit_exceeded(
        self,
        endpoint: str,
        request,
        retry_after: int
    ):
        """Log rate limit exceeded event"""
        self.log_event(
            event_type='rate_limit_exceeded',
            user_id='client',
            resource_type='rate_limit',
            details={
                'endpoint': endpoint,
                'retry_after': retry_after,
            },
            request=request,
            resource_name=f'Rate limit: {endpoint}'
        )
    
    def log_authentication_failure(
        self,
        endpoint: str,
        request,
        reason: str = 'invalid_token'
    ):
        """Log authentication failure"""
        self.log_event(
            event_type='authentication_failure',
            user_id='unknown',
            resource_type='authentication',
            details={
                'endpoint': endpoint,
                'reason': reason,
            },
            request=request,
            resource_name=f'Auth failure: {endpoint}'
        )


# Global audit logger instance
audit_logger = None


def init_audit_logger(convex_webhook_url: str = None) -> AuditLogger:
    """Initialize global audit logger"""
    global audit_logger
    audit_logger = AuditLogger(convex_webhook_url)
    return audit_logger


def get_audit_logger() -> AuditLogger:
    """Get audit logger instance"""
    if audit_logger is None:
        raise RuntimeError("Audit logger not initialized")
    return audit_logger


def log_audit_event(
    event_type: str,
    user_id: str,
    resource_type: str,
    details: Dict[str, Any],
    **kwargs
):
    """Convenience function to log audit events"""
    logger = get_audit_logger()
    logger.log_event(event_type, user_id, resource_type, details, **kwargs)