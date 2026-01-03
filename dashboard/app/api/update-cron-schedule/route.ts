import { NextRequest, NextResponse } from 'next/server';

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

// Helper function to update vercel.json via GitHub API
async function updateVercelJsonViaGitHub(utcCronSchedule: string): Promise<boolean> {
  try {
    const githubToken = process.env.GITHUB_TOKEN;
    const githubRepo = process.env.GITHUB_REPO; // format: "owner/repo"
    
    if (!githubToken || !githubRepo) {
      console.error('Missing GitHub credentials');
      return false;
    }
    
    // Get current vercel.json from GitHub
    const getFileResponse = await fetch(
      `https://api.github.com/repos/${githubRepo}/contents/dashboard/vercel.json`,
      {
        headers: {
          'Authorization': `Bearer ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      }
    );
    
    if (!getFileResponse.ok) {
      console.error('Failed to get vercel.json from GitHub:', await getFileResponse.text());
      return false;
    }
    
    const fileData = await getFileResponse.json();
    const currentContent = JSON.parse(atob(fileData.content));
    
    // Update the cron schedule
    const newCronJob = {
      path: '/api/cron/check-scheduled-syncs',
      schedule: utcCronSchedule
    };
    
    const cronJobIndex = currentContent.crons?.findIndex(
      (cron: any) => cron.path === '/api/cron/check-scheduled-syncs'
    );
    
    if (cronJobIndex >= 0) {
      currentContent.crons[cronJobIndex] = newCronJob;
    } else {
      if (!currentContent.crons) {
        currentContent.crons = [];
      }
      currentContent.crons.push(newCronJob);
    }
    
    // Update file on GitHub
    const updateResponse = await fetch(
      `https://api.github.com/repos/${githubRepo}/contents/dashboard/vercel.json`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Update cron schedule to ${utcCronSchedule} (${new Date().toISOString()})`,
          content: btoa(JSON.stringify(currentContent, null, 2)),
          sha: fileData.sha,
        }),
      }
    );
    
    if (!updateResponse.ok) {
      console.error('Failed to update vercel.json on GitHub:', await updateResponse.text());
      return false;
    }
    
    console.log('Successfully updated vercel.json on GitHub');
    return true;
    
  } catch (error) {
    console.error('Error updating vercel.json via GitHub:', error);
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
    
    // Update vercel.json via GitHub API
    const githubUpdateSuccess = await updateVercelJsonViaGitHub(utcCronSchedule);
    
    return NextResponse.json({
      success: githubUpdateSuccess,
      rome_schedule: cron_schedule,
      utc_schedule: utcCronSchedule,
      github_updated: githubUpdateSuccess,
      message: githubUpdateSuccess 
        ? 'Cron schedule updated on GitHub - Vercel will auto-deploy'
        : 'Failed to update GitHub - manual update required'
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