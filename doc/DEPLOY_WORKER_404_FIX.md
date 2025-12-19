# Deploy Worker 404 Fix

## What Changed
Updated `cloudflare-worker.js` to detect when Webflow returns a 404 and serve the branded Patreek 404 page from Cloudflare Pages instead.

## How to Deploy

### Option 1: Using Wrangler CLI (Recommended)
```bash
cd /Users/okoro/dev/patreek-web
wrangler deploy cloudflare-worker.js --name patreek-proxy
```

### Option 2: Using Cloudflare Dashboard
1. Go to Cloudflare Dashboard → Workers & Pages
2. Find your Worker (e.g., `patreek-proxy`)
3. Click "Edit code"
4. Copy the entire contents of `cloudflare-worker.js`
5. Paste into the Worker editor
6. Click "Save and deploy"

## Verify
After deployment, test:
- Visit: `https://patreek.com/dcdcdxccZcx` (or any non-existent page)
- Should show: Branded Patreek 404 page with "Return to Patreek.com" CTA
- Should NOT show: Webflow 404 page

## How It Works
1. Worker receives request for non-existent page
2. Worker proxies to Webflow
3. Webflow returns 404
4. Worker detects 404 status
5. Worker fetches `/404.html` from Cloudflare Pages
6. Worker serves Pages 404 page instead of Webflow 404
