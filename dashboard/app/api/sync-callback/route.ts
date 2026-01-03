import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.job_id || !body.status || !body.completed_at) {
      return NextResponse.json(
        { error: "Missing required fields: job_id, status, completed_at" },
        { status: 400 }
      );
    }

    // Call Convex action to update job
    await client.action(api.actions.syncCallback, {
      job_id: body.job_id,
      status: body.status,
      completed_at: body.completed_at,
      duration_seconds: body.duration_seconds,
      tables_processed: body.tables_processed,
      rows_imported: body.rows_imported,
      error_message: body.error_message,
      log_content: body.log_content,
    });

    return NextResponse.json({ success: true, message: "Sync job updated" });
  } catch (error) {
    console.error("Sync callback error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}