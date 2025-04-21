# MinimalHtml

This is a clone of the MinimalHtml repository deployed on Render with Uptime Robot monitoring.

## Deployment Instructions

### Deploying to Render

1. Create a Render account at [render.com](https://render.com)
2. Connect your GitHub account or push this repository to your GitHub account
3. From your Render dashboard, click "New" and select "Blueprint"
4. Select the repository containing this code
5. Render will automatically detect the `render.yaml` file and set up the services (web service and database)
6. Click "Apply" to create the services

The deployment will include:
- A web service running the Node.js application
- A PostgreSQL database

### Setting Up Uptime Robot Monitoring

1. Create an account at [uptimerobot.com](https://uptimerobot.com)
2. After logging in, click on "Add New Monitor"
3. Settings for the monitor:
   - Monitor Type: HTTP(s)
   - Friendly Name: MinimalHtml
   - URL: Your Render deployment URL (e.g., https://minimal-html.onrender.com)
   - Monitoring Interval: 5 minutes (or your preferred interval)
4. Advanced Options (optional):
   - Set up alert contacts to receive notifications
   - Configure status page
5. Click "Create Monitor"

## Local Development

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a PostgreSQL database and set the `DATABASE_URL` environment variable
4. Start the development server:
   ```
   npm run dev
   ```

## Build & Start

```
npm run build
npm run start
```