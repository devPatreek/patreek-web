# Cloudflare Workers Reverse Proxy Setup Guide

## ⚠️ IMPORTANT: Disconnect Domain from Webflow First

**Before starting**, you need to disconnect `patreek.com` from Webflow:

1. Go to your Webflow dashboard
2. Navigate to your site settings → **Hosting** → **Custom Domain**
3. Find `patreek.com` and click **"Remove"** or **"Disconnect"**
4. Confirm the removal

**Why?** Webflow currently manages your DNS. Cloudflare needs to manage DNS to set up the reverse proxy.

---

## Step 1: Create Cloudflare Account (Free)

1. Go to: https://dash.cloudflare.com/sign-up
2. Sign up with your email (free account)
3. Verify your email

## Step 2: Add Your Domain to Cloudflare

1. In Cloudflare dashboard, click **"Add a site"**
2. Enter `patreek.com`
3. Cloudflare will scan your DNS records
4. **Click "Finish setup" button** (if you see it)
   - This completes zone initialization
   - Cloudflare will provide nameservers to update in GoDaddy
5. Follow the prompts to update your nameservers at your domain registrar (GoDaddy)

**Important: Nameserver changes are PER DOMAIN, not per account!**

When you update nameservers:
- ✅ Only affects `patreek.com` (the specific domain you're configuring)
- ✅ Other domains in your GoDaddy account are **NOT affected**
- ✅ GoDaddy still owns/manages the domain registration (you still pay GoDaddy)
- ✅ Cloudflare only manages DNS for `patreek.com` (not domain ownership)

**How to update nameservers in GoDaddy:**
1. Go to GoDaddy → **My Products** → **Domains**
2. Find `patreek.com` → Click **"DNS"** or **"Manage"**
3. Scroll to **"Nameservers"** section (NOT "DNS Records")
4. Change from "GoDaddy Nameservers" to **"Custom Nameservers"**
5. Enter Cloudflare's nameservers (shown in Cloudflare dashboard after clicking "Finish setup", e.g., `amanda.ns.cloudflare.com`, `jasper.ns.cloudflare.com`)
6. Click **"Save"**

**⚠️ Don't add NS records in DNS Records table** - Update nameservers in the Nameservers section instead!

**After updating nameservers:**
- Wait 1-24 hours for DNS propagation (usually 1-2 hours)
- Cloudflare status will change from "Pending" to "Active"
- Check propagation: https://www.whatsmydns.net/#NS/patreek.com

## Step 3: Create a Cloudflare Worker

1. In Cloudflare dashboard, go to **Workers & Pages** → **Create application**
2. Click **"Create Worker"**
3. Name it (e.g., `patreek-proxy`)
4. Click **"Deploy"**

## Step 4: Add the Worker Code

Replace the default code with the code from `cloudflare-worker.js` (see below)

## Step 5: Configure Route

1. In your Worker dashboard, look at the **"Domains & Routes"** section (in the main content area)
2. Click the **"+ Add"** button in the "Domains & Routes" section
3. Select **"Custom Domain"** option
4. Enter the domain: `patreek.com` (⚠️ **without the `/*`** - just the domain name)

**If you get error: "Hostname already has externally managed DNS records":**

This means DNS records exist. You have two options:

**Option A: Delete existing DNS records (Recommended)**
1. Go to Cloudflare dashboard → **DNS** → **Records**
2. Delete any A or CNAME records for `patreek.com` (especially ones pointing to Webflow)
3. Then try adding the custom domain again

**Option B: Use override option**
1. When adding the custom domain, look for a checkbox or option: **"Override existing DNS record"** or **"override_existing_dns_record"**
2. Check this option
3. Then add `patreek.com`

**Why this happens:**
- If you added `patreek.com` to Cloudflare in Step 2, it may have imported existing DNS records
- These records conflict with the Worker route
- You need to either delete them or override them

5. Click **"Save"** or **"Add"**

**Important**: 
- ❌ Don't enter `patreek.com/*` - this causes "invalid hostname" error
- ✅ Just enter `patreek.com` (without wildcard)
- Cloudflare will automatically handle all paths (`/`, `/ads.txt`, etc.)

## Step 6: DNS Record for Webflow (NOT NEEDED!)

**⚠️ Skip this step!** You don't need to add a DNS record.

**Why?**
- When you added `patreek.com` as a custom domain to your Worker (Step 5), Cloudflare automatically created the necessary DNS routing
- The Worker handles all requests and proxies them to `patreek.webflow.com`
- Adding a CNAME record would conflict with the Worker's routing

**If you see error: "A DNS record managed by Workers already exists"**
- This confirms the Worker is managing DNS for `patreek.com`
- You don't need to add any DNS records
- The Worker code (`cloudflare-worker.js`) handles routing to Webflow

**What happens:**
- ✅ `patreek.com` → Worker intercepts → Proxies to `patreek.webflow.io`
- ✅ `patreek.com/ads.txt` → Worker serves ads.txt file
- ✅ No DNS records needed - Worker handles everything

## Step 7: Reconnect Domain in Webflow (Optional)

After Cloudflare is set up, you can optionally reconnect the domain in Webflow:
- This won't conflict because Cloudflare Worker will intercept requests first
- Or leave it disconnected - the Worker proxies to `patreek.webflow.io` directly

## That's it!

Your reverse proxy is now active. `patreek.com` will show content from `patreek.webflow.io`, and `patreek.com/ads.txt` will work without redirects.

## What Happens After Setup

- ✅ `patreek.com` → Cloudflare Worker → `patreek.webflow.io` (via proxy)
- ✅ `patreek.com/ads.txt` → Served directly (no redirect)
- ✅ All other paths → Proxied to Webflow

