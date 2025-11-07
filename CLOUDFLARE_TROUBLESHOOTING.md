# Troubleshooting: patreek.com Not Resolving

## Problem
`ping patreek.com` fails - DNS not resolving

## Common Causes & Solutions

### 1. Nameservers Not Updated in GoDaddy ⚠️ MOST LIKELY

**Check current nameservers:**
```bash
dig NS patreek.com +short
```

**If you see GoDaddy nameservers** (ns73.domaincontrol.com, ns74.domaincontrol.com):
- Nameservers haven't been changed to Cloudflare yet
- Go to GoDaddy → Domain Settings → Nameservers
- Change to Cloudflare nameservers (from Cloudflare dashboard)

**If you see Cloudflare nameservers** (amanda.ns.cloudflare.com, jasper.ns.cloudflare.com):
- DNS propagation may still be in progress (can take up to 24 hours)
- Wait a few hours and try again

### 2. DNS Propagation Delay

After changing nameservers:
- Can take 1-24 hours for global DNS propagation
- Check propagation status: https://www.whatsmydns.net/#NS/patreek.com
- Should show Cloudflare nameservers globally

### 3. Cloudflare Domain Status

Check in Cloudflare dashboard:
- Go to **Overview** for `patreek.com`
- Status should be **"Active"** (not "Pending" or "Moved")
- Nameservers should match what you set in GoDaddy

### 4. Worker Route Configuration

Even if DNS resolves, check:
- Worker → **Domains & Routes** → Should show `patreek.com`
- If missing, add it (Step 5)

## Quick Fix Steps

1. **Verify nameservers in GoDaddy:**
   - GoDaddy → My Products → Domains → patreek.com → DNS
   - Check "Nameservers" section
   - Should show Cloudflare nameservers (not GoDaddy's)

2. **If still showing GoDaddy nameservers:**
   - Change to "Custom Nameservers"
   - Enter Cloudflare nameservers from Cloudflare dashboard
   - Save and wait for propagation

3. **Check Cloudflare status:**
   - Cloudflare dashboard → patreek.com → Overview
   - Should show "Active" status
   - Nameservers should match

4. **Wait for DNS propagation:**
   - Usually 1-2 hours, can take up to 24 hours
   - Check: https://www.whatsmydns.net/#NS/patreek.com

## Expected Result

After nameservers are updated and propagated:
- `dig NS patreek.com` should show Cloudflare nameservers
- `ping patreek.com` should resolve (may not respond to ping, but DNS should resolve)
- `curl patreek.com` should work
- `curl patreek.com/ads.txt` should show Ezoic content

