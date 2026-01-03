import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";

const http = httpRouter();

/**
 * HTTP endpoint to trigger a sync job
 * POST /trigger-sync
 * Requirements: 3.1, 3.2
 */
http.route({
  path: "/trigger-sync",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.json();

      // Validate required fields
      if (!body.app_id || !body.triggered_by) {
        return new Response(
          JSON.stringify({
            error: "Missing required fields: app_id, triggered_by",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Get app configuration
      const app: any = await ctx.runQuery(api.queries.getSyncApp, { 
        id: body.app_id as Id<"sync_apps">
      });
      
      if (!app) {
        return new Response(
          JSON.stringify({ error: "Sync app not found" }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Check if sync is already running for this app
      const isRunning = await ctx.runQuery(api.queries.isAppSyncRunning, {
        app_id: body.app_id as Id<"sync_apps">,
      });

      if (isRunning) {
        return new Response(
          JSON.stringify({
            error: `Sync is already running for app "${app.name}". Please wait for it to complete.`,
          }),
          {
            status: 409,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Create sync job record
      const jobId: any = await ctx.runMutation(api.mutations.createSyncJob, {
        app_id: body.app_id as Id<"sync_apps">,
        app_name: app.name,
        triggered_by: body.triggered_by,
      });

      // Update job status to running
      await ctx.runMutation(api.mutations.updateSyncJob, {
        id: jobId,
        status: "running",
      });

      return new Response(
        JSON.stringify({
          success: true,
          job_id: jobId,
          app_name: app.name,
          deploy_key: app.deploy_key,
          tables: app.tables,
          table_mapping: app.table_mapping,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (error) {
      console.error("Trigger sync error:", error);
      return new Response(
        JSON.stringify({
          error: error instanceof Error ? error.message : "Unknown error",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }),
});

/**
 * HTTP endpoint for webhook callbacks from VM Windows
 * POST /sync-callback
 * Requirements: 5.4, 5.5
 */
http.route({
  path: "/sync-callback",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.json();

      // Validate required fields
      if (!body.job_id || !body.status || !body.completed_at) {
        return new Response(
          JSON.stringify({
            error: "Missing required fields: job_id, status, completed_at",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Call the sync callback action
      await ctx.runAction(api.actions.syncCallback, {
        job_id: body.job_id,
        status: body.status,
        completed_at: body.completed_at,
        duration_seconds: body.duration_seconds,
        tables_processed: body.tables_processed,
        rows_imported: body.rows_imported,
        error_message: body.error_message,
        log_content: body.log_content,
      });

      return new Response(
        JSON.stringify({ success: true, message: "Sync job updated" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (error) {
      console.error("Sync callback error:", error);
      return new Response(
        JSON.stringify({
          error: error instanceof Error ? error.message : "Unknown error",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }),
});

/**
 * Health check endpoint
 * GET /health
 */
http.route({
  path: "/health",
  method: "GET",
  handler: httpAction(async () => {
    return new Response(
      JSON.stringify({
        status: "healthy",
        timestamp: Date.now(),
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  }),
});

export default http;
