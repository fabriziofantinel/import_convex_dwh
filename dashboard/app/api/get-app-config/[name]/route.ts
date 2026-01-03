import { NextRequest, NextResponse } from 'next/server';
import { api } from '../../../../convex/_generated/api';
import { fetchQuery } from 'convex/nextjs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name: appName } = await params;

    if (!appName) {
      return NextResponse.json(
        { error: 'App name is required' },
        { status: 400 }
      );
    }

    // Query Convex for the app configuration
    const app = await fetchQuery(api.queries.getSyncAppByName, { name: appName });

    if (!app) {
      return NextResponse.json(
        { error: `App "${appName}" not found` },
        { status: 404 }
      );
    }

    // Return the configuration in the expected format
    return NextResponse.json({
      success: true,
      config: {
        name: app.name,
        deploy_key: app.deploy_key,
        tables: app.tables || [],
        table_mapping: app.table_mapping || {}
      }
    });

  } catch (error) {
    console.error('Error getting app config:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get app configuration',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}