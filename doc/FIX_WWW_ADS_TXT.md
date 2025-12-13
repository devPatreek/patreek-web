# Fix www.patreek.com/ads.txt 522 Error

## Problem
`www.patreek.com/ads.txt` returns a Cloudflare Error 522 (Connection timed out) because `www.patreek.com` is not properly configured in Cloudflare.

## Solution (Two Options)

### Option 1: Redirect www to non-www (RECOMMENDED - Already Implemented)

The Worker code has been updated to redirect `www.patreek.com` to `patreek.com`. However, you still need to add `www.patreek.com` as a custom domain to the Worker for the redirect to work.

**Steps:**
1. Go to Cloudflare Dashboard → **Workers & Pages**
2. Click on your Worker (the one with `patreek.com` route)
3. Go to **Triggers** tab
4. Under **"Custom Domains"**, click **"Add Custom Domain"**
5. Enter: `www.patreek.com`
6. Click **"Add Custom Domain"**

**Result:** `www.patreek.com/ads.txt` will redirect to `patreek.com/ads.txt` (301 redirect), which ad networks can access.

### Option 2: Serve Both Domains (Alternative)

If you want both `patreek.com` and `www.patreek.com` to work independently:

### Step 1: Add www.patreek.com to Cloudflare Pages

1. Go to Cloudflare Dashboard → **Workers & Pages**
2. Click on your `patreek-web` Pages project
3. Go to **Custom domains** tab
4. Click **"Set up a custom domain"** or **"Add custom domain"**
5. Enter: `www.patreek.com`
6. Cloudflare will automatically create the necessary DNS records (CNAME)
7. Wait for DNS propagation (usually 1-5 minutes)

### Step 2: Add www.patreek.com to Cloudflare Worker

1. Go to Cloudflare Dashboard → **Workers & Pages**
2. Click on your Worker (the one with `patreek.com` route)
3. Go to **Triggers** tab
4. Under **"Custom Domains"**, click **"Add Custom Domain"**
5. Enter: `www.patreek.com`
6. Click **"Add Custom Domain"**
7. Cloudflare will verify the domain is available

### Step 3: Verify DNS Records

Go to Cloudflare Dashboard → **DNS** → **Records**

You should see:
- `patreek.com` → A record or CNAME (for Pages)
- `www.patreek.com` → CNAME to `patreek-web.pages.dev` or similar (for Pages)

### Step 4: Test

After DNS propagates (1-5 minutes), test:
- ✅ `https://patreek.com/ads.txt` → Should work
- ✅ `https://www.patreek.com/ads.txt` → Should now work (no more 522 error)

### Alternative: Redirect www to non-www

If you prefer to redirect `www.patreek.com` to `patreek.com` instead of serving both:

1. Add this to the Worker code (in `cloudflare-worker.js`):
```javascript
// Redirect www to non-www
if (hostname === 'www.patreek.com') {
  return Response.redirect(`https://patreek.com${pathname}${url.search}`, 301);
}
```

2. Place this redirect **at the very beginning** of the `fetch` function, before rate limiting.

This way, `www.patreek.com/ads.txt` will redirect to `patreek.com/ads.txt`, which ad networks can access.

## Why This Happens

- Cloudflare Worker is configured for `patreek.com` only
- When someone accesses `www.patreek.com`, Cloudflare doesn't know where to route it
- It tries to connect to an origin server that doesn't exist → 522 error
- Adding `www.patreek.com` as a custom domain tells Cloudflare to route it through the Worker

## After Fix

Once `www.patreek.com/ads.txt` is accessible, ad networks should be able to verify your site.

