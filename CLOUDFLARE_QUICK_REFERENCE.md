# Cloudflare Worker Setup - Quick Reference

## Prerequisites
- ✅ Cloudflare account (free)
- ✅ Domain `patreek.com` added to Cloudflare
- ✅ Nameservers updated at GoDaddy

## Worker Code Location
- File: `cloudflare-worker.js`
- Copy the entire code and paste into Cloudflare Worker editor

## Route Configuration
- Route: `patreek.com/*`
- This makes the worker handle all requests to patreek.com

## What This Does

1. **ads.txt Handling**: 
   - When someone visits `patreek.com/ads.txt`
   - Worker fetches from `https://srv.adstxtmanager.com/19390/patreek.com`
   - Serves it directly (no redirect)

2. **All Other Requests**:
   - Proxies to `patreek.webflow.com`
   - Maintains `patreek.com` in the URL bar
   - Preserves all headers and content

## Testing

After setup, test:
- `https://patreek.com` → Should show Webflow site
- `https://patreek.com/ads.txt` → Should show Ezoic ads.txt content (no redirect)

## Free Tier Limits

- **100,000 requests/day** (free)
- More than enough for most sites
- If you exceed: $5/month for 10M requests

## Troubleshooting

- **Worker not working?** Check route configuration
- **DNS issues?** Verify nameservers are updated (can take up to 24 hours)
- **ads.txt not working?** Check Cloudflare Worker logs in dashboard

