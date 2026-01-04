import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy endpoint to bypass ngrok browser warning
 * This endpoint forwards requests from the browser to the webhook server
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { deploy_key } = body;

    if (!deploy_key) {
      return NextResponse.json(
        { error: "deploy_key is required" },
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

    const response = await fetch(`${webhookUrl}/api/fetch-tables`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_WEBHOOK_TOKEN || "test-token-12345"}`,
        "ngrok-skip-browser-warning": "true",
        "User-Agent": "Vercel-Proxy/1.0",
      },
      body: JSON.stringify({ deploy_key }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: "Failed to fetch tables", details: errorText },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Proxy error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch tables",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
