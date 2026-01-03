import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Sync Applications Configuration
  sync_apps: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    deploy_key: v.string(),
    tables: v.array(v.string()),
    table_mapping: v.optional(v.any()), // Record<string, string>
    cron_schedule: v.optional(v.string()),
    cron_enabled: v.boolean(),
    created_at: v.number(),
    updated_at: v.number(),
    created_by: v.string(), // Auth0 user ID
  })
    .index("by_name", ["name"])
    .index("by_created_by", ["created_by"]),

  // Sync Job Execution History
  sync_jobs: defineTable({
    app_id: v.id("sync_apps"),
    app_name: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("running"),
      v.literal("success"),
      v.literal("failed")
    ),
    started_at: v.number(),
    completed_at: v.optional(v.number()),
    duration_seconds: v.optional(v.number()),
    tables_processed: v.optional(v.number()),
    rows_imported: v.optional(v.number()),
    error_message: v.optional(v.string()),
    log_content: v.optional(v.string()),
    triggered_by: v.union(v.literal("manual"), v.literal("cron")),
  })
    .index("by_app", ["app_id"])
    .index("by_status", ["status"])
    .index("by_app_and_started", ["app_id", "started_at"]),

  // SQL Server Configuration (singleton)
  sql_config: defineTable({
    host: v.string(),
    database: v.string(),
    schema: v.string(),
    username: v.string(),
    password_encrypted: v.string(),
    timeout: v.number(),
    updated_at: v.number(),
    updated_by: v.string(), // Auth0 user ID
  }),

  // Email Configuration (singleton)
  email_config: defineTable({
    smtp_host: v.string(),
    smtp_port: v.number(),
    smtp_user: v.string(),
    smtp_password_encrypted: v.string(),
    from_email: v.string(),
    to_emails: v.array(v.string()),
    use_tls: v.boolean(),
    updated_at: v.number(),
    updated_by: v.string(), // Auth0 user ID
  }),

  // Audit Logs
  audit_logs: defineTable({
    event_type: v.union(
      v.literal('sync_app_created'),
      v.literal('sync_app_updated'),
      v.literal('sync_app_deleted'),
      v.literal('sync_triggered_manual'),
      v.literal('sync_triggered_cron'),
      v.literal('sync_completed'),
      v.literal('sync_failed'),
      v.literal('sql_config_updated'),
      v.literal('email_config_updated'),
      v.literal('user_login'),
      v.literal('user_logout')
    ),
    user_id: v.string(),
    user_email: v.optional(v.string()),
    resource_type: v.string(),
    resource_id: v.optional(v.string()),
    resource_name: v.optional(v.string()),
    details: v.any(), // Record<string, any>
    ip_address: v.optional(v.string()),
    user_agent: v.optional(v.string()),
    timestamp: v.number(),
  })
    .index('by_user', ['user_id'])
    .index('by_event_type', ['event_type'])
    .index('by_resource', ['resource_type', 'resource_id'])
    .index('by_timestamp', ['timestamp']),
});
