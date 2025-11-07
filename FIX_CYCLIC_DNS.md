# Fix Cyclic DNS Issue for www.patreek.com

## The Problem
- `www` CNAME → `patreek.com` (proxied/orange)
- `@` (root) → `patreek.com` 
- Worker is configured for `patreek.com` only
- When accessing `www.patreek.com`, Cloudflare doesn't know to route it to the Worker → 522 timeout

## Solution: Use Page Rule to Redirect www → non-www

Since adding `www.patreek.com` as a custom domain to the Worker fails, use a Page Rule instead. This redirects `www` → `patreek.com` at the Cloudflare level, before it reaches the Worker.

### Step 1: Create Page Rule

1. Go to Cloudflare Dashboard → **Rules** → **Page Rules**
2. Click **"Create Page Rule"**
3. Configure:
   - **URL:** `www.patreek.com/*`
   - **Setting:** Click **"+ Add a Setting"**
   - Select: **Forwarding URL**
   - Choose: **301 - Permanent Redirect**
   - **Destination URL:** `https://patreek.com/$1`
4. Click **"Save and Deploy"**

**Note:** Free tier allows 3 Page Rules. This uses 1.

### Step 2: Verify

After creating the Page Rule:
1. Wait 1-2 minutes
2. Test: `https://www.patreek.com/ads.txt`
3. Should redirect to: `https://patreek.com/ads.txt`
4. No more 522 error!

## Why This Works

- Page Rule intercepts `www.patreek.com` requests **before** they reach the Worker
- Redirects to `patreek.com` at Cloudflare level
- `patreek.com` then routes through the Worker normally
- No cyclic DNS issue

## Alternative: Change DNS Record Target

If you prefer not to use a Page Rule, you could:

1. Change `www` CNAME target from `patreek.com` to `patreek-web.pages.dev` (Cloudflare Pages)
2. This routes `www.patreek.com` directly to Pages
3. But then you'd need to handle redirects differently

**However, Page Rule is simpler and cleaner.**

