/**
 * Audit Logging Module
 * Requirements: 10.7 - Log all CRUD operations and sync executions
 */

import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';

// Audit event types
export type AuditEventType = 
  | 'sync_app_created'
  | 'sync_app_updated' 
  | 'sync_app_deleted'
  | 'sync_triggered_manual'
  | 'sync_triggered_cron'
  | 'sync_completed'
  | 'sync_failed'
  | 'sql_config_updated'
  | 'email_config_updated'
  | 'user_login'
  | 'user_logout';

// Audit log entry interface
export interface AuditLogEntry {
  event_type: AuditEventType;
  user_id: string;
  user_email?: string;
  resource_type: string;
  resource_id?: string;
  resource_name?: string;
  details: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  timestamp: number;
}

// Audit logger class
export class AuditLogger {
  private convex: ConvexHttpClient;
  
  constructor(convexUrl: string) {
    this.convex = new ConvexHttpClient(convexUrl);
  }
  
  /**
   * Get client IP address from request headers
   */
  private getClientIP(): string {
    if (typeof window === 'undefined') {
      // Server-side
      return 'server';
    }
    
    // Client-side - IP will be logged by server
    return 'client';
  }
  
  /**
   * Get user agent string
   */
  private getUserAgent(): string {
    if (typeof window === 'undefined') {
      return 'server';
    }
    
    return navigator.userAgent || 'unknown';
  }
  
  /**
   * Log an audit event
   */
  async logEvent(
    eventType: AuditEventType,
    userId: string,
    resourceType: string,
    details: Record<string, any>,
    options?: {
      userEmail?: string;
      resourceId?: string;
      resourceName?: string;
    }
  ): Promise<void> {
    try {
      const entry: AuditLogEntry = {
        event_type: eventType,
        user_id: userId,
        user_email: options?.userEmail,
        resource_type: resourceType,
        resource_id: options?.resourceId,
        resource_name: options?.resourceName,
        details: {
          ...details,
          // Add sanitized details (remove sensitive data)
          ...this.sanitizeDetails(details),
        },
        ip_address: this.getClientIP(),
        user_agent: this.getUserAgent(),
        timestamp: Date.now(),
      };
      
      // Send to Convex mutation
      await this.convex.mutation(api.mutations.createAuditLog, entry);
      
      // Also log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.log('[AUDIT]', eventType, {
          user: userId,
          resource: `${resourceType}:${options?.resourceId || 'unknown'}`,
          details: Object.keys(details),
        });
      }
    } catch (error) {
      // Don't throw - audit logging should not break the application
      console.error('[AUDIT] Failed to log event:', error);
    }
  }
  
  /**
   * Sanitize details to remove sensitive information
   */
  private sanitizeDetails(details: Record<string, any>): Record<string, any> {
    const sanitized = { ...details };
    
    // Remove or mask sensitive fields
    const sensitiveFields = [
      'password',
      'password_encrypted',
      'smtp_password',
      'smtp_password_encrypted',
      'deploy_key',
      'token',
      'secret',
    ];
    
    for (const field of sensitiveFields) {
      if (field in sanitized) {
        if (typeof sanitized[field] === 'string' && sanitized[field].length > 0) {
          // Mask with asterisks, show only first 2 and last 2 characters
          const value = sanitized[field];
          if (value.length > 4) {
            sanitized[field] = value.substring(0, 2) + '*'.repeat(value.length - 4) + value.substring(value.length - 2);
          } else {
            sanitized[field] = '*'.repeat(value.length);
          }
        }
      }
    }
    
    return sanitized;
  }
  
  /**
   * Log sync app creation
   */
  async logSyncAppCreated(
    userId: string,
    userEmail: string,
    appId: string,
    appName: string,
    appData: any
  ): Promise<void> {
    await this.logEvent(
      'sync_app_created',
      userId,
      'sync_app',
      {
        app_name: appData.name,
        tables_count: appData.tables?.length || 0,
      },
      {
        userEmail,
        resourceId: appId,
        resourceName: appName,
      }
    );
  }
  
  /**
   * Log sync app update
   */
  async logSyncAppUpdated(
    userId: string,
    userEmail: string,
    appId: string,
    appName: string,
    changes: Record<string, any>
  ): Promise<void> {
    await this.logEvent(
      'sync_app_updated',
      userId,
      'sync_app',
      {
        changed_fields: Object.keys(changes),
        changes: changes,
      },
      {
        userEmail,
        resourceId: appId,
        resourceName: appName,
      }
    );
  }
  
  /**
   * Log sync app deletion
   */
  async logSyncAppDeleted(
    userId: string,
    userEmail: string,
    appId: string,
    appName: string
  ): Promise<void> {
    await this.logEvent(
      'sync_app_deleted',
      userId,
      'sync_app',
      {
        app_name: appName,
      },
      {
        userEmail,
        resourceId: appId,
        resourceName: appName,
      }
    );
  }
  
  /**
   * Log manual sync trigger
   */
  async logSyncTriggeredManual(
    userId: string,
    userEmail: string,
    appId: string,
    appName: string,
    jobId: string
  ): Promise<void> {
    await this.logEvent(
      'sync_triggered_manual',
      userId,
      'sync_job',
      {
        app_name: appName,
        trigger_type: 'manual',
      },
      {
        userEmail,
        resourceId: jobId,
        resourceName: `${appName} sync`,
      }
    );
  }
  
  /**
   * Log cron sync trigger
   */
  async logSyncTriggeredCron(
    appId: string,
    appName: string,
    jobId: string
  ): Promise<void> {
    await this.logEvent(
      'sync_triggered_cron',
      'system',
      'sync_job',
      {
        app_name: appName,
        trigger_type: 'cron',
      },
      {
        userEmail: 'system@cron',
        resourceId: jobId,
        resourceName: `${appName} sync`,
      }
    );
  }
  
  /**
   * Log sync completion
   */
  async logSyncCompleted(
    jobId: string,
    appName: string,
    status: 'success' | 'failed',
    stats?: {
      duration_seconds?: number;
      tables_processed?: number;
      rows_imported?: number;
    },
    errorMessage?: string
  ): Promise<void> {
    await this.logEvent(
      status === 'success' ? 'sync_completed' : 'sync_failed',
      'system',
      'sync_job',
      {
        app_name: appName,
        status,
        duration_seconds: stats?.duration_seconds,
        tables_processed: stats?.tables_processed,
        rows_imported: stats?.rows_imported,
        error_message: errorMessage,
      },
      {
        userEmail: 'system@webhook',
        resourceId: jobId,
        resourceName: `${appName} sync`,
      }
    );
  }
  
  /**
   * Log SQL config update
   */
  async logSqlConfigUpdated(
    userId: string,
    userEmail: string,
    changes: Record<string, any>
  ): Promise<void> {
    await this.logEvent(
      'sql_config_updated',
      userId,
      'sql_config',
      {
        changed_fields: Object.keys(changes),
        host: changes.host,
        database: changes.database,
        schema: changes.schema,
        username: changes.username,
        // password is automatically sanitized
      },
      {
        userEmail,
        resourceName: 'SQL Configuration',
      }
    );
  }
  
  /**
   * Log email config update
   */
  async logEmailConfigUpdated(
    userId: string,
    userEmail: string,
    changes: Record<string, any>
  ): Promise<void> {
    await this.logEvent(
      'email_config_updated',
      userId,
      'email_config',
      {
        changed_fields: Object.keys(changes),
        smtp_host: changes.smtp_host,
        smtp_port: changes.smtp_port,
        smtp_user: changes.smtp_user,
        from_email: changes.from_email,
        to_emails_count: changes.to_emails?.length || 0,
        use_tls: changes.use_tls,
        // smtp_password is automatically sanitized
      },
      {
        userEmail,
        resourceName: 'Email Configuration',
      }
    );
  }
  
  /**
   * Log user login
   */
  async logUserLogin(userId: string, userEmail: string): Promise<void> {
    await this.logEvent(
      'user_login',
      userId,
      'user_session',
      {
        login_method: 'auth0',
      },
      {
        userEmail,
        resourceName: 'User Session',
      }
    );
  }
  
  /**
   * Log user logout
   */
  async logUserLogout(userId: string, userEmail: string): Promise<void> {
    await this.logEvent(
      'user_logout',
      userId,
      'user_session',
      {
        logout_method: 'auth0',
      },
      {
        userEmail,
        resourceName: 'User Session',
      }
    );
  }
}

// Global audit logger instance
let auditLogger: AuditLogger | null = null;

/**
 * Initialize audit logger
 */
export function initAuditLogger(convexUrl: string): AuditLogger {
  auditLogger = new AuditLogger(convexUrl);
  return auditLogger;
}

/**
 * Get audit logger instance
 */
export function getAuditLogger(): AuditLogger {
  if (!auditLogger) {
    throw new Error('Audit logger not initialized. Call initAuditLogger() first.');
  }
  return auditLogger;
}

/**
 * Convenience function to log audit events
 */
export async function logAuditEvent(
  eventType: AuditEventType,
  userId: string,
  resourceType: string,
  details: Record<string, any>,
  options?: {
    userEmail?: string;
    resourceId?: string;
    resourceName?: string;
  }
): Promise<void> {
  const logger = getAuditLogger();
  await logger.logEvent(eventType, userId, resourceType, details, options);
}