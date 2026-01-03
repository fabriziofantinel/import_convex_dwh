import { NextRequest, NextResponse } from 'next/server';
import { writeFileSync, readFileSync } from 'fs';
import { join } from 'path';

// Helper function to convert Rome time to UTC
function convertRomeToUTC(cronExpression: string): string {
  const cronParts = cronExpression.split(' ');
  if (cronParts.length !== 5) {
    throw new Error('Invalid cron format');
  }
  
  const [minute, hour, day, month, weekday] = cronParts;
  
  if (hour === '*' || minute === '*') {
    return cronExpression; // Can't convert wildcard expressions
  }
  
  const romeHour = parseInt(hour);
  const romeMinute = parseInt(minute);
  
  // Convert Rome time to UTC (subtract 1 hour for CET, 2 hours for CEST)
  // For simplicity, we'll use CET (UTC+1) - subtract 1 hour
  let utcHour = romeHour - 1;
  
  // Handle day rollover
  if (utcHour < 0) {
    utcHour = 24 + utcHour; // e.g., -1 becomes 23
  }
  
  return `${minute} ${utcHour} ${day} ${month} ${weekday}`;
}

// Helper function to trigger Vercel deployment
async function triggerVercelDeploy(): Promise<boolean> {
  try {
    const vercelToken = process.env.VERCEL_TOKEN;
    const vercelProjectId = process.env.VERCEL_PROJECT_ID;
    
    if (!vercelToken || !vercelProjectId) {
      console.error('Missing Vercel credentials');
      return false;
    }
    
    const response = await fetch(`https://api.vercel.com/v13/deployments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${vercelToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: vercelProjectId,
        gitSource: {
          type: 'github',
          repoId: process.env.GITHUB_REPO_ID,
          ref: 'main'
        }
      })
    });
    
    if (!response.ok) {
      console.error('Failed to trigger Vercel deployment:', await response.text());
      return false;
    }
    
    const deployment = await response.json();
    console.log('Vercel deployment triggered:', deployment.id);
    return true;
    
  } catch (error) {
    console.error('Error triggering Vercel deployment:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { cron_schedule } = await request.json();
    
    if (!cron_schedule) {
      return NextResponse.json({ error: 'Missing cron_schedule' }, { status: 400 });
    }
    
    // Convert Rome time to UTC
    const utcCronSchedule = convertRomeToUTC(cron_schedule);
    console.log(`Converting Rome time ${cron_schedule} to UTC ${utcCronSchedule}`);
    
    // Read current vercel.json
    const vercelJsonPath = join(process.cwd(), 'vercel.json');
    let vercelConfig;
    
    try {
      const vercelJsonContent = readFileSync(vercelJsonPath, 'utf8');
      vercelConfig = JSON.parse(vercelJsonContent);
    } catch (error) {
      // Create default config if file doesn't exist
      vercelConfig = {
        crons: []
      };
    }
    
    // Update or add the cron job
    const cronJobIndex = vercelConfig.crons?.findIndex(
      (cron: any) => cron.path === '/api/cron/check-scheduled-syncs'
    );
    
    const newCronJob = {
      path: '/api/cron/check-scheduled-syncs',
      schedule: utcCronSchedule
    };
    
    if (cronJobIndex >= 0) {
      // Update existing cron job
      vercelConfig.crons[cronJobIndex] = newCronJob;
    } else {
      // Add new cron job
      if (!vercelConfig.crons) {
        vercelConfig.crons = [];
      }
      vercelConfig.crons.push(newCronJob);
    }
    
    // Write updated vercel.json
    writeFileSync(vercelJsonPath, JSON.stringify(vercelConfig, null, 2));
    console.log('Updated vercel.json with new cron schedule:', utcCronSchedule);
    
    // Trigger Vercel deployment to apply the new cron schedule
    const deploymentTriggered = await triggerVercelDeploy();
    
    return NextResponse.json({
      success: true,
      rome_schedule: cron_schedule,
      utc_schedule: utcCronSchedule,
      deployment_triggered: deploymentTriggered,
      message: deploymentTriggered 
        ? 'Cron schedule updated and deployment triggered'
        : 'Cron schedule updated but deployment failed - manual redeploy required'
    });
    
  } catch (error) {
    console.error('Error updating cron schedule:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        success: false
      }, 
      { status: 500 }
    );
  }
}