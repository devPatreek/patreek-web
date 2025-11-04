# Connecting patreek.com to Next.js App (Vercel)

## Current Situation
- Domain: patreek.com (GoDaddy)
- Currently: Connected to Webflow
- Goal: Connect to Next.js app on Vercel

## Step-by-Step Instructions

### Step 1: Deploy to Vercel

1. **Push code to GitHub** (if not already):
   ```bash
   cd /Users/okoro/dev/patreek-web
   git init
   git add .
   git commit -m "Initial commit"
   # Create repo on GitHub and push
   git remote add origin https://github.com/YOUR_USERNAME/patreek-web.git
   git push -u origin main
   ```

2. **Deploy to Vercel**:
   - Go to https://vercel.com
   - Sign up/login (use GitHub account)
   - Click "Add New..." → "Project"
   - Import your `patreek-web` repository
   - Configure:
     - Framework Preset: Next.js (auto-detected)
     - Environment Variables:
       - `NEXT_PUBLIC_API_URL` = `http://patreekbackend-env.eba-ifvfvi7q.us-east-1.elasticbeanstalk.com`
   - Click "Deploy"

3. **Wait for deployment** (usually 1-2 minutes)

### Step 2: Configure Domain in Vercel

1. In your Vercel project dashboard, go to **Settings** → **Domains**
2. Click **Add Domain**
3. Enter: `patreek.com`
4. Click **Add**
5. Also add: `www.patreek.com`
6. Vercel will show you DNS records to add

### Step 3: Update GoDaddy DNS

You have **two options**:

#### Option A: Use Vercel Nameservers (Recommended - Easier)

1. In Vercel, copy the **nameservers** shown (usually something like):
   - `ns1.vercel-dns.com`
   - `ns2.vercel-dns.com`

2. In GoDaddy:
   - Go to your domain management
   - Click on **patreek.com** → **DNS**
   - Scroll to **Nameservers** section
   - Click **Change**
   - Select **Custom**
   - Enter Vercel's nameservers
   - Save

3. Wait 24-48 hours for DNS propagation

#### Option B: Keep GoDaddy DNS, Add A/CNAME Records

1. In GoDaddy DNS Management:
   - Remove or disable Webflow DNS records
   - Add these records:

   **For root domain (patreek.com):**
   - Type: **A**
   - Name: `@`
   - Value: `76.76.21.21` (Vercel's IP - check Vercel dashboard for current IP)
   - TTL: 1 hour

   **For www subdomain:**
   - Type: **CNAME**
   - Name: `www`
   - Value: `cname.vercel-dns.com` (or use the value Vercel provides)
   - TTL: 1 hour

2. Wait 1-24 hours for DNS propagation

### Step 4: Verify DNS Propagation

Test if DNS is working:
```bash
# Check if domain resolves to Vercel
dig patreek.com
nslookup patreek.com
```

Or use online tools:
- https://www.whatsmydns.net/
- https://dnschecker.org/

### Step 5: Update Universal Links Files

After deployment, update these files in Vercel (or via GitHub):

1. **Get your Apple Team ID**:
   - Go to Apple Developer account
   - Find your Team ID (format: `ABC123DEF4`)

2. **Update `public/.well-known/apple-app-site-association`**:
   - Replace `TEAM_ID` with your actual Team ID
   - Example: `"appID": "ABC123DEF4.com.patreek.app"`

3. **Get Android SHA256 fingerprint**:
   - From your Android app signing certificate
   - Or generate from your keystore

4. **Update `public/.well-known/assetlinks.json`**:
   - Replace `YOUR_APP_SHA256_FINGERPRINT` with actual fingerprint

5. **Redeploy** (push changes to GitHub, Vercel auto-deploys)

### Step 6: Test

1. Visit `https://patreek.com/article/123` (replace 123 with actual article ID)
2. Share an article from the app
3. Click the shared link - should open in app if installed

## Important Notes

- **DNS propagation can take 24-48 hours** (usually faster)
- **Keep Webflow backup** until Vercel is confirmed working
- **SSL Certificate**: Vercel automatically provides SSL (HTTPS)
- **Caching**: Vercel caches aggressively, changes may take a few minutes

## Troubleshooting

- **Domain not resolving?** Wait longer for DNS propagation
- **404 errors?** Check Vercel deployment logs
- **Universal Links not working?** Verify `.well-known` files are accessible:
  - `https://patreek.com/.well-known/apple-app-site-association`
  - `https://patreek.com/.well-known/assetlinks.json`

