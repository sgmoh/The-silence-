# Setting Up Uptime Robot Monitoring

This guide provides detailed steps for setting up Uptime Robot monitoring for your Render-deployed application.

## What is Uptime Robot?

Uptime Robot is a service that monitors your websites every 5 minutes and alerts you if they're down. It offers:
- Free monitoring for up to 50 monitors
- Multiple monitoring types (HTTP, ping, port, etc.)
- Status pages to share uptime with your customers
- SMS, email, and webhook notifications

## Setup Instructions

### 1. Create an Uptime Robot Account

- Go to [UptimeRobot.com](https://uptimerobot.com)
- Click "Register for FREE" to create an account
- Verify your email address

### 2. Add a New Monitor

- Log in to your Uptime Robot dashboard
- Click "Add New Monitor" button

### 3. Configure the Monitor

- **Monitor Type**: Select "HTTP(s)"
- **Friendly Name**: Enter a name for your monitor (e.g., "MinimalHtml Site")
- **URL**: Enter your Render-deployed URL (e.g., https://minimal-html.onrender.com)
- **Monitoring Interval**: Select how often to check (5 minutes is recommended)

### 4. Set Up Alerts

- Under "Alert Contacts to Notify", click "Create a new alert contact" if you haven't set one up
- Select your alert method (email, SMS, etc.)
- Configure when to receive alerts (immediately, after X minutes of downtime, etc.)

### 5. Advanced Settings (Optional)

- **HTTP Method**: Leave as GET (default)
- **Alert When**: "Down" (default)
- **Timeout**: 30 seconds (default)
- **Enable SSL monitoring**: Recommended for HTTPS sites

### 6. Create the Monitor

- Click "Create Monitor" to start monitoring your site

## Setting Up a Status Page (Optional)

A status page allows you to publicly share your site's uptime status.

1. In the Uptime Robot dashboard, go to "Status Pages"
2. Click "Add New Status Page"
3. Configure your status page:
   - Name: Your choice (e.g., "MinimalHtml Status")
   - Select which monitors to include
   - Customize design options
4. Click "Create Status Page"
5. You'll receive a public URL you can share with users

## Interpreting Uptime Reports

Uptime Robot provides several useful metrics:
- **Uptime percentage**: The percentage of time your site was available
- **Response time graph**: How quickly your site responds
- **Downtime logs**: When your site was unavailable

Access these reports by clicking on a monitor in your dashboard.

## Troubleshooting

- **False positives**: Sometimes firewalls or security settings can cause false downtime alerts
- **Monitoring frequency**: Free plans check every 5 minutes, so brief outages might be missed
- **Incomplete checks**: Monitor from multiple locations to ensure comprehensive coverage