# Fix www.patreek.com 522 Error - Step by Step

## The Problem
`www.patreek.com` returns Error 522 because Cloudflare doesn't know where to route it. The Worker redirect code exists, but Cloudflare needs to be told to route `www.patreek.com` to the Worker first.

## Solution: Add www.patreek.com to Worker Custom Domains

### Step 1: Check Current DNS Records

1. Go to Cloudflare Dashboard → **DNS** → **Records**
2. Look for any record with name `www` or `www.patreek.com`
3. **Note what you see:**
   - Is there a CNAME record for `www`?
   - What does it point to?
   - Is there an A record?

### Step 2: Add www.patreek.com as Custom Domain to Worker

**This is the critical step:**

1. Go to Cloudflare Dashboard → **Workers & Pages**
2. Click on your Worker (the one that has `patreek.com` as a custom domain)
3. Go to **Triggers** tab
4. Scroll to **"Custom Domains"** section
5. Click **"Add Custom Domain"**
6. Enter: `www.patreek.com` (without `https://` or `/*`)
7. Click **"Add Custom Domain"**

**If you get an error:**

**Error: "Hostname already has externally managed DNS records"**
- This means there's a DNS record for `www` that conflicts
- **Solution:** Go to **DNS** → **Records**, find the `www` record, and either:
  - Delete it (if it's pointing to an old server)
  - OR change it to point to Cloudflare (CNAME to `patreek-web.pages.dev`)

**Error: "A DNS record managed by Workers already exists"**
- This means Cloudflare is trying to create a DNS record but one already exists
- **Solution:** Delete the existing `www` DNS record first, then add the custom domain

### Step 3: Verify DNS After Adding Custom Domain

After adding `www.patreek.com` as a custom domain:

1. Go to **DNS** → **Records**
2. You should see a new record created automatically:
   - Name: `www`
   - Type: `CNAME` or `A`
   - Points to: Something like `patreek-com-router.workers.dev` or similar

### Step 4: Wait for DNS Propagation

- Wait 1-5 minutes for DNS changes to propagate
- You can check status at: https://www.whatsmydns.net/#CNAME/www.patreek.com

### Step 5: Test

After propagation:
1. Visit: `https://www.patreek.com/ads.txt`
2. It should redirect to `https://patreek.com/ads.txt` (301 redirect)
3. No more 522 error!

## Alternative: Create DNS Record Manually

If adding as a custom domain doesn't work, you can create a DNS record manually:

1. Go to Cloudflare Dashboard → **DNS** → **Records**
2. Click **"Add record"**
3. Configure:
   - **Type:** `CNAME`
   - **Name:** `www`
   - **Target:** `patreek.com` (or your Worker's domain)
   - **Proxy status:** Proxied (orange cloud) ✅
   - **TTL:** Auto
4. Click **"Save"**

**Note:** This approach might not work if the Worker isn't configured to handle `www.patreek.com`. The custom domain method is preferred.

## Why This Happens

- Cloudflare Worker is only configured for `patreek.com`
- When someone visits `www.patreek.com`, Cloudflare looks for DNS records
- If there's a DNS record pointing to an old/unreachable server → 522 error
- If there's no DNS record → Cloudflare doesn't know where to route it → 522 error
- **Solution:** Add `www.patreek.com` as a custom domain to the Worker so Cloudflare routes it correctly

## Troubleshooting

**Still getting 522 after adding custom domain?**

1. **Check Worker logs:**
   - Go to Worker → **Logs** tab
   - Look for requests to `www.patreek.com`
   - If you see no logs, the Worker isn't receiving the requests

2. **Check DNS records:**
   - Make sure there's a `www` record pointing to Cloudflare (proxied)
   - Delete any old records pointing to Webflow or other servers

3. **Clear Cloudflare cache:**
   - Go to **Caching** → **Configuration** → **Purge Everything**

4. **Wait longer:**
   - DNS changes can take up to 24 hours (usually 1-5 minutes)

## Quick Checklist

- [ ] Added `www.patreek.com` as custom domain to Worker
- [ ] Verified DNS record for `www` exists in Cloudflare
- [ ] DNS record is "Proxied" (orange cloud icon)
- [ ] Waited 5+ minutes for DNS propagation
- [ ] Tested `https://www.patreek.com/ads.txt`

