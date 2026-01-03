import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../convex/_generated/api';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ app_name: string }> }
) {
  try {
    // Verify Vercel Cron secret
    const authHeader = request.headers.get('authorization');
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;
    
    if (!authHeader || authHeader !== expectedAuth) {
      console.error('Unauthorized cron request:', { authHeader, expectedAuth: !!process.env.CRON_SECRET });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { app_name } = await params;

    // Get all sync apps
    const apps = await convex.query(api.queries.listSyncApps);
    const app = apps.find((a) => a.name === app_name);

    if (!app) {
      console.error('App not found:', app_name);
      return NextResponse.json({ error: 'App not found' }, { status: 404 });
    }

    // Check if cron is enabled for this app
    if (!app.cron_enabled) {
      console.log('Cron disabled for app:', app_name);
      return NextResponse.json({ 
        message: 'Cron disabled for this app',
        app_name,
        cron_enabled: false 
      });
    }

    // Check if there's already a running sync for this app
    const recentJobs = await convex.query(api.queries.getSyncJobs, { 
      app_id: app._id, 
      limit: 1 
    });
    
    if (recentJobs.length > 0 && recentJobs[0].status === 'running') {
      console.log('Sync already running for app:', app_name);
      return NextResponse.json({ 
        message: 'Sync already running for this app',
        app_name,
        status: 'skipped'
      });
    }

    // Trigger sync via Convex action
    console.log('Triggering cron sync for app:', app_name);
    const result = await convex.action(api.actions.triggerSync, {
      app_id: app._id,
      triggered_by: 'cron',
    });

    console.log('Cron sync triggered successfully:', { app_name, job_id: result.job_id });
    
    return NextResponse.json({ 
      success: true,
      app_name,
      job_id: result.job_id,
      message: `Sync triggered for ${app_name}`
    });

  } catch (error) {
    console.error('Cron error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        app_name: (await params).app_name
      }, 
      { status: 500 }
    );
  }
}

// Health check endpoint for cron
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ app_name: string }> }
) {
  try {
    const { app_name } = await params;
    
    // Get app info
    const apps = await convex.query(api.queries.listSyncApps);
    const app = apps.find((a) => a.name === app_name);

    if (!app) {
      return NextResponse.json({ error: 'App not found' }, { status: 404 });
    }

    // Get recent job status
    const recentJobs = await convex.query(api.queries.getSyncJobs, { 
      app_id: app._id, 
      limit: 1 
    });

    return NextResponse.json({
      app_name,
      cron_enabled: app.cron_enabled,
      cron_schedule: app.cron_schedule,
      last_job: recentJobs[0] || null,
      status: 'healthy'
    });

  } catch (error) {
    console.error('Cron health check error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' }, 
      { status: 500 }
    );
  }
}