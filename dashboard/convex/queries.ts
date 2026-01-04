import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get all sync applications
 * Requirements: 2.1, 4.1
 */
export const listSyncApps = query({
  handler: async (ctx) => {
    return await ctx.db.query("sync_apps").order("desc").collect();
  },
});

/**
 * Get a single sync application by ID
 * Requirements: 2.1, 4.1
 */
export const getSyncApp = query({
  args: { id: v.id("sync_apps") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Get a sync application by name
 * Requirements: 2.1
 */
export const getSyncAppByName = query({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("sync_apps")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first();
  },
});

/**
 * Get recent sync jobs for a specific app
 * Requirements: 4.1, 4.2, 4.3
 */
export const getSyncJobs = query({
  args: {
    app_id: v.id("sync_apps"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;
    return await ctx.db
      .query("sync_jobs")
      .withIndex("by_app_and_started", (q) => q.eq("app_id", args.app_id))
      .order("desc")
      .take(limit);
  },
});

/**
 * Get the latest sync job for a specific app
 * Requirements: 4.1, 4.2
 */
export const getLatestSyncJob = query({
  args: { app_id: v.id("sync_apps") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("sync_jobs")
      .withIndex("by_app_and_started", (q) => q.eq("app_id", args.app_id))
      .order("desc")
      .first();
  },
});

/**
 * Get a specific sync job by ID
 * Requirements: 4.4
 */
export const getSyncJob = query({
  args: { id: v.id("sync_jobs") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Get all running sync jobs
 * Requirements: 3.6
 */
export const getRunningSyncJobs = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("sync_jobs")
      .withIndex("by_status", (q) => q.eq("status", "running"))
      .collect();
  },
});

/**
 * Check if a sync is currently running for a specific app
 * Requirements: 3.6
 */
export const isAppSyncRunning = query({
  args: { app_id: v.id("sync_apps") },
  handler: async (ctx, args) => {
    const runningJob = await ctx.db
      .query("sync_jobs")
      .withIndex("by_app_and_started", (q) => q.eq("app_id", args.app_id))
      .filter((q) => q.eq(q.field("status"), "running"))
      .first();

    return runningJob !== null;
  },
});

/**
 * Get SQL Server configuration
 * Requirements: 7.1
 */
export const getSqlConfig = query({
  handler: async (ctx) => {
    const configs = await ctx.db.query("sql_config").collect();
    return configs[0] ?? null; // Should only be one
  },
});

/**
 * Get Email configuration
 * Requirements: 8.1
 */
export const getEmailConfig = query({
  handler: async (ctx) => {
    const configs = await ctx.db.query("email_config").collect();
    return configs[0] ?? null; // Should only be one
  },
});

/**
 * Get all sync apps with their latest job status
 * Requirements: 2.1, 4.1, 4.2
 */
export const getSyncAppsWithStatus = query({
  handler: async (ctx) => {
    const apps = await ctx.db.query("sync_apps").order("desc").collect();

    const appsWithStatus = await Promise.all(
      apps.map(async (app) => {
        const latestJob = await ctx.db
          .query("sync_jobs")
          .withIndex("by_app_and_started", (q) => q.eq("app_id", app._id))
          .order("desc")
          .first();

        return {
          ...app,
          latest_job: latestJob ?? null,
        };
      })
    );

    return appsWithStatus;
  },
});

/**
 * Get all latest sync jobs for all apps
 * Requirements: 4.1, 4.2
 */
export const getAllLatestSyncJobs = query({
  handler: async (ctx) => {
    const apps = await ctx.db.query("sync_apps").collect();
    
    const jobsMap: Record<string, any> = {};
    
    await Promise.all(
      apps.map(async (app) => {
        const latestJob = await ctx.db
          .query("sync_jobs")
          .withIndex("by_app_and_started", (q) => q.eq("app_id", app._id))
          .order("desc")
          .first();
        
        if (latestJob) {
          jobsMap[app._id] = latestJob;
        }
      })
    );
    
    return jobsMap;
  },
});

/**
 * Get audit logs with pagination
 * Requirements: 10.7
 */
export const getAuditLogs = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    
    const logs = await ctx.db
      .query("audit_logs")
      .order("desc")
      .take(limit);
    
    return {
      logs,
      hasMore: logs.length === limit,
    };
  },
});

/**
 * Get audit log statistics
 * Requirements: 10.7
 */
export const getAuditLogStats = query({
  args: {
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const days = args.days ?? 7;
    const cutoffTime = Date.now() - days * 24 * 60 * 60 * 1000;
    
    const recentLogs = await ctx.db
      .query("audit_logs")
      .filter((q) => q.gte(q.field("timestamp"), cutoffTime))
      .collect();
    
    // Count by event type
    const eventTypeCounts: Record<string, number> = {};
    
    for (const log of recentLogs) {
      eventTypeCounts[log.event_type] = (eventTypeCounts[log.event_type] || 0) + 1;
    }
    
    return {
      total_events: recentLogs.length,
      days_analyzed: days,
      event_type_counts: eventTypeCounts,
    };
  },
});

/**
 * Get all sync jobs with optional filters
 * Requirements: 4.1, 4.3
 */
export const getAllSyncJobs = query({
  args: {
    app_id: v.optional(v.id("sync_apps")),
    status: v.optional(v.union(v.literal("success"), v.literal("failed"), v.literal("running"), v.literal("pending"))),
    limit: v.optional(v.number()),
    from_date: v.optional(v.number()), // timestamp in milliseconds
    to_date: v.optional(v.number()),   // timestamp in milliseconds
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    
    // Take more records to ensure we have enough after filtering
    // If date range is specified, take up to 500 records to filter from
    const takeLimit = (args.from_date !== undefined || args.to_date !== undefined) ? 500 : limit * 2;
    
    // Get jobs based on whether app filter is provided
    let jobs;
    if (args.app_id !== undefined) {
      jobs = await ctx.db
        .query("sync_jobs")
        .withIndex("by_app_and_started", (q) => q.eq("app_id", args.app_id!))
        .order("desc")
        .take(takeLimit);
    } else {
      jobs = await ctx.db
        .query("sync_jobs")
        .order("desc")
        .take(takeLimit);
    }
    
    // Apply date range filter if provided
    if (args.from_date !== undefined || args.to_date !== undefined) {
      jobs = jobs.filter(job => {
        const jobDate = job.started_at;
        if (!jobDate) return false;
        
        if (args.from_date !== undefined && jobDate < args.from_date) return false;
        if (args.to_date !== undefined && jobDate > args.to_date) return false;
        
        return true;
      });
    }
    
    // Apply status filter if provided
    if (args.status !== undefined) {
      jobs = jobs.filter(job => job.status === args.status);
    }
    
    // Limit results
    jobs = jobs.slice(0, limit);
    
    // Get app names for each job
    const jobsWithAppNames = await Promise.all(
      jobs.map(async (job) => {
        const app = await ctx.db.get(job.app_id);
        return {
          ...job,
          app_name: app?.name ?? "Unknown",
        };
      })
    );
    
    return jobsWithAppNames;
  },
});
