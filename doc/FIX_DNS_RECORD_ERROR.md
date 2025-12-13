# Fix "DNS record could not be added" Error for www.patreek.com

## The Error
When trying to add `www.patreek.com` as a custom domain to the Worker, you get:
> "A DNS record for www.patreek.com could not be added. Please try again later."

## Solution: Manually Create DNS Record

Since Cloudflare can't automatically create the DNS record, we'll create it manually and then the Worker will handle it.

### Step 1: Check Existing DNS Records

1. Go to Cloudflare Dashboard → **DNS** → **Records**
2. Look for any record with name `www` or `www.patreek.com`
3. **Note what you see:**
   - Is there a CNAME record?
   - Is there an A record?
   - What does it point to?

### Step 2: Delete Conflicting DNS Record (if exists)

If you see a `www` record:
1. Click on the record
2. Click **"Delete"**
3. Confirm deletion

**Important:** If the record is pointing to Webflow or another service, delete it. The Worker will handle routing instead.

### Step 3: Create DNS Record Manually

1. Go to Cloudflare Dashboard → **DNS** → **Records**
2. Click **"Add record"**
3. Configure:
   - **Type:** `CNAME`
   - **Name:** `www`
   - **Target:** `patreek.com` (the root domain)
   - **Proxy status:** **Proxied** ✅ (orange cloud icon - this is CRITICAL)
   - **TTL:** Auto
4. Click **"Save"**

**Why `patreek.com` as target?**
- Since `patreek.com` is already configured as a custom domain on the Worker
- Cloudflare will route `www.patreek.com` through the same Worker
- The Worker code will then redirect `www` → non-www

### Step 4: Verify Worker Handles Both Domains

The Worker code already has the redirect logic:
```javascript
if (hostname === 'www.patreek.com') {
  return Response.redirect(`https://patreek.com${pathname}${url.search}`, 301);
}
```

Since both `patreek.com` and `www.patreek.com` will route through the same Worker (via the CNAME), the redirect will work.

### Step 5: Wait and Test

1. Wait 1-5 minutes for DNS propagation
2. Test: `https://www.patreek.com/ads.txt`
3. It should redirect to `https://patreek.com/ads.txt`
4. No more 522 error!

## Alternative: Use Page Rules (If Above Doesn't Work)

If the CNAME approach doesn't work, you can use Cloudflare Page Rules:

1. Go to Cloudflare Dashboard → **Rules** → **Page Rules**
2. Click **"Create Page Rule"**
3. Configure:
   - **URL:** `www.patreek.com/*`
   - **Setting:** **Forwarding URL** → **301 Permanent Redirect**
   - **Destination URL:** `https://patreek.com/$1`
4. Click **"Save and Deploy"**

**Note:** Page Rules are limited on free tier (3 rules), so use this as a last resort.

## Why This Happens

- Cloudflare's automatic DNS record creation sometimes fails
- There might be a conflict with existing records
- The domain might be in a transitional state
- Manual DNS record creation bypasses these issues

## Verification Checklist

After creating the DNS record:
- [ ] DNS record for `www` exists (CNAME → `patreek.com`)
- [ ] Record is "Proxied" (orange cloud icon)
- [ ] Waited 5+ minutes
- [ ] Tested `https://www.patreek.com/ads.txt` → redirects to `patreek.com/ads.txt`
- [ ] No 522 error

