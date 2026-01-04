import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy endpoint to bypass ngrok browser warning for sync trigger
 * This endpoint forwards sync trigger requests from the browser to the webhook server
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { job_id, app_name, deploy_key, tables, table_mapping } = body;

    if (!job_id || !app_name || !deploy_key) {
      return NextResponse.json(
        { error: "Missing required fields: job_id, app_name, deploy_key" },
        { status: 400 }
      );
    }

    // Forward request to webhook server
    const webhookUrl = process.env.NEXT_PUBLIC_WEBHOOK_URL;
    if (!webhookUrl) {
      return NextResponse.json(
        { error: "NEXT_PUBLIC_WEBHOOK_URL not configured" },
        { status: 500 }
      );
    }

    const response = await fetch(`${webhookUrl}/api/sync/${app_name}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_WEBHOOK_TOKEN || "test-token-12345"}`,
        "ngrok-skip-browser-warning": "true",
        "User-Agent": "Vercel-Proxy/1.0",
      },
      body: JSON.stringify({
        job_id,
        app_name,
        deploy_key,
        tables,
        table_mapping,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: "Failed to trigger sync", details: errorText },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Proxy error:", error);
    return NextResponse.json(
      {
        error: "Failed to trigger sync",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
