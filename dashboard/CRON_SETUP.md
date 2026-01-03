# Vercel Cron Jobs Setup

This document explains how the Vercel Cron Jobs system works for the Sync Web Dashboard.

## Overview

The cron system consists of two main components:

1. **vercel.json** - Defines the cron schedule for Vercel
2. **API Routes** - Handle the cron execution logic

## Configuration

### vercel.json

```json
{
  "crons": [
    {
      "path": "/api/cron/check-scheduled-syncs",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

This runs the cron checker every 5 minutes.

### Environment Variables

Make sure these environment variables are set in Vercel:

- `CRON_SECRET` - Secret token to authenticate cron requests
- `NEXT_PUBLIC_CONVEX_URL` - Convex deployment URL
- `WEBHOOK_URL` - URL of the webhook server on VM Windows
- `WEBHOOK_TOKEN` - Token to authenticate webhook requests

## API Routes

### `/api/cron/check-scheduled-syncs`

**Purpose**: Main cron endpoint that checks all apps and triggers syncs based on their schedules.

**Method**: POST (called by Vercel Cron)

**Authentication**: Requires `Authorization: Bearer {CRON_SECRET}` header

**Logic**:
1. Gets all sync apps with `cron_enabled: true`
2. Checks if each app has a running sync (skips if yes)
3. Checks if enough time has passed since last sync (5+ minutes)
4. Triggers sync via Convex action if conditions are met

**Response**:
```json
{
  "success": true,
  "checked_at": "2024-01-01T12:00:00.000Z",
  "apps_checked": 2,
  "results": [
    {
      "app_name": "appclinics",
      "status": "triggered",
      "job_id": "abc123",
      "cron_schedule": "0 2 * * *"
    }
  ]
}
```

### `/api/cron/[app_name]`

**Purpose**: Individual app cron endpoint (for future use with specific schedules).

**Methods**: 
- POST - Trigger sync for specific app
- GET - Health check for specific app

**Authentication**: Requires `Authorization: Bearer {CRON_SECRET}` header

**Usage**: Can be used for app-specific cron jobs in the future.

## How It Works

1. **Vercel Cron** calls `/api/cron/check-scheduled-syncs` every 5 minutes
2. **API Route** authenticates the request using CRON_SECRET
3. **Query Convex** to get all apps with cron enabled
4. **Check Conditions**:
   - Is cron enabled for this app?
   - Is there already a running sync?
   - Has enough time passed since last sync?
5. **Trigger Sync** via Convex action if all conditions are met
6. **Convex Action** calls the webhook server on VM Windows
7. **Webhook Server** executes the Python sync script
8. **Callback** updates the job status in Convex

## Testing

### Health Check
```bash
GET /api/cron/check-scheduled-syncs
```

Returns information about cron-enabled apps without triggering syncs.

### Manual Trigger (for testing)
```bash
POST /api/cron/check-scheduled-syncs
Authorization: Bearer your-cron-secret
```

Manually triggers the cron logic (useful for testing).

## Deployment

1. **Deploy to Vercel**: The vercel.json file will automatically configure the cron jobs
2. **Set Environment Variables**: Make sure all required env vars are set in Vercel dashboard
3. **Test**: Use the health check endpoint to verify configuration

## Monitoring

- Check Vercel Function logs for cron execution
- Check Convex dashboard for sync job records
- Check webhook server logs for sync execution details

## Troubleshooting

### Cron Not Running
- Check Vercel Function logs
- Verify CRON_SECRET is set correctly
- Ensure vercel.json is in the root of the project

### Syncs Not Triggering
- Check if apps have `cron_enabled: true`
- Verify webhook server is accessible
- Check Convex action logs for errors

### Duplicate Syncs
- The system prevents concurrent syncs for the same app
- 5-minute minimum interval between syncs prevents duplicates