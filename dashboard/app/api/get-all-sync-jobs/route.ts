import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/**
 * GET /api/get-all-sync-jobs
 * Returns all sync jobs for export to DWH
 */
export async function GET() {
  try {
    const jobs = await convex.query(api.queries.getAllSyncJobs, {
      limit: 1000,
    });

    return NextResponse.json(jobs);
  } catch (error) {
    console.error("[get-all-sync-jobs] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
