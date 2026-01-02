# Convex to SQL Server Sync Dashboard

## 🎯 Project Status: Ready for Task 10 - Vercel Cron Jobs

### ✅ Completed (Tasks 1-9)
- **Dashboard Web App**: Fully functional React/Next.js dashboard with Auth0
- **Convex Backend**: Complete database schema, queries, mutations, and actions
- **Sync System**: Python sync script with Flask webhook server
- **Configuration Management**: Centralized in Convex database (no more JSON dependency)
- **Manual Sync**: Working perfectly with real-time status updates
- **Log Viewing**: Complete sync job history and log viewer
- **Settings Management**: SQL and Email configuration with encryption

### 🚀 Next: Task 10 - Vercel Cron Jobs
Implement automatic scheduled syncs using Vercel Cron Jobs for hands-free data synchronization.

## System Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Dashboard     │    │  Webhook Server  │    │   SQL Server    │
│   (Vercel)      │────│   (Windows VM)   │────│     (DWH)       │
│                 │    │                  │    │                 │
│ - Next.js App   │    │ - Flask Server   │    │ - Target DB     │
│ - Convex DB     │    │ - sync.py        │    │ - Tables        │
│ - Auth0         │    │ - Python Modules │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │
         │              ┌────────▼────────┐
         │              │  Vercel Cron    │
         └──────────────│   (Task 10)     │
                        │                 │
                        │ - Scheduled     │
                        │ - Auto Trigger  │
                        └─────────────────┘
```

## Quick Start

### Prerequisites
- Python 3.11+ with required packages
- Node.js 18+ for dashboard
- SQL Server access
- Convex account
- Auth0 account
- Vercel account (Pro plan for cron jobs)

### 1. Setup Python Environment
```bash
# Install Python dependencies
pip install -r requirements.txt

# Configure environment
copy .env.example .env
# Edit .env with your settings
```

### 2. Setup Dashboard
```bash
cd dashboard
npm install

# Configure environment
copy .env.local.example .env.local
# Edit .env.local with your Convex and Auth0 settings

# Start development server
npm run dev
```

### 3. Start Webhook Server
```bash
# Start Flask webhook server
python webhook_server.py
```

### 4. Configure Applications
1. Open dashboard at http://localhost:3000
2. Login with Auth0
3. Add your Convex applications
4. Configure tables and sync settings
5. Test manual sync

## Current Applications

### appclinics
- **Deploy Key**: `dev:bold-husky-496|...`
- **Tables**: `["cliniche"]`
- **Status**: ✅ Working
- **Last Sync**: Successfully syncing 1 table, 3 rows

### importdes  
- **Deploy Key**: `dev:tame-fly-648|...`
- **Tables**: `["clinicDetails", "clinicDoctors"]`
- **Status**: ✅ Working  
- **Last Sync**: Successfully syncing 2 tables, 4 rows

## Key Features

### ✅ Completed Features
- **Web Dashboard**: Modern React interface with Auth0 authentication
- **App Management**: Full CRUD operations for sync applications
- **Manual Sync**: One-click sync with real-time progress
- **Log Viewer**: Complete sync history with detailed logs
- **Configuration**: Centralized SQL and Email settings
- **Security**: Encrypted passwords and secure webhook authentication
- **Real-time Updates**: Live sync status with polling
- **Table Selection**: Choose specific tables to sync per app

### 🔄 Task 10: Vercel Cron Jobs
- **Automatic Scheduling**: Configure cron schedules per application
- **Vercel Integration**: Use Vercel Cron Jobs for reliable scheduling
- **Secure Endpoints**: Protected cron API endpoints
- **Monitoring**: Track automatic vs manual sync executions

## Configuration

### Environment Variables

#### Main Project (.env)
```bash
WEBHOOK_TOKEN=test-token-12345
CONVEX_WEBHOOK_URL=http://localhost:3000
PYTHON_EXE=C:\Users\...\python.exe
SYNC_SCRIPT_PATH=sync.py
HOST=0.0.0.0
PORT=5000
```

#### Dashboard (dashboard/.env.local)
```bash
NEXT_PUBLIC_AUTH0_DOMAIN=your-auth0-domain
NEXT_PUBLIC_AUTH0_CLIENT_ID=your-client-id
NEXT_PUBLIC_CONVEX_URL=https://your-convex-deployment.convex.cloud
NEXT_PUBLIC_WEBHOOK_URL=http://localhost:5000
NEXT_PUBLIC_WEBHOOK_TOKEN=test-token-12345
CONVEX_DEPLOYMENT=dev:your-deployment
```

## File Structure

```
├── sync.py                 # Main sync script
├── webhook_server.py       # Flask webhook server
├── src/                    # Python modules
├── dashboard/              # Next.js dashboard
│   ├── app/               # App router pages
│   ├── components/        # React components
│   ├── convex/           # Convex backend
│   └── lib/              # Utilities
├── config.json            # Fallback configuration
├── requirements.txt       # Python dependencies
└── README.md             # This file
```

## Development Workflow

### Adding New Applications
1. Open dashboard
2. Click "Add New App"
3. Enter Convex deploy key
4. Use "Fetch Tables" to get available tables
5. Select tables to sync
6. Configure table mapping if needed
7. Save and test sync

### Monitoring Syncs
1. Dashboard shows real-time sync status
2. Click "View Logs" to see detailed sync history
3. Webhook server logs all operations
4. Python sync script creates detailed log files

### Troubleshooting
1. Check webhook server is running (http://localhost:5000/health)
2. Verify Convex deployment is accessible
3. Check SQL Server connection
4. Review log files in `logs/` directory
5. Test manual sync before setting up cron jobs

## Next Steps: Task 10 Implementation

1. **Create Vercel Cron Configuration**
   - Define `vercel.json` with cron schedules
   - Configure for existing apps (appclinics, importdes)

2. **Implement Cron API Endpoint**
   - Create `/api/cron/[app_name]` route
   - Add cron secret validation
   - Integrate with existing sync system

3. **Update Dashboard UI**
   - Show cron status and schedules
   - Distinguish manual vs automatic syncs
   - Add cron configuration options

4. **Testing and Deployment**
   - Test cron endpoints locally
   - Deploy to Vercel with cron configuration
   - Monitor automatic sync execution

## Support

For issues or questions:
1. Check the logs in `logs/` directory
2. Verify all services are running
3. Test manual sync first
4. Check environment variable configuration

---

**Status**: ✅ Tasks 1-9 Complete | 🚀 Ready for Task 10 - Vercel Cron Jobs