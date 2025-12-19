# Worker 404 Troubleshooting

## Problem
Unknown routes like `/dcdcdxccZcx` are still showing Webflow 404 instead of branded Patreek 404.

## Solution Implemented
The Worker now checks if a route is known BEFORE proxying to Webflow:
- Unknown routes → Serve 404 page directly from Cloudflare Pages
- Known routes → Handle normally (Pages or Webflow as needed)

## Verification Steps

### 1. Check Worker Route Configuration
Go to Cloudflare Dashboard → Workers & Pages → patreek-proxy → Settings → Triggers

**Required Route:**
- Route pattern: `patreek.com/*`
- This ensures the Worker intercepts ALL requests to patreek.com

### 2. Check Worker Logs
```bash
cd /Users/okoro/dev/patreek-web
wrangler tail patreek-proxy
```

Then visit `https://patreek.com/dcdcdxccZcx` in another terminal.

**Expected logs:**
```
[Worker] Route check for /dcdcdxccZcx: UNKNOWN → 404
[Worker] Unknown route /dcdcdxccZcx on patreek.com, serving 404 page directly (skipping Webflow)
```

If you DON'T see these logs, the Worker isn't intercepting the request.

### 3. Clear Cloudflare Cache
The response might be cached. Options:
- Wait 5-10 minutes for cache to expire
- Go to Cloudflare Dashboard → Caching → Purge Everything
- Or add cache-busting: `https://patreek.com/dcdcdxccZcx?t=123`

### 4. Verify Worker is Active
Check Cloudflare Dashboard → Workers & Pages → patreek-proxy
- Status should be "Active"
- Latest deployment should be recent
- Route should show `patreek.com/*`

## If Still Not Working

1. **Worker route not configured:**
   - Add route: `patreek.com/*` in Cloudflare Dashboard
   - Save and wait 1-2 minutes

2. **Worker not deployed:**
   - Run: `wrangler deploy cloudflare-worker.js --name patreek-proxy`
   - Verify deployment succeeded

3. **Cache issue:**
   - Purge Cloudflare cache
   - Test with cache-busting parameter

4. **DNS/Route conflict:**
   - Check if there's a conflicting route or DNS record
   - Verify Worker route takes precedence
