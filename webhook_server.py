"""
Flask Webhook Server for Convex to SQL Server Sync
Receives webhook requests from the dashboard and executes sync.py
Includes email notifications for sync failures and recoveries
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import subprocess
import os
import json
import threading
import time
from datetime import datetime
from dotenv import load_dotenv
import requests
import re

# Import email notifier
from email_notifier import get_email_notifier

# Import rate limiter
from rate_limiter import init_rate_limiter, rate_limit_decorator, get_rate_limit_stats

# Import audit logger
from audit_logger import init_audit_logger, get_audit_logger

# Load environment variables
load_dotenv()

app = Flask(__name__)
# Configure CORS with specific settings for Vercel
CORS(app, 
     origins=[
         'https://import-convex-dwh.vercel.app',
         'http://localhost:3000',
         'https://*.vercel.app'
     ],
     methods=['GET', 'POST', 'OPTIONS'],
     allow_headers=['Content-Type', 'Authorization'],
     supports_credentials=True
)

# Configuration from environment variables
WEBHOOK_TOKEN = os.getenv('WEBHOOK_TOKEN', 'change-this-secret-token')
CONVEX_WEBHOOK_URL = os.getenv('CONVEX_WEBHOOK_URL', '')
DASHBOARD_URL = os.getenv('DASHBOARD_URL', 'http://localhost:3000')
PYTHON_EXE = os.getenv('PYTHON_EXE', r"C:\Users\Fabrizio Fantinel\AppData\Local\Programs\Python\Python311\python.exe")
SYNC_SCRIPT_PATH = os.getenv('SYNC_SCRIPT_PATH', 'sync.py')
HOST = os.getenv('HOST', '0.0.0.0')
PORT = int(os.getenv('PORT', 5000))

# Rate limiting configuration
RATE_LIMIT_REQUESTS_PER_MINUTE = int(os.getenv('RATE_LIMIT_REQUESTS_PER_MINUTE', 60))
RATE_LIMIT_BURST_SIZE = int(os.getenv('RATE_LIMIT_BURST_SIZE', 10))

# Track running syncs to prevent concurrent execution
running_syncs = {}
running_syncs_lock = threading.Lock()

# Initialize email notifier
email_notifier = get_email_notifier(DASHBOARD_URL)

# Initialize rate limiter
rate_limiter = init_rate_limiter(RATE_LIMIT_REQUESTS_PER_MINUTE, RATE_LIMIT_BURST_SIZE)

# Initialize audit logger
audit_logger = init_audit_logger(CONVEX_WEBHOOK_URL)


def authenticate_request():
    """Validate webhook token from Authorization header"""
    auth_header = request.headers.get('Authorization')
    print(f"[DEBUG] Auth header received: {auth_header}")
    print(f"[DEBUG] Expected token: {WEBHOOK_TOKEN}")
    
    if not auth_header or not auth_header.startswith('Bearer '):
        print("[DEBUG] No Bearer token found")
        # Log authentication failure
        audit_logger.log_authentication_failure(
            endpoint=request.endpoint or request.path,
            request=request,
            reason='missing_bearer_token'
        )
        return False
    
    token = auth_header.split(' ')[1]
    print(f"[DEBUG] Token received: {token}")
    print(f"[DEBUG] Token match: {token == WEBHOOK_TOKEN}")
    
    if token != WEBHOOK_TOKEN:
        # Log authentication failure
        audit_logger.log_authentication_failure(
            endpoint=request.endpoint or request.path,
            request=request,
            reason='invalid_token'
        )
        return False
    
    return True


def audit_request_decorator(f):
    """Decorator to audit webhook requests"""
    def decorated_function(*args, **kwargs):
        start_time = time.time()
        
        try:
            response = f(*args, **kwargs)
            
            # Calculate response time
            response_time_ms = (time.time() - start_time) * 1000
            
            # Get status code
            if hasattr(response, 'status_code'):
                status_code = response.status_code
            elif isinstance(response, tuple) and len(response) > 1:
                status_code = response[1]
            else:
                status_code = 200
            
            # Log successful request
            audit_logger.log_webhook_request(
                endpoint=request.endpoint or request.path,
                method=request.method,
                status_code=status_code,
                request=request,
                response_time_ms=response_time_ms
            )
            
            return response
        
        except Exception as e:
            # Calculate response time
            response_time_ms = (time.time() - start_time) * 1000
            
            # Log failed request
            audit_logger.log_webhook_request(
                endpoint=request.endpoint or request.path,
                method=request.method,
                status_code=500,
                request=request,
                response_time_ms=response_time_ms,
                error_message=str(e)
            )
            
            raise
    
    decorated_function.__name__ = f.__name__
    return decorated_function


def parse_sync_output(output):
    """
    Parse sync.py output to extract statistics
    
    Expected output format:
    Tables processed: 11
    Total rows imported: 47
    Duration: 10.82s
    """
    stats = {
        'tables_processed': 0,
        'rows_imported': 0,
        'duration_seconds': 0.0
    }
    
    try:
        # Extract tables processed
        tables_match = re.search(r'Tables processed:\s*(\d+)', output)
        if tables_match:
            stats['tables_processed'] = int(tables_match.group(1))
        
        # Extract rows imported
        rows_match = re.search(r'Total rows imported:\s*(\d+)', output)
        if rows_match:
            stats['rows_imported'] = int(rows_match.group(1))
        
        # Extract duration
        duration_match = re.search(r'Duration:\s*([\d.]+)s', output)
        if duration_match:
            stats['duration_seconds'] = float(duration_match.group(1))
    
    except Exception as e:
        print(f"Error parsing sync output: {e}")
    
    return stats


def send_callback_to_convex(job_id, status, stats=None, error_message=None, log_content=None):
    """Send sync results back to Convex via HTTP action"""
    if not CONVEX_WEBHOOK_URL:
        print("Warning: CONVEX_WEBHOOK_URL not configured, skipping callback")
        return
    
    try:
        payload = {
            'job_id': job_id,
            'status': status,
            'completed_at': int(time.time() * 1000),  # milliseconds
        }
        
        if stats:
            payload['duration_seconds'] = stats.get('duration_seconds', 0)
            payload['tables_processed'] = stats.get('tables_processed', 0)
            payload['rows_imported'] = stats.get('rows_imported', 0)
        
        if error_message:
            payload['error_message'] = error_message
        
        if log_content:
            payload['log_content'] = log_content
        
        response = requests.post(
            f"{CONVEX_WEBHOOK_URL}/api/sync-callback",
            json=payload,
            headers={'Content-Type': 'application/json'},
            timeout=10
        )
        
        if response.status_code == 200:
            print(f"✓ Callback sent to Convex for job {job_id}")
        else:
            print(f"✗ Callback failed: {response.status_code} - {response.text}")
    
    except Exception as e:
        print(f"✗ Error sending callback to Convex: {e}")


def run_sync_async(job_id, app_name, deploy_key, tables, table_mapping):
    """
    Run sync.py in background thread
    
    Args:
        job_id: Convex sync_job ID
        app_name: Name of the Convex app to sync
        deploy_key: Convex deploy key
        tables: List of tables to sync (or None for all)
        table_mapping: Dict of table name mappings (or None)
    """
    started_at = datetime.now()
    
    # Log sync start
    audit_logger.log_sync_triggered(
        job_id=job_id,
        app_name=app_name,
        trigger_type='webhook'
    )
    
    try:
        print(f"[{app_name}] Starting sync job {job_id}")
        
        # Build command
        cmd = [PYTHON_EXE, SYNC_SCRIPT_PATH, app_name]
        
        # Execute sync.py
        start_time = time.time()
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            encoding='utf-8',
            errors='replace',  # Replace invalid characters instead of failing
            timeout=600,  # 10 minutes timeout
            cwd=os.path.dirname(os.path.abspath(__file__))
        )
        end_time = time.time()
        
        # Combine stdout and stderr for full log
        log_content = result.stdout
        if result.stderr:
            log_content += "\n\nSTDERR:\n" + result.stderr
        
        # Parse output for statistics
        stats = parse_sync_output(result.stdout)
        stats['duration_seconds'] = round(end_time - start_time, 2)
        
        # Determine status
        if result.returncode == 0:
            status = 'success'
            error_message = None
            print(f"[{app_name}] ✓ Sync completed successfully")
            
            # Log successful completion
            audit_logger.log_sync_completed(
                job_id=job_id,
                app_name=app_name,
                status=status,
                stats=stats
            )
            
            # Check if this is a recovery (previous sync failed)
            if email_notifier.should_send_recovery_notification(app_name, status):
                print(f"[{app_name}] Sending recovery notification")
                email_notifier.send_sync_recovery_notification(
                    app_name=app_name,
                    app_id=job_id,  # Using job_id as app_id for now
                    job_id=job_id,
                    completed_at=datetime.now(),
                    stats=stats
                )
            
        else:
            status = 'failed'
            error_message = result.stderr or "Sync failed with non-zero exit code"
            print(f"[{app_name}] ✗ Sync failed: {error_message}")
            
            # Log failed completion
            audit_logger.log_sync_completed(
                job_id=job_id,
                app_name=app_name,
                status=status,
                stats=stats,
                error_message=error_message
            )
            
            # Send failure notification
            print(f"[{app_name}] Sending failure notification")
            email_notifier.send_sync_failed_notification(
                app_name=app_name,
                app_id=job_id,  # Using job_id as app_id for now
                job_id=job_id,
                error_message=error_message,
                started_at=started_at,
                failed_at=datetime.now(),
                stats=stats
            )
        
        # Send callback to Convex
        send_callback_to_convex(
            job_id=job_id,
            status=status,
            stats=stats,
            error_message=error_message,
            log_content=log_content
        )
    
    except subprocess.TimeoutExpired:
        error_message = "Sync timed out after 10 minutes"
        print(f"[{app_name}] ✗ {error_message}")
        
        # Log timeout
        audit_logger.log_sync_completed(
            job_id=job_id,
            app_name=app_name,
            status='failed',
            error_message=error_message
        )
        
        # Send failure notification for timeout
        email_notifier.send_sync_failed_notification(
            app_name=app_name,
            app_id=job_id,
            job_id=job_id,
            error_message=error_message,
            started_at=started_at,
            failed_at=datetime.now()
        )
        
        send_callback_to_convex(
            job_id=job_id,
            status='failed',
            error_message=error_message
        )
    
    except Exception as e:
        error_message = f"Unexpected error: {str(e)}"
        print(f"[{app_name}] ✗ {error_message}")
        
        # Log unexpected error
        audit_logger.log_sync_completed(
            job_id=job_id,
            app_name=app_name,
            status='failed',
            error_message=error_message
        )
        
        # Send failure notification for unexpected error
        email_notifier.send_sync_failed_notification(
            app_name=app_name,
            app_id=job_id,
            job_id=job_id,
            error_message=error_message,
            started_at=started_at,
            failed_at=datetime.now()
        )
        
        send_callback_to_convex(
            job_id=job_id,
            status='failed',
            error_message=error_message
        )
    
    finally:
        # Remove from running syncs
        with running_syncs_lock:
            if app_name in running_syncs:
                del running_syncs[app_name]
        print(f"[{app_name}] Sync job {job_id} finished")


@app.after_request
def after_request(response):
    """Add CORS headers to all responses"""
    response.headers.add('Access-Control-Allow-Origin', 'https://import-convex-dwh.vercel.app')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    return response


@app.before_request
def handle_preflight():
    """Handle CORS preflight requests"""
    if request.method == "OPTIONS":
        response = jsonify({'status': 'ok'})
        response.headers.add("Access-Control-Allow-Origin", "https://import-convex-dwh.vercel.app")
        response.headers.add('Access-Control-Allow-Headers', "Content-Type,Authorization")
        response.headers.add('Access-Control-Allow-Methods', "GET,POST,OPTIONS")
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response


@app.route('/health', methods=['GET'])
@rate_limit_decorator
@audit_request_decorator
def health():
    """Health check endpoint"""
    with running_syncs_lock:
        running_apps = list(running_syncs.keys())
    
    # Include rate limiting stats
    rate_stats = get_rate_limit_stats()
    
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'running_syncs': running_apps,
        'python_exe': PYTHON_EXE,
        'sync_script': SYNC_SCRIPT_PATH,
        'rate_limiting': rate_stats
    }), 200


@app.route('/api/fetch-tables', methods=['POST'])
@rate_limit_decorator
@audit_request_decorator
def fetch_tables():
    """
    Fetch available tables from a Convex deployment
    
    Expected request body:
    {
        "deploy_key": "dev:project|token"
    }
    
    Returns:
    {
        "success": true,
        "tables": ["table1", "table2", ...]
    }
    """
    # Authenticate request
    if not authenticate_request():
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        data = request.get_json()
        deploy_key = data.get('deploy_key')
        
        if not deploy_key:
            return jsonify({'error': 'deploy_key is required'}), 400
        
        # Create a temporary config to fetch tables
        temp_app_name = f"temp_{int(time.time())}"
        
        # Run convex-helpers list-tables command or use snapshot export
        # For now, we'll use the snapshot export and parse the JSON
        import tempfile
        import zipfile
        
        with tempfile.TemporaryDirectory() as temp_dir:
            # Download snapshot
            snapshot_path = os.path.join(temp_dir, 'snapshot.zip')
            
            # Use convex CLI to export snapshot
            # Set deploy key as environment variable (CONVEX_DEPLOY_KEY)
            # This allows the CLI to run non-interactively
            # Note: When CONVEX_DEPLOY_KEY is set, we don't need --deployment-name
            env = os.environ.copy()
            env['CONVEX_DEPLOY_KEY'] = deploy_key
            
            cmd = [
                r'C:\Program Files\nodejs\npx.cmd',
                'convex',
                'export',
                '--path', snapshot_path
            ]
            
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                encoding='utf-8',
                errors='replace',
                timeout=60,
                env=env,
                cwd=os.path.dirname(os.path.abspath(__file__))
            )
            
            if result.returncode != 0:
                return jsonify({
                    'error': 'Failed to fetch tables from Convex',
                    'details': result.stderr
                }), 500
            
            # Extract and parse snapshot
            tables = []
            if os.path.exists(snapshot_path):
                with zipfile.ZipFile(snapshot_path, 'r') as zip_ref:
                    # Extract table names from directory structure
                    # Format: table_name/documents.jsonl
                    for file_name in zip_ref.namelist():
                        # Check if this is a documents.jsonl file in a table directory
                        if file_name.endswith('/documents.jsonl'):
                            # Extract table name from path (everything before /documents.jsonl)
                            table_name = file_name.replace('/documents.jsonl', '')
                            
                            # Skip system tables (starting with _)
                            if not table_name.startswith('_'):
                                tables.append(table_name)
            
            tables.sort()
            
            return jsonify({
                'success': True,
                'tables': tables
            }), 200
            
    except subprocess.TimeoutExpired:
        return jsonify({'error': 'Request timeout while fetching tables'}), 504
    except Exception as e:
        print(f"Error fetching tables: {e}")
        return jsonify({
            'error': 'Failed to fetch tables',
            'details': str(e)
        }), 500


@app.route('/api/get-app-config/<app_name>', methods=['GET'])
@rate_limit_decorator
@audit_request_decorator
def get_app_config(app_name):
    """
    Get app configuration from Convex via dashboard webhook
    
    Returns:
    {
        "success": true,
        "config": {
            "name": "importdes",
            "deploy_key": "dev:project|token",
            "tables": ["table1", "table2"],
            "table_mapping": {"table1": "sql_table1"}
        }
    }
    """
    # Authenticate request
    if not authenticate_request():
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        # Try to get config from dashboard via HTTP request
        dashboard_url = os.getenv('DASHBOARD_URL', 'http://localhost:3000')
        
        try:
            dashboard_request_url = f"{dashboard_url}/api/get-app-config/{app_name}"
            print(f"[DEBUG] Calling dashboard API: {dashboard_request_url}")
            
            response = requests.get(
                dashboard_request_url,
                timeout=10
            )
            
            print(f"[DEBUG] Dashboard API response: {response.status_code}")
            print(f"[DEBUG] Dashboard API content: {response.text[:200]}...")
            
            if response.status_code == 200:
                result = response.json()
                if result.get('success'):
                    print(f"[DEBUG] Successfully got config from dashboard")
                    return jsonify(result), 200
        except Exception as e:
            print(f"Failed to get config from dashboard: {e}")
            import traceback
            traceback.print_exc()
        
        # Fallback to JSON config file
        print(f"Falling back to JSON config for app: {app_name}")
        config_path = 'config.json'
        
        if not os.path.exists(config_path):
            return jsonify({'error': 'Configuration file not found and dashboard query failed'}), 404
        
        with open(config_path, 'r', encoding='utf-8') as f:
            config = json.load(f)
        
        # Find the app configuration
        convex_apps = config.get('convex_apps', {})
        
        if app_name not in convex_apps:
            return jsonify({'error': f'App "{app_name}" not found in configuration'}), 404
        
        app_config = convex_apps[app_name]
        
        return jsonify({
            'success': True,
            'config': {
                'name': app_name,
                'deploy_key': app_config.get('deploy_key'),
                'tables': app_config.get('tables', []),
                'table_mapping': app_config.get('table_mapping', {})
            }
        }), 200
        
    except Exception as e:
        print(f"Error getting app config: {e}")
        return jsonify({
            'error': 'Failed to get app configuration',
            'details': str(e)
        }), 500


@app.route('/api/sync/<app_name>', methods=['POST'])
@rate_limit_decorator
@audit_request_decorator
def trigger_sync(app_name):
    """
    Webhook endpoint to trigger sync for a specific app
    
    Expected request body:
    {
        "job_id": "convex_job_id",
        "app_name": "appclinics",
        "deploy_key": "preview:team:project|token",
        "tables": ["table1", "table2"] or null for all,
        "table_mapping": {"table1": "new_name"} or null
    }
    """
    # Authenticate request
    if not authenticate_request():
        return jsonify({'error': 'Unauthorized'}), 401
    
    # Check if sync already running for this app
    with running_syncs_lock:
        if app_name in running_syncs:
            return jsonify({
                'error': f'Sync already running for {app_name}',
                'job_id': running_syncs[app_name]
            }), 409
    
    # Get request data
    try:
        data = request.json
        job_id = data.get('job_id')
        deploy_key = data.get('deploy_key')
        tables = data.get('tables')
        table_mapping = data.get('table_mapping')
        
        if not job_id:
            return jsonify({'error': 'Missing job_id'}), 400
        
        if not deploy_key:
            return jsonify({'error': 'Missing deploy_key'}), 400
    
    except Exception as e:
        return jsonify({'error': f'Invalid request data: {str(e)}'}), 400
    
    # Mark sync as running
    with running_syncs_lock:
        running_syncs[app_name] = job_id
    
    # Start sync in background thread
    thread = threading.Thread(
        target=run_sync_async,
        args=(job_id, app_name, deploy_key, tables, table_mapping),
        daemon=True
    )
    thread.start()
    
    return jsonify({
        'success': True,
        'job_id': job_id,
        'app_name': app_name,
        'message': f'Sync started for {app_name}'
    }), 202


@app.route('/api/rate-limit-stats', methods=['GET'])
def rate_limit_stats():
    """Get rate limiting statistics (admin endpoint)"""
    # This endpoint is not rate limited to allow monitoring
    
    # Simple authentication check
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'error': 'Unauthorized'}), 401
    
    token = auth_header.split(' ')[1]
    if token != WEBHOOK_TOKEN:
        return jsonify({'error': 'Unauthorized'}), 401
    
    stats = get_rate_limit_stats()
    
    return jsonify({
        'success': True,
        'stats': stats,
        'timestamp': datetime.now().isoformat()
    }), 200


@app.route('/', methods=['GET'])
@rate_limit_decorator
@audit_request_decorator
def index():
    """Root endpoint with server info"""
    return jsonify({
        'name': 'Convex to SQL Server Webhook Server',
        'version': '1.0.0',
        'endpoints': {
            'health': 'GET /health',
            'trigger_sync': 'POST /api/sync/<app_name>'
        }
    }), 200


if __name__ == '__main__':
    print("=" * 70)
    print("CONVEX TO SQL SERVER WEBHOOK SERVER")
    print("=" * 70)
    print(f"Host: {HOST}")
    print(f"Port: {PORT}")
    print(f"Python: {PYTHON_EXE}")
    print(f"Sync Script: {SYNC_SCRIPT_PATH}")
    print(f"Convex Callback: {CONVEX_WEBHOOK_URL or 'Not configured'}")
    print(f"Dashboard URL: {DASHBOARD_URL}")
    print(f"Email Notifications: {'Enabled' if email_notifier else 'Disabled'}")
    print(f"Rate Limiting: {RATE_LIMIT_REQUESTS_PER_MINUTE} req/min, burst {RATE_LIMIT_BURST_SIZE}")
    print("=" * 70)
    print()
    
    app.run(host=HOST, port=PORT, debug=False)
