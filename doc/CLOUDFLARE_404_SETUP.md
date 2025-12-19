# Cloudflare 404 Page Setup

## Problem
When visiting non-existent pages on patreek.com, users see the Webflow 404 page instead of the branded Patreek 404 page.

## Solution Options

### Option 1: Use Cloudflare Pages (Recommended)
If patreek.com is connected to Cloudflare Pages:
1. Go to Cloudflare Dashboard → Pages → patreek-web
2. Settings → Custom error pages
3. Edit "404 Not Found" entry
4. Set path/URL to: `/404` or `/404.html`
5. Save

### Option 2: Update Cloudflare Worker
If patreek.com is using a Cloudflare Worker (proxying to Webflow):
- The Worker needs to be updated to check for 404 responses
- When Webflow returns 404, serve the Pages 404 page instead
- Or route 404 requests directly to Cloudflare Pages

### Option 3: Connect Domain to Cloudflare Pages
If the domain is currently only connected to the Worker:
1. In Cloudflare Dashboard → Pages → patreek-web
2. Go to Custom domains
3. Add patreek.com as a custom domain
4. This will route requests to Pages instead of (or alongside) the Worker
