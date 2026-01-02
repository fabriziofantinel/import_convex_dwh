# Design Document: Vercel Cron Jobs

## Overview

Implementazione di un sistema di schedulazione automatica per sincronizzazioni Convex → SQL Server utilizzando Vercel Cron Jobs. Il sistema legge le configurazioni delle applicazioni da Convex, configura cron job dinamicamente, e triggerare sync automatici tramite API endpoint sicuri.

## Architecture

```mermaid
graph TB
    A[Vercel Cron Scheduler] --> B[/api/cron/[app_name]]
    B --> C[Validate Cron Secret]
    C --> D[Query App Config from Convex]
    D --> E{Cron Enabled?}
    E -->|Yes| F[Trigger Sync Action]
    E -->|No| G[Return Disabled Message]
    F --> H[Convex triggerSync Action]
    H --> I[Webhook Server]
    I --> J[Execute sync.py]
    J --> K[Update Sync Job Status]
    
    style A fill:#e1f5fe
    style B fill:#f3e5f5
    style F fill:#e8f5e8
    style G fill:#fff3e0
```

## Components and Interfaces

### 1. Vercel Configuration (vercel.json)

```json
{
  "crons": [
    {
      "path": "/api/cron/appclinics",
      "schedule": "0 2 * * *"
    },
    {
      "path": "/api/cron/importdes", 
      "schedule": "0 3 * * *"
    }
  ]
}
```

**Responsabilità:**
- Definire schedule per ogni applicazione configurata
- Configurazione statica che viene aggiornata al deploy
- Supportare espressioni cron standard (5 campi)

### 2. Cron API Endpoint

**File:** `dashboard/app/api/cron/[app_name]/route.ts`

```typescript
interface CronRequest {
  headers: {
    authorization: string; // Bearer {CRON_SECRET}
  }
}

interface CronResponse {
  success?: boolean;
  message?: string;
  error?: string;
  job_id?: string;
}
```

**Responsabilità:**
- Validare cron secret da Vercel
- Verificare esistenza e configurazione applicazione
- Triggerare sync via Convex action
- Gestire errori e timeout
- Loggare richieste per monitoraggio

### 3. Environment Variables

```bash
# Vercel Environment Variables
CRON_SECRET=your-secure-random-32-char-string
NEXT_PUBLIC_CONVEX_URL=https://your-convex-deployment.convex.cloud
```

**Sicurezza:**
- CRON_SECRET deve essere casuale e di almeno 32 caratteri
- Configurato sia in Vercel che localmente per testing
- Non deve apparire nei log o nel codice

## Data Models

### Sync App (Existing - Enhanced)

```typescript
interface SyncApp {
  _id: Id<"sync_apps">;
  name: string;
  deploy_key: string;
  tables: string[];
  table_mapping?: Record<string, string>;
  cron_schedule?: string;    // "0 2 * * *" - Default if not specified
  cron_enabled: boolean;     // Enable/disable cron for this app
  created_at: number;
  updated_at: number;
}
```

### Sync Job (Existing - Enhanced)

```typescript
interface SyncJob {
  _id: Id<"sync_jobs">;
  app_id: Id<"sync_apps">;
  status: "running" | "success" | "failed";
  started_at: number;
  completed_at?: number;
  duration_seconds?: number;
  tables_processed?: number;
  rows_imported?: number;
  error_message?: string;
  log_content?: string;
  triggered_by: "manual" | "cron";  // Enhanced to track trigger source
}
```

## API Specifications

### POST /api/cron/[app_name]

**Headers:**
```
Authorization: Bearer {CRON_SECRET}
Content-Type: application/json
```

**Response 200 (Success):**
```json
{
  "success": true,
  "job_id": "j97449np5h5xs53wgxttzhe99x7xw5g3",
  "message": "Sync triggered successfully"
}
```

**Response 200 (Disabled):**
```json
{
  "success": true,
  "message": "Cron disabled for this app"
}
```

**Response 401 (Unauthorized):**
```json
{
  "error": "Invalid cron secret"
}
```

**Response 404 (Not Found):**
```json
{
  "error": "App 'unknown-app' not found"
}
```

**Response 500 (Server Error):**
```json
{
  "error": "Failed to trigger sync",
  "details": "Connection timeout to Convex"
}
```

## Implementation Details

### 1. Cron Secret Validation

```typescript
function validateCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }
  
  const token = authHeader.substring(7);
  const expectedSecret = process.env.CRON_SECRET;
  
  if (!expectedSecret) {
    console.error('CRON_SECRET not configured');
    return false;
  }
  
  return token === expectedSecret;
}
```

### 2. App Configuration Query

```typescript
async function getAppConfig(appName: string) {
  const app = await fetchQuery(api.queries.getSyncAppByName, { 
    name: appName 
  });
  
  if (!app) {
    throw new Error(`App '${appName}' not found`);
  }
  
  return app;
}
```

### 3. Sync Triggering

```typescript
async function triggerSync(app: SyncApp) {
  const jobId = await fetchMutation(api.actions.triggerSync, {
    app_id: app._id,
    triggered_by: 'cron'
  });
  
  return jobId;
}
```

### 4. Error Handling

```typescript
try {
  // Validation and sync logic
} catch (error) {
  console.error(`Cron error for ${appName}:`, error);
  
  // Return appropriate error response
  if (error.message.includes('not found')) {
    return NextResponse.json(
      { error: error.message }, 
      { status: 404 }
    );
  }
  
  return NextResponse.json(
    { 
      error: 'Failed to trigger sync',
      details: error.message 
    }, 
    { status: 500 }
  );
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Cron Secret Validation
*For any* cron request, if the Authorization header does not contain the correct Bearer token, the request should be rejected with 401 status
**Validates: Requirements 2.1, 2.2, 5.2**

### Property 2: App Configuration Validation  
*For any* cron request for an app name, if the app does not exist in Convex, the request should return 404 status
**Validates: Requirements 2.3**

### Property 3: Cron Enabled Check
*For any* valid cron request for an existing app, if cron_enabled is false, the request should return 200 with "disabled" message without triggering sync
**Validates: Requirements 2.4**

### Property 4: Sync Triggering
*For any* valid cron request for an app with cron_enabled=true, the system should trigger a sync with triggered_by="cron"
**Validates: Requirements 2.5, 2.6**

### Property 5: Error Logging
*For any* cron request that results in an error, the error should be logged with sufficient detail for debugging
**Validates: Requirements 2.7, 3.1**

### Property 6: Response Timeout
*For any* cron request, the response should be returned within 60 seconds to comply with Vercel timeout limits
**Validates: Requirements 3.3**

## Error Handling

### Timeout Management
- Set request timeout to 55 seconds (5 seconds buffer before Vercel timeout)
- Return early response if sync triggering takes too long
- Log timeout events for monitoring

### Connection Failures
- Retry Convex queries up to 3 times with exponential backoff
- Return 500 status with descriptive error message
- Log connection failures for debugging

### Invalid Configurations
- Validate cron schedule format if provided
- Handle missing environment variables gracefully
- Provide clear error messages for configuration issues

## Testing Strategy

### Unit Tests
- Test cron secret validation with valid/invalid tokens
- Test app existence checking with existing/non-existing apps
- Test cron enabled/disabled logic
- Test error response formatting

### Integration Tests  
- Test end-to-end cron triggering with real Convex
- Test timeout handling with delayed responses
- Test error propagation from Convex to API response
- Test logging functionality

### Property-Based Tests
- Generate random app names and verify 404 handling
- Generate random cron secrets and verify validation
- Test various app configurations (enabled/disabled)
- Verify triggered_by field is always set correctly

**Testing Configuration:**
- Minimum 100 iterations per property test
- Each test tagged with: **Feature: vercel-cron-jobs, Property {number}: {property_text}**
- Use test environment with separate Convex deployment
- Mock Vercel cron requests for testing

## Deployment Considerations

### Vercel Configuration
- Configure CRON_SECRET in Vercel environment variables
- Ensure vercel.json is included in deployment
- Verify cron jobs are created after deployment

### Monitoring
- Set up logging for all cron requests
- Monitor cron job execution frequency
- Alert on repeated cron failures

### Rollback Strategy
- Keep previous vercel.json configuration for rollback
- Test cron endpoints in staging before production
- Have manual sync capability as fallback