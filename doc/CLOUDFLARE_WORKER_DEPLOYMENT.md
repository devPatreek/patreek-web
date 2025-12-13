# Cloudflare Worker Deployment Guide (Free Tier)

## Overview
This guide walks you through deploying the Cloudflare Worker with rate limiting using the **free tier** (in-memory rate limiting - no KV storage needed).

## Prerequisites
- Cloudflare account (free tier is fine)
- `patreek.com` domain connected to Cloudflare
- Access to Cloudflare dashboard

## Step-by-Step Deployment

### Step 1: Access Cloudflare Workers

1. Log into your [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Select your account
3. Click **Workers & Pages** in the left sidebar
4. Click **Create application** → **Create Worker**

### Step 2: Create the Worker

1. **Name your Worker**: `patreek-com-router` (or any name you prefer)
2. **Choose "HTTP handler"** (default)
3. Click **Deploy** (we'll add the code next)

### Step 3: Add Your Worker Code

1. After deployment, click **Edit code** (or go to Workers & Pages → Your Worker → **Edit code**)
2. **Delete all the default code** in the editor
3. **Copy the entire contents** of `patreek-web/cloudflare-worker.js` from your repo
4. **Paste it** into the Cloudflare Worker editor
5. **Verify** `USE_KV: false` is set (line 44) - this ensures free tier usage
6. Click **Save and deploy**

### Step 4: Configure Worker Route

1. Go to **Workers & Pages** → Your Worker → **Settings** tab
2. Scroll down to **Triggers** section
3. Click **Add route**
4. **Route**: `patreek.com/*`
5. **Zone**: Select `patreek.com` from dropdown
6. Click **Save**

### Step 5: Verify Deployment

1. Visit `https://patreek.com/public/pats/` in your browser
2. Should load correctly
3. Check Worker logs: **Workers & Pages** → Your Worker → **Logs** tab
4. Look for `[Worker] Request: /public/pats/` messages

## Rate Limiting Configuration (Free Tier)

The Worker is configured for **free tier** with these defaults:

```javascript
MAX_REQUESTS_PER_WINDOW: 100,  // 100 requests per IP per minute
TIME_WINDOW_SECONDS: 60,       // 1 minute window
RATE_LIMIT_PATHS: ['/public/pats/'], // Only rate limit article routes
USE_KV: false,                 // In-memory (FREE - no KV needed)
```

### Adjusting Rate Limits

To change limits, edit the code in Cloudflare Worker editor:

**More Aggressive (if under attack):**
```javascript
MAX_REQUESTS_PER_WINDOW: 50,   // 50 requests per minute
TIME_WINDOW_SECONDS: 60,
```

**Less Aggressive (if getting false positives):**
```javascript
MAX_REQUESTS_PER_WINDOW: 200,  // 200 requests per minute
TIME_WINDOW_SECONDS: 60,
```

After editing, click **Save and deploy**.

## Testing Rate Limiting

Test that rate limiting works:

```bash
# Make 101 requests quickly (if limit is 100)
for i in {1..101}; do
  curl -v https://patreek.com/public/pats/156335
done

# Should see 429 after 100 requests
```

## Monitoring

### View Worker Logs
1. Go to **Workers & Pages** → Your Worker → **Logs** tab
2. Look for:
   - `[Worker] Request: /public/pats/...` - Normal requests
   - `[Rate Limit] Blocked request from...` - Rate limited requests

### Check Analytics
1. Go to **Workers & Pages** → Your Worker → **Analytics** tab
2. View:
   - Requests per day
   - Error rate (429 responses)
   - Response times

## Free Tier Limits

Cloudflare Workers Free Tier includes:
- ✅ **100,000 requests per day** (plenty for most sites)
- ✅ **10ms CPU time per request** (more than enough for this Worker)
- ✅ **In-memory rate limiting** (no storage costs)
- ✅ **Unlimited bandwidth** (within request limits)

**Note**: If you exceed 100K requests/day, Cloudflare will charge $5/month for the Workers Paid plan. Monitor your usage in the Analytics tab.

## Troubleshooting

### Worker Not Routing Correctly
- Verify route is `patreek.com/*` (not `www.patreek.com/*`)
- Check that `patreek.com` is in Cloudflare (not just DNS)
- Ensure Worker is enabled (not paused)

### Rate Limiting Not Working
- Check `USE_KV: false` is set
- Verify `RATE_LIMIT_PATHS` includes the path you're testing
- Check Worker logs for `[Rate Limit]` messages

### 429 Errors for Legitimate Users
- Increase `MAX_REQUESTS_PER_WINDOW`
- Check if users share IPs (corporate networks, VPNs)
- Consider excluding certain paths from rate limiting

## Updating the Worker

When you need to update the Worker code:

1. Edit the code in Cloudflare Worker editor
2. Click **Save and deploy**
3. Changes take effect immediately (no downtime)

## Important Notes

- **In-memory rate limiting resets** when the Worker restarts (rare, but can happen)
- **Each Worker instance** has separate counters (fine for free tier)
- **No persistence** across restarts (acceptable for basic DDoS protection)
- **Free tier is sufficient** for most sites until you scale significantly

## Next Steps

1. ✅ Deploy the Worker (follow steps above)
2. ✅ Test rate limiting (use curl command)
3. ✅ Monitor logs for a few days
4. ✅ Adjust limits if needed

That's it! No KV setup needed, no additional costs. The Worker will protect your site from DDoS attacks using free tier resources.

