# Design Document - Sync Web Dashboard

## Overview

Web dashboard per gestire configurazioni Convex → SQL Server sync con interfaccia React, backend Convex, autenticazione Auth0, e webhook endpoint su VM Windows per eseguire i sync Python esistenti.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         VERCEL                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │           React Frontend (Next.js)                     │ │
│  │  - Auth0 Authentication                                │ │
│  │  - Dashboard UI                                        │ │
│  │  - Configuration Forms                                 │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │           API Routes                                   │ │
│  │  - /api/cron/[app_name] (Vercel Cron trigger)        │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ HTTPS
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                        CONVEX                                │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Database Tables:                                      │ │
│  │  - sync_apps (configurations)                          │ │
│  │  - sync_jobs (execution history)                       │ │
│  │  - sql_config (SQL Server settings)                    │ │
│  │  - email_config (SMTP settings)                        │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Convex Functions:                                     │ │
│  │  - Queries (read data)                                 │ │
│  │  - Mutations (write data)                              │ │
│  │  - Actions (trigger sync via webhook)                  │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ HTTPS Webhook
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    VM WINDOWS                                │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Flask Webhook Server (Python)                         │ │
│  │  - POST /api/sync/:app_name                            │ │
│  │  - Token authentication                                │ │
│  │  - Execute sync.py                                     │ │
│  │  - Send callback to Convex                             │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Existing Python Sync (sync.py)                        │ │
│  │  - Unchanged, reused as-is                             │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. React Frontend (Next.js on Vercel)

**Pages:**
- `/` - Dashboard home (lista applicazioni)
- `/apps/new` - Form nuova applicazione
- `/apps/[id]/edit` - Form modifica applicazione
- `/apps/[id]/logs` - Log esecuzioni
- `/settings` - Configurazioni globali (SQL, Email)
- `/login` - Auth0 login redirect

**Components:**
- `AppCard` - Card per visualizzare sync app con stato e azioni
- `AppForm` - Form per creare/modificare applicazioni
- `SyncJobList` - Lista esecuzioni sync con dettagli
- `LogViewer` - Visualizzatore log dettagliato
- `SettingsForm` - Form configurazioni globali
- `Navbar` - Navigazione e logout
- `StatusBadge` - Badge colorato per stato sync

**Auth0 Integration:**
```typescript
// lib/auth0.ts
import { Auth0Provider } from '@auth0/auth0-react';

export const auth0Config = {
  domain: process.env.NEXT_PUBLIC_AUTH0_DOMAIN,
  clientId: process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID,
  redirectUri: process.env.NEXT_PUBLIC_AUTH0_REDIRECT_URI,
  audience: process.env.NEXT_PUBLIC_AUTH0_AUDIENCE
};
```

**Convex Integration:**
```typescript
// lib/convex.ts
import { ConvexProvider, ConvexReactClient } from 'convex/react';

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL);
```

### 2. Convex Backend

**Schema (convex/schema.ts):**
```typescript
import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  sync_apps: defineTable({
    name: v.string(),
    deploy_key: v.string(),
    tables: v.array(v.string()),
    table_mapping: v.optional(v.object({})),
    cron_schedule: v.optional(v.string()),
    cron_enabled: v.boolean(),
    created_at: v.number(),
    updated_at: v.number(),
    created_by: v.string(), // Auth0 user ID
  }).index('by_name', ['name']),

  sync_jobs: defineTable({
    app_id: v.id('sync_apps'),
    app_name: v.string(),
    status: v.union(
      v.literal('pending'),
      v.literal('running'),
      v.literal('success'),
      v.literal('failed')
    ),
    started_at: v.number(),
    completed_at: v.optional(v.number()),
    duration_seconds: v.optional(v.number()),
    tables_processed: v.optional(v.number()),
    rows_imported: v.optional(v.number()),
    error_message: v.optional(v.string()),
    log_content: v.optional(v.string()),
    triggered_by: v.union(
      v.literal('manual'),
      v.literal('cron')
    ),
  }).index('by_app', ['app_id'])
    .index('by_status', ['status']),

  sql_config: defineTable({
    host: v.string(),
    database: v.string(),
    schema: v.string(),
    username: v.string(),
    password_encrypted: v.string(),
    timeout: v.number(),
    updated_at: v.number(),
    updated_by: v.string(),
  }),

  email_config: defineTable({
    smtp_host: v.string(),
    smtp_port: v.number(),
    smtp_user: v.string(),
    smtp_password_encrypted: v.string(),
    from_email: v.string(),
    to_emails: v.array(v.string()),
    use_tls: v.boolean(),
    updated_at: v.number(),
    updated_by: v.string(),
  }),
});
```

**Queries (convex/queries.ts):**
```typescript
import { query } from './_generated/server';
import { v } from 'convex/values';

// Get all sync apps
export const listSyncApps = query({
  handler: async (ctx) => {
    return await ctx.db.query('sync_apps').collect();
  },
});

// Get sync app by ID
export const getSyncApp = query({
  args: { id: v.id('sync_apps') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Get recent sync jobs for an app
export const getSyncJobs = query({
  args: { app_id: v.id('sync_apps'), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;
    return await ctx.db
      .query('sync_jobs')
      .withIndex('by_app', (q) => q.eq('app_id', args.app_id))
      .order('desc')
      .take(limit);
  },
});

// Get SQL config
export const getSqlConfig = query({
  handler: async (ctx) => {
    const configs = await ctx.db.query('sql_config').collect();
    return configs[0]; // Should only be one
  },
});

// Get email config
export const getEmailConfig = query({
  handler: async (ctx) => {
    const configs = await ctx.db.query('email_config').collect();
    return configs[0];
  },
});
```

**Mutations (convex/mutations.ts):**
```typescript
import { mutation } from './_generated/server';
import { v } from 'convex/values';

// Create sync app
export const createSyncApp = mutation({
  args: {
    name: v.string(),
    deploy_key: v.string(),
    tables: v.array(v.string()),
    table_mapping: v.optional(v.object({})),
    cron_schedule: v.optional(v.string()),
    cron_enabled: v.boolean(),
    created_by: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert('sync_apps', {
      ...args,
      created_at: now,
      updated_at: now,
    });
  },
});

// Update sync app
export const updateSyncApp = mutation({
  args: {
    id: v.id('sync_apps'),
    name: v.optional(v.string()),
    deploy_key: v.optional(v.string()),
    tables: v.optional(v.array(v.string())),
    table_mapping: v.optional(v.object({})),
    cron_schedule: v.optional(v.string()),
    cron_enabled: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, {
      ...updates,
      updated_at: Date.now(),
    });
  },
});

// Delete sync app
export const deleteSyncApp = mutation({
  args: { id: v.id('sync_apps') },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// Create sync job
export const createSyncJob = mutation({
  args: {
    app_id: v.id('sync_apps'),
    app_name: v.string(),
    triggered_by: v.union(v.literal('manual'), v.literal('cron')),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('sync_jobs', {
      ...args,
      status: 'pending',
      started_at: Date.now(),
    });
  },
});

// Update sync job status
export const updateSyncJob = mutation({
  args: {
    id: v.id('sync_jobs'),
    status: v.union(
      v.literal('running'),
      v.literal('success'),
      v.literal('failed')
    ),
    completed_at: v.optional(v.number()),
    duration_seconds: v.optional(v.number()),
    tables_processed: v.optional(v.number()),
    rows_imported: v.optional(v.number()),
    error_message: v.optional(v.string()),
    log_content: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

// Update SQL config
export const updateSqlConfig = mutation({
  args: {
    host: v.string(),
    database: v.string(),
    schema: v.string(),
    username: v.string(),
    password_encrypted: v.string(),
    timeout: v.number(),
    updated_by: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query('sql_config').first();
    
    if (existing) {
      await ctx.db.patch(existing._id, {
        ...args,
        updated_at: Date.now(),
      });
    } else {
      await ctx.db.insert('sql_config', {
        ...args,
        updated_at: Date.now(),
      });
    }
  },
});

// Update email config
export const updateEmailConfig = mutation({
  args: {
    smtp_host: v.string(),
    smtp_port: v.number(),
    smtp_user: v.string(),
    smtp_password_encrypted: v.string(),
    from_email: v.string(),
    to_emails: v.array(v.string()),
    use_tls: v.boolean(),
    updated_by: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query('email_config').first();
    
    if (existing) {
      await ctx.db.patch(existing._id, {
        ...args,
        updated_at: Date.now(),
      });
    } else {
      await ctx.db.insert('email_config', {
        ...args,
        updated_at: Date.now(),
      });
    }
  },
});
```

**Actions (convex/actions.ts):**
```typescript
import { action } from './_generated/server';
import { v } from 'convex/values';
import { api } from './_generated/api';

// Trigger sync via webhook
export const triggerSync = action({
  args: {
    app_id: v.id('sync_apps'),
    triggered_by: v.union(v.literal('manual'), v.literal('cron')),
  },
  handler: async (ctx, args) => {
    // Get app config
    const app = await ctx.runQuery(api.queries.getSyncApp, { id: args.app_id });
    if (!app) throw new Error('App not found');

    // Create sync job
    const jobId = await ctx.runMutation(api.mutations.createSyncJob, {
      app_id: args.app_id,
      app_name: app.name,
      triggered_by: args.triggered_by,
    });

    // Update job to running
    await ctx.runMutation(api.mutations.updateSyncJob, {
      id: jobId,
      status: 'running',
    });

    // Call webhook on VM Windows
    const webhookUrl = process.env.WEBHOOK_URL; // e.g., http://your-vm-ip:5000
    const webhookToken = process.env.WEBHOOK_TOKEN;

    try {
      const response = await fetch(`${webhookUrl}/api/sync/${app.name}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${webhookToken}`,
        },
        body: JSON.stringify({
          job_id: jobId,
          app_name: app.name,
          deploy_key: app.deploy_key,
          tables: app.tables,
          table_mapping: app.table_mapping,
        }),
      });

      if (!response.ok) {
        throw new Error(`Webhook failed: ${response.statusText}`);
      }

      // Webhook will call back to update job status
      return { success: true, job_id: jobId };
    } catch (error) {
      // Update job to failed
      await ctx.runMutation(api.mutations.updateSyncJob, {
        id: jobId,
        status: 'failed',
        completed_at: Date.now(),
        error_message: error.message,
      });

      throw error;
    }
  },
});
```

### 3. Flask Webhook Server (VM Windows)

**File: webhook_server.py**
```python
from flask import Flask, request, jsonify
import subprocess
import os
import json
import threading
from datetime import datetime
import requests

app = Flask(__name__)

# Configuration
WEBHOOK_TOKEN = os.getenv('WEBHOOK_TOKEN', 'your-secret-token')
CONVEX_WEBHOOK_URL = os.getenv('CONVEX_WEBHOOK_URL')  # Convex HTTP action endpoint
SYNC_SCRIPT_PATH = os.path.join(os.path.dirname(__file__), 'sync.py')
PYTHON_EXE = r"C:\Users\Fabrizio Fantinel\AppData\Local\Programs\Python\Python311\python.exe"

# Track running syncs
running_syncs = {}

def authenticate_request():
    """Validate webhook token"""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return False
    
    token = auth_header.split(' ')[1]
    return token == WEBHOOK_TOKEN

def run_sync_async(job_id, app_name, config_data):
    """Run sync.py in background thread"""
    try:
        # Create temporary config file
        temp_config = f'config_{app_name}_{job_id}.json'
        with open(temp_config, 'w') as f:
            json.dump(config_data, f)
        
        # Execute sync.py
        result = subprocess.run(
            [PYTHON_EXE, SYNC_SCRIPT_PATH, app_name, '--config', temp_config],
            capture_output=True,
            text=True,
            timeout=300  # 5 minutes
        )
        
        # Parse output for statistics
        stats = parse_sync_output(result.stdout)
        
        # Send callback to Convex
        callback_data = {
            'job_id': job_id,
            'status': 'success' if result.returncode == 0 else 'failed',
            'completed_at': int(datetime.now().timestamp() * 1000),
            'duration_seconds': stats.get('duration', 0),
            'tables_processed': stats.get('tables_processed', 0),
            'rows_imported': stats.get('rows_imported', 0),
            'error_message': result.stderr if result.returncode != 0 else None,
            'log_content': result.stdout + '\n' + result.stderr,
        }
        
        requests.post(
            CONVEX_WEBHOOK_URL,
            json=callback_data,
            headers={'Content-Type': 'application/json'}
        )
        
        # Cleanup
        os.remove(temp_config)
        
    except Exception as e:
        # Send error callback
        requests.post(
            CONVEX_WEBHOOK_URL,
            json={
                'job_id': job_id,
                'status': 'failed',
                'completed_at': int(datetime.now().timestamp() * 1000),
                'error_message': str(e),
            },
            headers={'Content-Type': 'application/json'}
        )
    
    finally:
        # Remove from running syncs
        if app_name in running_syncs:
            del running_syncs[app_name]

def parse_sync_output(output):
    """Parse sync.py output for statistics"""
    stats = {}
    
    # Extract duration
    if 'Duration:' in output:
        duration_line = [l for l in output.split('\n') if 'Duration:' in l][0]
        duration = float(duration_line.split(':')[1].strip().replace('s', ''))
        stats['duration'] = duration
    
    # Extract tables processed
    if 'Tables processed:' in output:
        tables_line = [l for l in output.split('\n') if 'Tables processed:' in l][0]
        tables = int(tables_line.split(':')[1].strip())
        stats['tables_processed'] = tables
    
    # Extract rows imported
    if 'Total rows imported:' in output:
        rows_line = [l for l in output.split('\n') if 'Total rows imported:' in l][0]
        rows = int(rows_line.split(':')[1].strip())
        stats['rows_imported'] = rows
    
    return stats

@app.route('/api/sync/<app_name>', methods=['POST'])
def trigger_sync(app_name):
    """Webhook endpoint to trigger sync"""
    # Authenticate
    if not authenticate_request():
        return jsonify({'error': 'Unauthorized'}), 401
    
    # Check if sync already running
    if app_name in running_syncs:
        return jsonify({'error': 'Sync already running for this app'}), 409
    
    # Get request data
    data = request.json
    job_id = data.get('job_id')
    
    # Build config data
    config_data = {
        'convex_apps': {
            app_name: {
                'deploy_key': data.get('deploy_key'),
                'tables': data.get('tables'),
                'table_mapping': data.get('table_mapping'),
            }
        },
        # SQL and email config will be fetched from Convex by sync.py
    }
    
    # Mark as running
    running_syncs[app_name] = job_id
    
    # Start sync in background thread
    thread = threading.Thread(
        target=run_sync_async,
        args=(job_id, app_name, config_data)
    )
    thread.start()
    
    return jsonify({
        'success': True,
        'job_id': job_id,
        'message': f'Sync started for {app_name}'
    }), 202

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'running_syncs': list(running_syncs.keys())
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
```

### 4. Vercel Cron Jobs

**File: vercel.json**
```json
{
  "crons": [
    {
      "path": "/api/cron/appclinics",
      "schedule": "0 2 * * *"
    }
  ]
}
```

**File: pages/api/cron/[app_name].ts**
```typescript
import { NextApiRequest, NextApiResponse } from 'next';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../convex/_generated/api';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Verify Vercel Cron secret
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { app_name } = req.query;

  try {
    // Get app by name
    const apps = await convex.query(api.queries.listSyncApps);
    const app = apps.find((a) => a.name === app_name);

    if (!app) {
      return res.status(404).json({ error: 'App not found' });
    }

    // Check if cron is enabled
    if (!app.cron_enabled) {
      return res.status(200).json({ message: 'Cron disabled for this app' });
    }

    // Trigger sync
    await convex.action(api.actions.triggerSync, {
      app_id: app._id,
      triggered_by: 'cron',
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Cron error:', error);
    return res.status(500).json({ error: error.message });
  }
}
```

## Data Models

### SyncApp
```typescript
{
  _id: Id<"sync_apps">,
  name: string,                    // "appclinics"
  deploy_key: string,              // "preview:team:project|token"
  tables: string[],                // ["cliniche", "users"]
  table_mapping?: Record<string, string>,  // { "cliniche": "convex_cliniche" }
  cron_schedule?: string,          // "0 2 * * *"
  cron_enabled: boolean,
  created_at: number,
  updated_at: number,
  created_by: string,              // Auth0 user ID
}
```

### SyncJob
```typescript
{
  _id: Id<"sync_jobs">,
  app_id: Id<"sync_apps">,
  app_name: string,
  status: "pending" | "running" | "success" | "failed",
  started_at: number,
  completed_at?: number,
  duration_seconds?: number,
  tables_processed?: number,
  rows_imported?: number,
  error_message?: string,
  log_content?: string,
  triggered_by: "manual" | "cron",
}
```

### SqlConfig
```typescript
{
  _id: Id<"sql_config">,
  host: string,
  database: string,
  schema: string,
  username: string,
  password_encrypted: string,
  timeout: number,
  updated_at: number,
  updated_by: string,
}
```

### EmailConfig
```typescript
{
  _id: Id<"email_config">,
  smtp_host: string,
  smtp_port: number,
  smtp_user: string,
  smtp_password_encrypted: string,
  from_email: string,
  to_emails: string[],
  use_tls: boolean,
  updated_at: number,
  updated_by: string,
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Authentication Required
*For any* unauthenticated request to protected routes, the system should redirect to Auth0 login
**Validates: Requirements 1.1**

### Property 2: Configuration Persistence
*For any* sync app configuration saved, retrieving it should return the same values
**Validates: Requirements 2.3**

### Property 3: Sync Job Creation
*For any* manual sync trigger, a sync job record should be created with status "pending"
**Validates: Requirements 3.1**

### Property 4: Concurrent Sync Prevention
*For any* app with a running sync, attempting to start another sync should be rejected
**Validates: Requirements 3.6**

### Property 5: Webhook Authentication
*For any* webhook request without valid token, the request should be rejected with 401
**Validates: Requirements 5.2**

### Property 6: Job Status Transition
*For any* sync job, status transitions should follow: pending → running → (success | failed)
**Validates: Requirements 3.3, 3.4, 3.5**

### Property 7: Configuration Validation
*For any* deploy_key input, it should match the format "preview:team:project|token"
**Validates: Requirements 2.7**

### Property 8: Cron Schedule Validation
*For any* cron schedule input, it should be a valid cron expression
**Validates: Requirements 6.1**

### Property 9: Password Encryption
*For any* password saved (SQL or SMTP), it should be encrypted before storage
**Validates: Requirements 10.3**

### Property 10: Log Persistence
*For any* completed sync job, the log content should be saved and retrievable
**Validates: Requirements 4.4**

## Error Handling

### Frontend Errors
- **Network errors**: Show toast notification, retry button
- **Validation errors**: Show inline form errors
- **Auth errors**: Redirect to login
- **API errors**: Show error message with details

### Backend Errors
- **Webhook timeout**: Mark job as failed, send email notification
- **Webhook unreachable**: Mark job as failed, log error
- **Convex errors**: Return 500 with error message
- **Auth0 errors**: Return 401 with error message

### Webhook Server Errors
- **Sync.py execution error**: Send callback with error details
- **Config file error**: Send callback with validation error
- **Concurrent sync**: Return 409 Conflict

## Testing Strategy

### Unit Tests
- React components rendering
- Form validation logic
- Convex queries/mutations
- Webhook server endpoints
- Auth0 integration

### Integration Tests
- End-to-end sync flow (UI → Convex → Webhook → Callback)
- Cron job triggering
- Auth0 login flow
- Configuration CRUD operations

### Property-Based Tests
- Each correctness property implemented as property test
- Minimum 100 iterations per test
- Tag format: **Feature: sync-web-dashboard, Property {number}: {property_text}**

## Security Considerations

1. **Auth0 JWT Validation**: Validate tokens on every API request
2. **Webhook Token**: Use strong random token, rotate periodically
3. **Password Encryption**: Use AES-256 for encrypting passwords in Convex
4. **HTTPS Only**: Enforce HTTPS for all communications
5. **Input Sanitization**: Validate and sanitize all user inputs
6. **Rate Limiting**: Implement rate limiting on webhook endpoint
7. **Audit Logging**: Log all configuration changes and sync executions

## Deployment

### Vercel Deployment
```bash
# Install dependencies
npm install

# Build
npm run build

# Deploy
vercel --prod
```

### Convex Deployment
```bash
# Deploy Convex functions
npx convex deploy --prod
```

### Webhook Server Deployment (VM Windows)
```bash
# Install dependencies
pip install flask requests

# Run as Windows Service
python webhook_server.py
```

### Environment Variables

**Vercel:**
- `NEXT_PUBLIC_AUTH0_DOMAIN`
- `NEXT_PUBLIC_AUTH0_CLIENT_ID`
- `NEXT_PUBLIC_AUTH0_REDIRECT_URI`
- `NEXT_PUBLIC_AUTH0_AUDIENCE`
- `NEXT_PUBLIC_CONVEX_URL`
- `CRON_SECRET`

**Convex:**
- `WEBHOOK_URL` (VM Windows IP/domain)
- `WEBHOOK_TOKEN`

**VM Windows:**
- `WEBHOOK_TOKEN`
- `CONVEX_WEBHOOK_URL` (Convex HTTP action endpoint)

## Notes

- Il codice Python sync.py rimane invariato
- Il webhook server deve essere accessibile pubblicamente (port forwarding o ngrok)
- Convex ha limiti di storage (1GB free tier)
- Vercel Cron ha limiti di esecuzione (60s su Pro)
- Auth0 ha limiti di utenti (7000 free tier)
