import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy endpoint to check ngrok tunnel status
 * Checks if the configured webhook URL is accessible
 */
export async function GET(request: NextRequest) {
  try {
    const webhookUrl = process.env.NEXT_PUBLIC_WEBHOOK_URL;
    
    if (!webhookUrl) {
      return NextResponse.json(
        { 
          status: "unknown",
          error: "NEXT_PUBLIC_WEBHOOK_URL not configured" 
        },
        { status: 200 }
      );
    }

    // Check if it's an ngrok URL
    if (!webhookUrl.includes("ngrok")) {
      return NextResponse.json(
        { 
          status: "unknown",
          url: webhookUrl,
          message: "Not an ngrok URL" 
        },
        { status: 200 }
      );
    }

    // Try to reach the ngrok URL
    const response = await fetch(`${webhookUrl}/health`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
      },
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    if (response.ok) {
      return NextResponse.json({
        status: "running",
        url: webhookUrl,
      });
    } else {
      return NextResponse.json(
        { 
          status: "stopped",
          url: webhookUrl,
          error: `Ngrok returned ${response.status}` 
        },
        { status: 200 }
      );
    }
  } catch (error) {
    const webhookUrl = process.env.NEXT_PUBLIC_WEBHOOK_URL;
    return NextResponse.json(
      { 
        status: "stopped",
        url: webhookUrl,
        error: error instanceof Error ? error.message : "Cannot reach ngrok URL" 
      },
      { status: 200 }
    );
  }
}
