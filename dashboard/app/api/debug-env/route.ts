import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    convex_url: process.env.NEXT_PUBLIC_CONVEX_URL || "not set",
    webhook_url: process.env.NEXT_PUBLIC_WEBHOOK_URL || "not set",
    vercel_url: process.env.VERCEL_URL || "not set",
  });
}
