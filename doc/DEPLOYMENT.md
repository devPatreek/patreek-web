# Patreek Web Deployment Guide

## Option 1: Deploy to Vercel (Recommended)

Vercel is the best platform for Next.js apps and offers free hosting.

### Steps:

1. **Push your code to GitHub**
   ```bash
   cd /Users/okoro/dev/patreek-web
   git init
   git add .
   git commit -m "Initial commit"
   # Create a repo on GitHub and push
   ```

2. **Deploy to Vercel**
   - Go to https://vercel.com
   - Sign up/login with GitHub
   - Click "New Project"
   - Import your `patreek-web` repository
   - Add environment variable: `NEXT_PUBLIC_API_URL` = `http://patreekbackend-env.eba-ifvfvi7q.us-east-1.elasticbeanstalk.com`
   - Click "Deploy"

3. **Update GoDaddy DNS**
   - Go to GoDaddy DNS management
   - Remove or disable the Webflow DNS records
   - Add these records:
     - **A Record**: `@` → Vercel IP (you'll get this from Vercel)
     - **CNAME Record**: `www` → `cname.vercel-dns.com` (or use Vercel's custom domain instructions)
   - OR better: Use Vercel's nameservers (recommended)

4. **Configure Custom Domain in Vercel**
   - In Vercel project settings → Domains
   - Add `patreek.com` and `www.patreek.com`
   - Follow Vercel's DNS instructions (they'll provide exact records)

### Vercel DNS Records (if using Vercel nameservers):
- Change nameservers in GoDaddy to Vercel's (provided in Vercel dashboard)

## Option 2: Keep Webflow + Route Articles to Next.js

If you want to keep your Webflow site on the root, you can:

1. Deploy Next.js to a subdomain: `read.patreek.com` or `app.patreek.com`
2. Update share URLs to use the subdomain
3. Or use a proxy/CDN to route `/article/*` to Next.js

## Required Server Files for Universal Links

After deployment, you need to host these files:

### 1. Apple App Site Association
Create: `public/.well-known/apple-app-site-association` (no file extension!)

```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "YOUR_TEAM_ID.com.patreek.app",
        "paths": ["/article/*"]
      }
    ]
  }
}
```

Replace `YOUR_TEAM_ID` with your Apple Developer Team ID.

### 2. Android Asset Links
Create: `public/.well-known/assetlinks.json`

```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "com.patreek.app",
    "sha256_cert_fingerprints": ["YOUR_APP_SHA256_FINGERPRINT"]
  }
}]
```

You'll get the SHA256 fingerprint from your Android app signing.

## Next.js Configuration for .well-known

Vercel automatically serves files from `public/.well-known/`, so just create the files there.

