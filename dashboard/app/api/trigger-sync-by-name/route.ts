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

    // Step 1: Get app by name
    const app = await convex.query(api.queries.getSyncAppByName, {
      name: app_name,
    });

    if (!app) {
      return NextResponse.json(
        { error: `App '${app_name}' not found` },
        { status: 404 }
      );
    }

    // Step 2: Prepare sync job
    const jobData = await convex.mutation(api.mutations.prepareSyncJob, {
      app_id: app._id as Id<"sync_apps">,
      triggered_by: "manual",
    });

    // Step 3: Trigger webhook via proxy (same as Sync Now button)
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";
    
    const webhookResponse = await fetch(
      `${baseUrl}/api/proxy-trigger-sync`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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
      throw new Error(`Webhook request failed: ${errorText}`);
    }

    const webhookData = await webhookResponse.json();

    return NextResponse.json({
      success: true,
      job_id: jobData.job_id,
      app_name: jobData.app_name,
      message: webhookData.message || `Sync started for ${jobData.app_name}`,
    });
  } catch (error) {
    console.error("Error triggering sync:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
