# Cloudflare Worker Rate Limiting Setup Guide

## Overview
This guide explains how to set up rate limiting in the Cloudflare Worker to protect against DDoS attacks.

## How It Works

The rate limiting implementation:
- **Tracks requests per IP address** using Cloudflare KV storage (or in-memory fallback)
- **Uses sliding window** algorithm (resets every time window)
- **Returns 429 Too Many Requests** when limit exceeded
- **Configurable** limits and time windows
- **Path-specific** - can rate limit only specific routes (e.g., `/public/pats/*`)

## Configuration

Edit the `RATE_LIMIT_CONFIG` object in `cloudflare-worker.js`:

```javascript
const RATE_LIMIT_CONFIG = {
  MAX_REQUESTS_PER_WINDOW: 100,      // Max requests per IP per window
  TIME_WINDOW_SECONDS: 60,           // Time window (60 = 1 minute)
  RATE_LIMIT_PATHS: ['/public/pats/'], // Paths to rate limit (empty = all paths)
  USE_KV: true,                      // Use KV storage (false = in-memory only)
};
```

### Recommended Settings

**For DDoS Protection:**
```javascript
MAX_REQUESTS_PER_WINDOW: 100,  // 100 requests per minute
TIME_WINDOW_SECONDS: 60,       // 1 minute window
RATE_LIMIT_PATHS: ['/public/pats/'], // Only rate limit article routes
```

**More Aggressive (if under attack):**
```javascript
MAX_REQUESTS_PER_WINDOW: 50,   // 50 requests per minute
TIME_WINDOW_SECONDS: 60,       // 1 minute window
RATE_LIMIT_PATHS: ['/public/pats/'],
```

**Very Aggressive:**
```javascript
MAX_REQUESTS_PER_WINDOW: 30,   // 30 requests per minute
TIME_WINDOW_SECONDS: 60,       // 1 minute window
RATE_LIMIT_PATHS: ['/public/pats/'],
```

## Setup Options

### Option 1: Using KV Storage (Recommended)

**Pros:**
- Persistent across worker restarts
- More accurate rate limiting
- Better for distributed attacks

**Cons:**
- Requires KV namespace setup
- Uses KV read/write quota (free tier: 100K reads/day, 1K writes/day)

**Setup Steps:**

1. **Create KV Namespace:**
   ```bash
   # Using Wrangler CLI
   wrangler kv:namespace create "RATE_LIMIT_KV"
   ```

2. **Add to `wrangler.toml`:**
   ```toml
   [[kv_namespaces]]
   binding = "RATE_LIMIT_KV"
   id = "your-kv-namespace-id"
   ```

3. **Bind in Cloudflare Dashboard:**
   - Go to Workers & Pages → Your Worker → Settings → Variables
   - Add KV namespace binding: `RATE_LIMIT_KV`

4. **Update Worker Code:**
   - Set `USE_KV: true` in `RATE_LIMIT_CONFIG`

### Option 2: In-Memory Only (Simpler)

**Pros:**
- No setup required
- Works immediately
- No KV quota usage

**Cons:**
- Resets on worker restart
- Less accurate for distributed attacks
- Each worker instance has separate counters

**Setup Steps:**

1. **Set `USE_KV: false`** in `RATE_LIMIT_CONFIG`
2. **Deploy** - that's it!

## Rate Limit Headers

The worker adds these headers to responses:

- `X-RateLimit-Limit`: Maximum requests allowed per window
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: Unix timestamp when limit resets
- `Retry-After`: Seconds to wait before retrying (on 429 responses)

## Testing

Test rate limiting:

```bash
# Make 101 requests quickly (if limit is 100)
for i in {1..101}; do
  curl -v https://patreek.com/public/pats/156335
done

# Should see 429 after 100 requests
```

## Monitoring

Check Cloudflare Worker logs:
1. Go to Workers & Pages → Your Worker → Logs
2. Look for `[Rate Limit]` messages
3. Monitor 429 response counts

## Cost Analysis

### KV Storage (Free Tier)
- **100,000 reads/day** = ~69 reads/minute
- **1,000 writes/day** = ~0.7 writes/minute
- **For 100 req/min limit**: ~200 KV operations/min (100 read + 100 write)
- **Daily usage**: ~288,000 operations/day
- **Cost**: Free tier covers ~35% of usage, then $0.50 per million operations

### Recommendation
- **Start with in-memory** (`USE_KV: false`) for testing
- **Switch to KV** if you need persistence or are under attack
- **Monitor KV usage** in Cloudflare dashboard

## Advanced: Path-Specific Limits

You can rate limit different paths with different limits:

```javascript
// Example: Different limits for different paths
const pathLimits = {
  '/public/pats/': { max: 100, window: 60 },
  '/api/': { max: 50, window: 60 },
  '/': { max: 200, window: 60 }
};
```

This requires modifying the `checkRateLimit` function to accept path-specific configs.

## Troubleshooting

**Rate limit not working:**
- Check `USE_KV` setting matches your KV namespace setup
- Verify KV namespace is bound to the Worker
- Check Worker logs for errors

**Too many false positives:**
- Increase `MAX_REQUESTS_PER_WINDOW`
- Increase `TIME_WINDOW_SECONDS`
- Check if legitimate users share IPs (corporate networks, VPNs)

**KV quota exceeded:**
- Switch to in-memory (`USE_KV: false`)
- Or upgrade KV plan
- Or reduce `MAX_REQUESTS_PER_WINDOW` to reduce writes

