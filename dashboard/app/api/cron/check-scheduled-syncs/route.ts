import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../convex/_generated/api';
import * as cron from 'node-cron';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Helper function to check if a cron expression should run now
function shouldRunNow(cronExpression: string, lastRunTime?: number): boolean {
  try {
    if (!cron.validate(cronExpression)) {
      console.error('Invalid cron expression:', cronExpression);
      return false;
    }

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // Parse cron expression (minute hour day month weekday)
    const cronParts = cronExpression.split(' ');
    if (cronParts.length !== 5) {
      console.error('Invalid cron format:', cronExpression);
      return false;
    }
    
    const [minute, hour] = cronParts;
    
    // Check if current time matches the cron schedule
    const cronHour = parseInt(hour);
    const cronMinute = parseInt(minute);
    
    // Allow a 5-minute window for execution (in case cron is slightly delayed)
    const timeDiff = Math.abs((currentHour * 60 + currentMinute) - (cronHour * 60 + cronMinute));
    const withinWindow = timeDiff <= 5;
    
    if (!withinWindow) {
      return false;
    }
    
    // If within time window, check if we already ran today
    if (lastRunTime) {
      const lastRun = new Date(lastRunTime);
      const today = new Date();
      
      // Check if last run was today
      const sameDay = lastRun.getDate() === today.getDate() && 
                     lastRun.getMonth() === today.getMonth() && 
                     lastRun.getFullYear() === today.getFullYear();
      
      if (sameDay) {
        console.log(`Already ran today for cron ${cronExpression}`);
        return false;
      }
    }
    
    return true;
    
  } catch (error) {
    console.error('Error checking cron expression:', cronExpression, error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify Vercel Cron secret
    const authHeader = request.headers.get('authorization');
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;
    
    if (!authHeader || authHeader !== expectedAuth) {
      console.error('Unauthorized cron request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Checking scheduled syncs...');

    // Get all sync apps with cron enabled
    const apps = await convex.query(api.queries.listSyncApps);
    const cronEnabledApps = apps.filter(app => app.cron_enabled && app.cron_schedule);

    const results = [];

    for (const app of cronEnabledApps) {
      try {
        // Get the most recent job to check last run time
        const recentJobs = await convex.query(api.queries.getSyncJobs, { 
          app_id: app._id, 
          limit: 1 
        });
        
        // Check if there's already a running sync for this app
        if (recentJobs.length > 0 && recentJobs[0].status === 'running') {
          console.log(`Skipping ${app.name} - sync already running`);
          results.push({
            app_name: app.name,
            status: 'skipped',
            reason: 'sync_already_running'
          });
          continue;
        }

        // Check if we should run based on cron schedule and last run time
        const lastRunTime = recentJobs.length > 0 ? recentJobs[0].started_at : undefined;
        
        if (!shouldRunNow(app.cron_schedule!, lastRunTime)) {
          console.log(`Skipping ${app.name} - not time to run yet`);
          results.push({
            app_name: app.name,
            status: 'skipped',
            reason: 'not_time_to_run',
            cron_schedule: app.cron_schedule,
            last_run: lastRunTime ? new Date(lastRunTime).toISOString() : null
          });
          continue;
        }

        console.log(`Triggering scheduled sync for app: ${app.name}`);
        const result = await convex.action(api.actions.triggerSync, {
          app_id: app._id,
          triggered_by: 'cron',
        });

        results.push({
          app_name: app.name,
          status: 'triggered',
          job_id: result.job_id,
          cron_schedule: app.cron_schedule
        });

      } catch (error) {
        console.error(`Error processing app ${app.name}:`, error);
        results.push({
          app_name: app.name,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    console.log('Scheduled sync check completed:', results);

    return NextResponse.json({
      success: true,
      checked_at: new Date().toISOString(),
      apps_checked: cronEnabledApps.length,
      results
    });

  } catch (error) {
    console.error('Scheduled sync check error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        checked_at: new Date().toISOString()
      }, 
      { status: 500 }
    );
  }
}

// Health check for the cron checker
export async function GET() {
  try {
    const apps = await convex.query(api.queries.listSyncApps);
    const cronEnabledApps = apps.filter(app => app.cron_enabled);

    return NextResponse.json({
      status: 'healthy',
      total_apps: apps.length,
      cron_enabled_apps: cronEnabledApps.length,
      apps: cronEnabledApps.map(app => ({
        name: app.name,
        cron_schedule: app.cron_schedule,
        cron_enabled: app.cron_enabled
      }))
    });

  } catch (error) {
    console.error('Cron health check error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' }, 
      { status: 500 }
    );
  }
}