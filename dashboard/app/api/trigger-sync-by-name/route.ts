import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  try {
    const { app_name } = await request.json();

    if (!app_name) {
      return NextResponse.json(
        { error: "app_name is required" },
        { status: 400 }
      );
    }

    console.log(`[trigger-sync-by-name] Looking for app: ${app_name}`);

    // Step 1: Get app by name
    const app = await convex.query(api.queries.getSyncAppByName, {
      name: app_name,
    });

    if (!app) {
      console.log(`[trigger-sync-by-name] App not found: ${app_name}`);
      return NextResponse.json(
        { error: `App '${app_name}' not found` },
        { status: 404 }
      );
    }

    console.log(`[trigger-sync-by-name] App found: ${app._id}`);

    // Step 2: Prepare sync job
    const jobData = await convex.mutation(api.mutations.prepareSyncJob, {
      app_id: app._id as Id<"sync_apps">,
      triggered_by: "manual",
    });

    console.log(`[trigger-sync-by-name] Job created: ${jobData.job_id}`);

    // Step 3: Trigger webhook server directly
    const webhookUrl = process.env.NEXT_PUBLIC_WEBHOOK_URL;
    if (!webhookUrl) {
      console.error(`[trigger-sync-by-name] NEXT_PUBLIC_WEBHOOK_URL not configured`);
      throw new Error("Webhook URL not configured");
    }
    
    console.log(`[trigger-sync-by-name] Calling webhook at: ${webhookUrl}/api/sync/${jobData.app_name}`);
    
    const webhookResponse = await fetch(
      `${webhookUrl}/api/sync/${jobData.app_name}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_WEBHOOK_TOKEN || "test-token-12345"}`,
          "ngrok-skip-browser-warning": "true",
          "User-Agent": "PowerShell-Script/1.0",
        },
        body: JSON.stringify({
          job_id: jobData.job_id,
          app_name: jobData.app_name,
          deploy_key: jobData.deploy_key,
          tables: jobData.tables,
          table_mapping: jobData.table_mapping,
        }),
      }
    );

    if (!webhookResponse.ok) {
      const errorText = await webhookResponse.text();
      console.error(`[trigger-sync-by-name] Webhook failed: ${errorText}`);
      throw new Error(`Webhook request failed: ${errorText}`);
    }

    const webhookData = await webhookResponse.json();
    console.log(`[trigger-sync-by-name] Success!`);

    return NextResponse.json({
      success: true,
      job_id: jobData.job_id,
      app_name: jobData.app_name,
      message: webhookData.message || `Sync started for ${jobData.app_name}`,
    });
  } catch (error) {
    console.error("[trigger-sync-by-name] Error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
