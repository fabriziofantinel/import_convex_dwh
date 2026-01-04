import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy endpoint to check webhook server status
 * Bypasses CORS and localhost restrictions
 */
export async function GET(request: NextRequest) {
  try {
    const webhookUrl = process.env.NEXT_PUBLIC_WEBHOOK_URL;
    
    if (!webhookUrl) {
      return NextResponse.json(
        { error: "NEXT_PUBLIC_WEBHOOK_URL not configured" },
        { status: 500 }
      );
    }

    // Call webhook health endpoint
    const response = await fetch(`${webhookUrl}/health`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { 
          status: "stopped",
          error: `Webhook returned ${response.status}` 
        },
        { status: 200 }
      );
    }

    const data = await response.json();
    
    return NextResponse.json({
      status: "running",
      url: webhookUrl,
      data: data,
    });
  } catch (error) {
    console.error("Error checking webhook status:", error);
    return NextResponse.json(
      { 
        status: "stopped",
        error: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 200 }
    );
  }
}
