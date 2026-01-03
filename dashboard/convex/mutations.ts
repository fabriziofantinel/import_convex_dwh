import { mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Create a new sync application
 * Requirements: 2.3
 */
export const createSyncApp = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    deploy_key: v.string(),
    tables: v.array(v.string()),
    table_mapping: v.optional(v.any()),
    cron_schedule: v.optional(v.string()),
    cron_enabled: v.boolean(),
    created_by: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check if app with same name already exists
    const existing = await ctx.db
      .query("sync_apps")
      .withIndex("by_name", (q: any) => q.eq("name", args.name))
      .first();

    if (existing) {
      throw new Error(`Sync app with name "${args.name}" already exists`);
    }

    return await ctx.db.insert("sync_apps", {
      name: args.name,
      description: args.description,
      deploy_key: args.deploy_key,
      tables: args.tables,
      table_mapping: args.table_mapping,
      cron_schedule: args.cron_schedule,
      cron_enabled: args.cron_enabled,
      created_at: now,
      updated_at: now,
      created_by: args.created_by,
    });
  },
});

/**
 * Update an existing sync application
 * Requirements: 2.4, 2.5
 */
export const updateSyncApp = mutation({
  args: {
    id: v.id("sync_apps"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    deploy_key: v.optional(v.string()),
    tables: v.optional(v.array(v.string())),
    table_mapping: v.optional(v.any()),
    cron_schedule: v.optional(v.string()),
    cron_enabled: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    // If name is being updated, check for duplicates
    if (updates.name) {
      const existing = await ctx.db
        .query("sync_apps")
        .withIndex("by_name", (q) => q.eq("name", updates.name!))
        .first();

      if (existing && existing._id !== id) {
        throw new Error(`Sync app with name "${updates.name}" already exists`);
      }
    }

    await ctx.db.patch(id, {
      ...updates,
      updated_at: Date.now(),
    });
  },
});

/**
 * Delete a sync application
 * Requirements: 2.6
 */
export const deleteSyncApp = mutation({
  args: { id: v.id("sync_apps") },
  handler: async (ctx, args) => {
    // Delete the app
    await ctx.db.delete(args.id);

    // Note: Sync jobs are kept for historical purposes
    // They can be cleaned up separately if needed
  },
});

/**
 * Create a new sync job
 * Requirements: 3.1
 */
export const createSyncJob = mutation({
  args: {
    app_id: v.id("sync_apps"),
    app_name: v.string(),
    triggered_by: v.union(v.literal("manual"), v.literal("cron")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("sync_jobs", {
      app_id: args.app_id,
      app_name: args.app_name,
      status: "pending",
      started_at: Date.now(),
      triggered_by: args.triggered_by,
    });
  },
});

/**
 * Update sync job status and details
 * Requirements: 3.3, 3.4, 3.5
 */
export const updateSyncJob = mutation({
  args: {
    id: v.id("sync_jobs"),
    status: v.optional(
      v.union(
        v.literal("running"),
        v.literal("success"),
        v.literal("failed")
      )
    ),
    completed_at: v.optional(v.number()),
    duration_seconds: v.optional(v.number()),
    tables_processed: v.optional(v.number()),
    rows_imported: v.optional(v.number()),
    error_message: v.optional(v.string()),
    log_content: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

/**
 * Update SQL Server configuration
 * Requirements: 7.2
 */
export const updateSqlConfig = mutation({
  args: {
    host: v.string(),
    database: v.string(),
    schema: v.string(),
    username: v.string(),
    password_encrypted: v.string(),
    timeout: v.number(),
    updated_by: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("sql_config").first();

    if (existing) {
      // Update existing config
      await ctx.db.patch(existing._id, {
        host: args.host,
        database: args.database,
        schema: args.schema,
        username: args.username,
        password_encrypted: args.password_encrypted,
        timeout: args.timeout,
        updated_at: Date.now(),
        updated_by: args.updated_by,
      });
      return existing._id;
    } else {
      // Create new config
      return await ctx.db.insert("sql_config", {
        host: args.host,
        database: args.database,
        schema: args.schema,
        username: args.username,
        password_encrypted: args.password_encrypted,
        timeout: args.timeout,
        updated_at: Date.now(),
        updated_by: args.updated_by,
      });
    }
  },
});

/**
 * Update Email configuration
 * Requirements: 8.2
 */
export const updateEmailConfig = mutation({
  args: {
    smtp_host: v.string(),
    smtp_port: v.number(),
    smtp_user: v.string(),
    smtp_password_encrypted: v.string(),
    from_email: v.string(),
    to_emails: v.array(v.string()),
    use_tls: v.boolean(),
    updated_by: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("email_config").first();

    if (existing) {
      // Update existing config
      await ctx.db.patch(existing._id, {
        smtp_host: args.smtp_host,
        smtp_port: args.smtp_port,
        smtp_user: args.smtp_user,
        smtp_password_encrypted: args.smtp_password_encrypted,
        from_email: args.from_email,
        to_emails: args.to_emails,
        use_tls: args.use_tls,
        updated_at: Date.now(),
        updated_by: args.updated_by,
      });
      return existing._id;
    } else {
      // Create new config
      return await ctx.db.insert("email_config", {
        smtp_host: args.smtp_host,
        smtp_port: args.smtp_port,
        smtp_user: args.smtp_user,
        smtp_password_encrypted: args.smtp_password_encrypted,
        from_email: args.from_email,
        to_emails: args.to_emails,
        use_tls: args.use_tls,
        updated_at: Date.now(),
        updated_by: args.updated_by,
      });
    }
  },
});

/**
 * Delete old sync jobs (cleanup utility)
 * Optional: Can be used to clean up old job history
 */
export const deleteOldSyncJobs = mutation({
  args: {
    older_than_days: v.number(),
  },
  handler: async (ctx, args) => {
    const cutoffTime = Date.now() - args.older_than_days * 24 * 60 * 60 * 1000;

    const oldJobs = await ctx.db
      .query("sync_jobs")
      .filter((q) => q.lt(q.field("started_at"), cutoffTime))
      .collect();

    for (const job of oldJobs) {
      await ctx.db.delete(job._id);
    }

    return { deleted_count: oldJobs.length };
  },
});

/**
 * Prepare sync job - creates job and returns app data for webhook
 * Requirements: 3.1, 3.2
 */
export const prepareSyncJob = mutation({
  args: {
    app_id: v.id("sync_apps"),
    triggered_by: v.union(v.literal("manual"), v.literal("cron")),
  },
  handler: async (ctx, args) => {
    // Get app configuration
    const app = await ctx.db.get(args.app_id);
    
    if (!app) {
      throw new Error("Sync app not found");
    }

    // Check if sync is already running for this app
    const runningJob = await ctx.db
      .query("sync_jobs")
      .withIndex("by_app", (q) => q.eq("app_id", args.app_id))
      .filter((q) => 
        q.or(
          q.eq(q.field("status"), "running"),
          q.eq(q.field("status"), "pending")
        )
      )
      .first();

    if (runningJob) {
      throw new Error(
        `Sync is already running for app "${app.name}". Please wait for it to complete.`
      );
    }

    // Create sync job record
    const jobId = await ctx.db.insert("sync_jobs", {
      app_id: args.app_id,
      app_name: app.name,
      status: "running",
      started_at: Date.now(),
      triggered_by: args.triggered_by,
    });

    return {
      success: true,
      job_id: jobId,
      app_name: app.name,
      deploy_key: app.deploy_key,
      tables: app.tables,
      table_mapping: app.table_mapping,
    };
  },
});

/**
 * Create audit log entry
 * Requirements: 10.7
 */
export const createAuditLog = mutation({
  args: {
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
    details: v.any(),
    ip_address: v.optional(v.string()),
    user_agent: v.optional(v.string()),
    timestamp: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("audit_logs", args);
  },
});
