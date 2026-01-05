import { NextRequest, NextResponse } from 'next/server';
import { api } from '@/convex/_generated/api';
import { ConvexHttpClient } from 'convex/browser';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name: appName } = await params;

    // Get app configuration from Convex
    const app = await convex.query(api.queries.getSyncAppByName, { name: appName });

    if (!app) {
      return NextResponse.json(
        { 
          success: false, 
          error: `App "${appName}" not found` 
        },
        { status: 404 }
      );
    }

    // Return app configuration in the format expected by webhook server
    return NextResponse.json({
      success: true,
      config: {
        name: app.name,
        deploy_key: app.deploy_key,
        tables: app.tables,
        table_mapping: app.table_mapping || {}
      }
    });

  } catch (error) {
    console.error('Error getting app config:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get app configuration',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}