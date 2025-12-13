# Fix www.patreek.com 522 Error - DNS Record Exists

## Current Situation
You already have a CNAME record for `www` in Cloudflare DNS, but `www.patreek.com` still returns a 522 error.

## What to Check

### Step 1: Verify DNS Record Configuration

Go to Cloudflare Dashboard → **DNS** → **Records** and check your `www` CNAME record:

**Critical Check #1: Proxy Status**
- ✅ **Orange cloud icon** = Proxied (GOOD - goes through Cloudflare)
- ❌ **Gray cloud icon** = DNS-only (BAD - bypasses Cloudflare/Worker)

**If it's gray (DNS-only):**
1. Click on the `www` record
2. Click the cloud icon to turn it **orange** (Proxied)
3. Click **"Save"**

**Critical Check #2: Target**
- What does the `www` CNAME point to?
- Should point to: `patreek.com` (root domain)
- OR could point to: `patreek-web.pages.dev` (Cloudflare Pages)

### Step 2: Verify Worker Route

The Worker needs to handle `www.patreek.com`. Since you can't add it as a custom domain, verify:

1. Go to Cloudflare Dashboard → **Workers & Pages**
2. Click on your Worker
3. Go to **Triggers** tab
4. Under **"Custom Domains"**, what do you see?
   - Do you see `patreek.com`? ✅
   - Do you see `www.patreek.com`? ❓

### Step 3: The Issue

If the DNS record exists but you're still getting 522, it likely means:

**Scenario A: DNS record is DNS-only (gray cloud)**
- Solution: Turn on proxying (orange cloud)

**Scenario B: DNS record points to wrong target**
- If it points to Webflow or an old server → Change target to `patreek.com`
- If it points to `patreek.com` but Worker doesn't handle `www` → Need to add Worker route

**Scenario C: Worker doesn't handle www subdomain**
- The Worker is configured for `patreek.com` only
- When `www.patreek.com` is accessed, Cloudflare routes it but Worker doesn't recognize it
- Solution: The CNAME + proxying should work, but we might need to ensure Worker handles it

## Solution: Ensure DNS is Proxied

**Most likely fix:**

1. Go to **DNS** → **Records**
2. Find the `www` CNAME record
3. Make sure it has an **orange cloud icon** (Proxied)
4. If it's gray, click the cloud icon to turn it orange
5. Click **"Save"**
6. Wait 1-5 minutes
7. Test: `https://www.patreek.com/ads.txt`

## Alternative: Use Page Rule for Redirect

If DNS proxying doesn't work, use a Page Rule to redirect:

1. Go to Cloudflare Dashboard → **Rules** → **Page Rules**
2. Click **"Create Page Rule"**
3. Configure:
   - **URL:** `www.patreek.com/*`
   - **Setting:** **Forwarding URL** → **301 Permanent Redirect**
   - **Destination URL:** `https://patreek.com/$1`
4. Click **"Save and Deploy"**

This will redirect `www.patreek.com` to `patreek.com` at the Cloudflare level, before it even reaches the Worker.

## Quick Diagnostic

Please check and tell me:
1. What does the `www` CNAME record point to? (Target value)
2. Is the cloud icon **orange** (Proxied) or **gray** (DNS-only)?
3. What custom domains are listed in your Worker's Triggers tab?

This will help me provide the exact fix!

