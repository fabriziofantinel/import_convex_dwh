import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

/**
 * Trigger a sync by calling the webhook on VM Windows
 * Requirements: 3.1, 3.2
 */
export const triggerSync = action({
  args: {
    app_id: v.id("sync_apps"),
    triggered_by: v.union(v.literal("manual"), v.literal("cron")),
  },
  handler: async (ctx, args) => {
    // Get app configuration
    const app: any = await ctx.runQuery(api.queries.getSyncApp, { id: args.app_id });
    if (!app) {
      throw new Error("Sync app not found");
    }

    // Check if sync is already running for this app
    const isRunning = await ctx.runQuery(api.queries.isAppSyncRunning, {
      app_id: args.app_id,
    });

    if (isRunning) {
      throw new Error(
        `Sync is already running for app "${app.name}". Please wait for it to complete.`
      );
    }

    // Create sync job record
    const jobId: any = await ctx.runMutation(api.mutations.createSyncJob, {
      app_id: args.app_id,
      app_name: app.name,
      triggered_by: args.triggered_by,
    });

    // Update job status to running
    await ctx.runMutation(api.mutations.updateSyncJob, {
      id: jobId,
      status: "running",
    });

    // Get webhook configuration from environment
    // Use NEXT_PUBLIC_ prefixed variables which are available in Vercel
    const webhookUrl = process.env.NEXT_PUBLIC_WEBHOOK_URL || process.env.WEBHOOK_URL;
    const webhookToken = process.env.NEXT_PUBLIC_WEBHOOK_TOKEN || process.env.WEBHOOK_TOKEN;

    if (!webhookUrl || !webhookToken) {
      // Update job to failed
      await ctx.runMutation(api.mutations.updateSyncJob, {
        id: jobId,
        status: "failed",
        completed_at: Date.now(),
        error_message:
          "Webhook configuration missing. Please set NEXT_PUBLIC_WEBHOOK_URL and NEXT_PUBLIC_WEBHOOK_TOKEN environment variables.",
      });

      throw new Error("Webhook configuration missing");
    }

    try {
      // Call webhook on VM Windows
      const response = await fetch(`${webhookUrl}/api/sync/${app.name}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${webhookToken}`,
        },
        body: JSON.stringify({
          job_id: jobId,
          app_name: app.name,
          deploy_key: app.deploy_key,
          tables: app.tables,
          table_mapping: app.table_mapping,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Webhook request failed: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      const result = await response.json();

      // Webhook will call back to update job status
      // Return success with job ID
      return {
        success: true,
        job_id: jobId,
        message: result.message || `Sync started for ${app.name}`,
      };
    } catch (error) {
      // Update job to failed
      await ctx.runMutation(api.mutations.updateSyncJob, {
        id: jobId,
        status: "failed",
        completed_at: Date.now(),
        error_message:
          error instanceof Error ? error.message : "Unknown error occurred",
      });

      throw error;
    }
  },
});

/**
 * HTTP action to receive webhook callbacks from VM Windows
 * This will be called by the webhook server to update job status
 * Requirements: 5.4, 5.5
 */
export const syncCallback = action({
  args: {
    job_id: v.id("sync_jobs"),
    status: v.union(v.literal("success"), v.literal("failed")),
    completed_at: v.number(),
    duration_seconds: v.optional(v.number()),
    tables_processed: v.optional(v.number()),
    rows_imported: v.optional(v.number()),
    error_message: v.optional(v.string()),
    log_content: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Update the sync job with results
    await ctx.runMutation(api.mutations.updateSyncJob, {
      id: args.job_id,
      status: args.status,
      completed_at: args.completed_at,
      duration_seconds: args.duration_seconds,
      tables_processed: args.tables_processed,
      rows_imported: args.rows_imported,
      error_message: args.error_message,
      log_content: args.log_content,
    });

    return { success: true };
  },
});

/**
 * Get SQL configuration for webhook server
 * This action can be called by the webhook server to get SQL config
 * Requirements: 7.3
 */
export const getSqlConfigForSync = action({
  handler: async (ctx) => {
    const config: any = await ctx.runQuery(api.queries.getSqlConfig);

    if (!config) {
      throw new Error("SQL configuration not found");
    }

    return config;
  },
});

/**
 * Fetch available tables from a Convex deployment
 * This action downloads the backup and returns the list of tables
 * Requirements: 2.7
 */
export const fetchAvailableTables = action({
  args: {
    deploy_key: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      // Get webhook configuration from environment
      // Use NEXT_PUBLIC_ prefixed variables which are available in Vercel
      const webhookUrl = process.env.NEXT_PUBLIC_WEBHOOK_URL || process.env.WEBHOOK_URL;
      const webhookToken = process.env.NEXT_PUBLIC_WEBHOOK_TOKEN || process.env.WEBHOOK_TOKEN;

      if (!webhookUrl || !webhookToken) {
        throw new Error("Webhook configuration missing");
      }

      const response = await fetch(`${webhookUrl}/api/fetch-tables`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${webhookToken}`,
        },
        body: JSON.stringify({
          deploy_key: args.deploy_key,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch tables: ${errorText}`);
      }

      const result = await response.json();
      return {
        success: true,
        tables: result.tables || [],
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        tables: [],
      };
    }
  },
});

/**
 * Get Email configuration for webhook server
 * This action can be called by the webhook server to get email config
 * Requirements: 8.1
 */
export const getEmailConfigForSync = action({
  handler: async (ctx) => {
    const config: any = await ctx.runQuery(api.queries.getEmailConfig);

    if (!config) {
      throw new Error("Email configuration not found");
    }

    return config;
  },
});
