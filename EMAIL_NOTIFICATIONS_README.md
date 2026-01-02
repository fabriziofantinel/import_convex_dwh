# Email Notifications for Sync Dashboard

This document describes the email notification system for the Convex to SQL Server sync dashboard.

## Overview

The email notification system automatically sends HTML emails when:
1. **Sync fails** - Immediate notification with error details
2. **Sync recovers** - Notification when a sync succeeds after a previous failure

## Components

### 1. Email Templates (`templates/`)

- **`sync_failed_email.html`** - HTML template for sync failure notifications
- **`sync_recovery_email.html`** - HTML template for sync recovery notifications

Both templates use Jinja2 templating and include:
- Professional HTML styling
- Responsive design
- Error details and statistics
- Links to dashboard logs
- Timeline for recovery emails

### 2. Email Notifier (`email_notifier.py`)

The `SyncEmailNotifier` class handles:
- Loading email configuration from Convex via dashboard API
- Rendering HTML templates with sync data
- Sending emails via SMTP
- Tracking sync status to detect recoveries

### 3. Dashboard API (`dashboard/app/api/get-email-config/route.ts`)

Provides email configuration to the webhook server:
- Fetches email config from Convex
- Decrypts SMTP password
- Returns configuration for webhook server

### 4. Webhook Server Integration

The webhook server (`webhook_server.py`) now includes:
- Email notifier initialization
- Failure notifications on sync errors
- Recovery notifications when sync succeeds after failure
- Proper error handling for email sending

## Configuration

### Environment Variables

Add to your `.env` file:

```bash
# Dashboard URL for email links
DASHBOARD_URL=https://your-dashboard.vercel.app

# Email notifications are configured via the dashboard UI
```

### Dashboard Email Settings

Configure email settings in the dashboard at `/settings`:

1. **SMTP Host** - Your email provider's SMTP server
2. **SMTP Port** - Usually 587 for TLS or 465 for SSL
3. **SMTP User** - Your email username
4. **SMTP Password** - Your email password (encrypted in storage)
5. **From Email** - Sender email address
6. **To Emails** - List of recipient email addresses
7. **Use TLS** - Enable TLS encryption (recommended)

## Email Types

### Sync Failed Email

Sent immediately when a sync fails, includes:
- Application name and sync details
- Error message and stack trace
- Sync statistics (tables processed, rows imported)
- Duration and timestamps
- Link to view full logs in dashboard

### Sync Recovery Email

Sent when a sync succeeds after a previous failure, includes:
- Recovery confirmation message
- Success statistics
- Timeline showing failure → recovery
- Previous failure details
- Link to view logs

## Dependencies

The email system requires:
- `jinja2>=3.1.0` - Template rendering
- `requests>=2.31.0` - API communication
- Built-in `smtplib` - Email sending

## Testing

The email templates can be tested by:
1. Configuring email settings in dashboard
2. Triggering a sync that will fail
3. Fixing the issue and triggering a successful sync
4. Checking email inbox for notifications

## Security

- SMTP passwords are encrypted using AES-256 before storage in Convex
- Email configuration is only accessible via authenticated dashboard API
- Webhook server validates tokens before sending notifications

## Troubleshooting

### Email Not Sending

1. Check email configuration in dashboard settings
2. Verify SMTP credentials and server settings
3. Check webhook server logs for email errors
4. Ensure dashboard API is accessible from webhook server

### Template Errors

1. Verify template files exist in `templates/` directory
2. Check Jinja2 syntax in template files
3. Review webhook server logs for template rendering errors

### Recovery Notifications Not Working

1. Ensure webhook server tracks sync status correctly
2. Check that previous sync actually failed
3. Verify email configuration is accessible

## Email Template Customization

To customize email templates:

1. Edit HTML files in `templates/` directory
2. Use Jinja2 syntax for dynamic content
3. Available template variables:
   - `app_name` - Application name
   - `job_id` - Sync job ID
   - `error_message` - Error details (failed emails)
   - `stats` - Sync statistics
   - `dashboard_url` - Link to dashboard
   - `timestamp` - Current timestamp

## Future Enhancements

Potential improvements:
- Email digest for multiple failures
- Configurable email frequency (immediate vs batched)
- SMS notifications via Twilio
- Slack/Teams integration
- Email templates for scheduled sync reports