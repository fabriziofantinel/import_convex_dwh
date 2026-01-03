# Convex Deployment Guide

This guide covers deploying the Convex backend for the Sync Web Dashboard.

## Prerequisites

1. **Convex Account**: Sign up at [convex.dev](https://convex.dev)
2. **Node.js**: Version 18 or higher
3. **Convex CLI**: Installed via npm (included in project dependencies)

## Initial Setup

### 1. Create Convex Project

```bash
cd dashboard
npx convex dev
```

This will:
- Create a new Convex project (or link to existing)
- Generate `.env.local` with `CONVEX_DEPLOYMENT` variable
- Start development server

### 2. Configure Environment Variables

The `npx convex dev` command creates `.env.local` with:

```bash
# Convex deployment
CONVEX_DEPLOYMENT=dev:your-team:your-project
NEXT_PUBLIC_CONVEX_URL=https://your-dev-deployment.convex.cloud
```

## Deploy to Production

### Method 1: Deploy via CLI (Recommended)

1. **Deploy Convex Functions**
   ```bash
   cd dashboard
   npx convex deploy --prod
   ```

2. **Copy Production URL**
   The command outputs:
   ```
   ✓ Deployed to https://your-prod-deployment.convex.cloud
   ```

3. **Update Environment Variables**
   - Copy the production URL
   - Add to Vercel environment variables as `NEXT_PUBLIC_CONVEX_URL`

### Method 2: Deploy via Convex Dashboard

1. Go to [dashboard.convex.dev](https://dashboard.convex.dev)
2. Select your project
3. Click "Deploy to Production"
4. Copy the production deployment URL

## Environment Variables for Convex

Convex functions need these environment variables (set in Convex Dashboard):

### Webhook Configuration

```bash
WEBHOOK_URL=https://your-vm-domain.com:5000
WEBHOOK_TOKEN=your-webhook-secret-token
```

**How to set:**
1. Go to Convex Dashboard → Settings → Environment Variables
2. Add `WEBHOOK_URL` and `WEBHOOK_TOKEN`
3. Redeploy: `npx convex deploy --prod`

## Convex Schema

The schema is already defined in `convex/schema.ts`:

- `sync_apps`: Application configurations
- `sync_jobs`: Sync execution history
- `sql_config`: SQL Server connection settings
- `email_config`: Email notification settings

## Convex Functions

### Queries (Read Operations)

- `listSyncApps`: Get all sync applications
- `getSyncApp`: Get single application by ID
- `getSyncJobs`: Get sync job history for an app
- `getSqlConfig`: Get SQL Server configuration
- `getEmailConfig`: Get email notification configuration

### Mutations (Write Operations)

- `createSyncApp`: Create new sync application
- `updateSyncApp`: Update existing application
- `deleteSyncApp`: Delete application
- `createSyncJob`: Create new sync job record
- `updateSyncJob`: Update sync job status
- `updateSqlConfig`: Update SQL Server configuration
- `updateEmailConfig`: Update email configuration

### Actions (External Calls)

- `triggerSync`: Trigger sync via webhook to VM Windows

### HTTP Endpoints

- `POST /api/sync-callback`: Webhook callback from VM Windows

## Testing Convex Deployment

### 1. Test from Dashboard

```bash
# Open Convex dashboard
npx convex dashboard
```

Navigate to:
- **Functions**: Test queries and mutations
- **Data**: Browse database tables
- **Logs**: View function execution logs

### 2. Test from Code

```typescript
// Test query
const apps = await convex.query(api.queries.listSyncApps);
console.log('Apps:', apps);

// Test mutation
const appId = await convex.mutation(api.mutations.createSyncApp, {
  name: 'test-app',
  deploy_key: 'preview:team:project|token',
  tables: ['table1'],
  cron_enabled: false,
  created_by: 'test-user',
});
console.log('Created app:', appId);
```

## Monitoring

### Convex Dashboard

Monitor your deployment:

1. **Functions**: View execution logs and performance
2. **Database**: Browse and query data
3. **Logs**: Real-time function logs
4. **Usage**: Monitor storage and function calls

### Logs

View logs in real-time:

```bash
npx convex logs --prod
```

## Data Migration

### Export Data from Development

```bash
npx convex export --path ./backup.zip
```

### Import Data to Production

```bash
npx convex import --prod --path ./backup.zip
```

## Backup and Recovery

### Automatic Backups

Convex automatically backs up your data. To restore:

1. Go to Convex Dashboard → Settings → Backups
2. Select backup point
3. Click "Restore"

### Manual Backup

```bash
# Export current data
npx convex export --prod --path ./backup-$(date +%Y%m%d).zip
```

## Security

### Authentication

Convex functions are protected by:
- Auth0 JWT validation (for user-facing operations)
- Webhook token validation (for VM Windows callbacks)

### Data Encryption

- Passwords are encrypted before storage (AES-256)
- Use `encryption.ts` utility for encrypt/decrypt operations

### Access Control

Configure in Convex Dashboard → Settings → Access Control:
- Enable authentication for all functions
- Configure CORS for your Vercel domain

## Troubleshooting

### Deployment Fails

**Error: Schema validation failed**
- Check `convex/schema.ts` for syntax errors
- Ensure all types are correctly defined

**Error: Function not found**
- Verify function is exported in `convex/queries.ts`, `convex/mutations.ts`, or `convex/actions.ts`
- Check function name matches import in frontend

### Runtime Errors

**Error: Environment variable not set**
- Add missing variables in Convex Dashboard → Settings → Environment Variables
- Redeploy: `npx convex deploy --prod`

**Error: Webhook call fails**
- Verify `WEBHOOK_URL` is publicly accessible
- Check `WEBHOOK_TOKEN` matches webhook server
- Test webhook: `curl -X POST $WEBHOOK_URL/health`

### Performance Issues

**Slow queries**
- Add indexes to frequently queried fields
- Use `withIndex()` in queries
- Check query performance in Convex Dashboard

**Rate limiting**
- Upgrade to Pro plan for higher limits
- Optimize function calls to reduce usage

## Scaling

### Convex Limits

**Free Tier:**
- 1GB storage
- 1M function calls/month
- 1GB bandwidth

**Pro Tier:**
- 10GB storage
- 10M function calls/month
- 10GB bandwidth
- Priority support

### Optimization Tips

1. **Use indexes**: Add indexes for frequently queried fields
2. **Batch operations**: Combine multiple mutations when possible
3. **Cache results**: Use React Query or SWR for client-side caching
4. **Paginate**: Use pagination for large result sets

## Continuous Deployment

### GitHub Actions

Create `.github/workflows/convex-deploy.yml`:

```yaml
name: Deploy Convex

on:
  push:
    branches: [main]
    paths:
      - 'dashboard/convex/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: cd dashboard && npm ci
      - run: cd dashboard && npx convex deploy --prod
        env:
          CONVEX_DEPLOY_KEY: ${{ secrets.CONVEX_DEPLOY_KEY }}
```

**Setup:**
1. Generate deploy key: `npx convex deploy-key`
2. Add to GitHub Secrets as `CONVEX_DEPLOY_KEY`

## Rollback

If deployment fails:

```bash
# View deployment history
npx convex deployments --prod

# Rollback to previous deployment
npx convex rollback --prod --to <deployment-id>
```

## Support

- **Convex Docs**: [docs.convex.dev](https://docs.convex.dev)
- **Convex Discord**: [convex.dev/community](https://convex.dev/community)
- **GitHub Issues**: Report bugs and feature requests

## Next Steps

After deployment:
1. Test all queries and mutations
2. Verify webhook callback works
3. Monitor logs for errors
4. Set up alerts for failures
5. Configure backup schedule
