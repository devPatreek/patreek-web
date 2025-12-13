# Setting Up admin.patreek.com - Step by Step Guide

## Method 1: Add Custom Domain via Worker Settings (Recommended)

### Step-by-Step Instructions:

1. **Log into Cloudflare Dashboard**
   - Go to: https://dash.cloudflare.com
   - Make sure you're logged in

2. **Navigate to Your Worker**
   - In the left sidebar, click **"Workers & Pages"**
   - You should see a list of your Workers
   - **Click on the name of your Worker** (the one that handles `patreek.com`)
     - It might be named something like `patreek-com-router`, `patreek-proxy`, or similar

3. **Find the Settings/Triggers Section**
   - Once you're on the Worker page, look for tabs at the top:
     - **Overview** (default)
     - **Triggers** ← **Click this tab**
     - **Settings**
     - **Logs**
     - **Analytics**
   
   **OR** if you don't see tabs:
   - Scroll down on the Worker page
   - Look for a section called **"Triggers"** or **"Routes"** or **"Custom Domains"**

4. **Add Custom Domain**
   - In the **Triggers** tab (or section), scroll down
   - Look for a section labeled:
     - **"Custom Domains"** or
     - **"Domains & Routes"** or
     - **"Routes"**
   - You should see a button that says:
     - **"+ Add Custom Domain"** or
     - **"Add route"** or
     - **"+ Add"**
   - Click that button

5. **Enter the Domain**
   - A dialog or form will appear
   - Enter: `admin.patreek.com`
   - **Important:** 
     - ✅ Enter just `admin.patreek.com` (no `https://`, no `/*`, no trailing slash)
     - ❌ Don't enter `https://admin.patreek.com`
     - ❌ Don't enter `admin.patreek.com/*`
   - Click **"Add"** or **"Save"**

6. **Wait for DNS Propagation**
   - Cloudflare will automatically create the DNS record
   - Wait 1-5 minutes
   - The domain should now work!

---

## Method 2: If You Can't Find "Custom Domains" Section

If you don't see a "Custom Domains" section, try these locations:

### Alternative Location A: Settings Tab
1. Go to your Worker
2. Click the **"Settings"** tab
3. Scroll down to find **"Triggers"** or **"Routes"** section
4. Look for **"Custom Domains"** there

### Alternative Location B: Routes Section
1. Go to your Worker
2. Look for a section called **"Routes"** (might be on the Overview page)
3. Click **"Add route"** or **"+ Add"**
4. Select **"Custom Domain"** from the dropdown (if available)
5. Enter `admin.patreek.com`

### Alternative Location C: Direct DNS Method
If the UI doesn't show the option, you can create the DNS record manually:

1. **Go to DNS Records**
   - In Cloudflare Dashboard, click **"DNS"** in the left sidebar (under your domain)
   - Or go to: **Your Domain** → **DNS** → **Records**

2. **Add CNAME Record**
   - Click **"Add record"**
   - Configure:
     - **Type:** `CNAME`
     - **Name:** `admin`
     - **Target:** `patreek.com` (or your Worker's `.workers.dev` URL if you know it)
     - **Proxy status:** **Proxied** ✅ (orange cloud icon - CRITICAL!)
     - **TTL:** Auto
   - Click **"Save"**

3. **Verify**
   - Wait 1-5 minutes
   - Visit `https://admin.patreek.com` - it should work!

---

## Method 3: Using Wrangler CLI (If UI Doesn't Work)

If the Cloudflare dashboard UI is confusing, you can use the command line:

1. **Install Wrangler** (if not already installed):
   ```bash
   npm install -g wrangler
   ```

2. **Login to Cloudflare**:
   ```bash
   wrangler login
   ```

3. **Add the custom domain**:
   ```bash
   cd patreek-web
   wrangler route add admin.patreek.com/* --worker-name YOUR_WORKER_NAME
   ```
   
   Replace `YOUR_WORKER_NAME` with your actual Worker name (e.g., `patreek-com-router`)

---

## Troubleshooting

### "I can't find the Triggers tab"
- Try clicking on different tabs: **Overview**, **Settings**, **Logs**
- The UI might be different - look for any section mentioning "Routes" or "Domains"

### "I see Routes but not Custom Domains"
- Some Cloudflare accounts show "Routes" instead of "Custom Domains"
- Click **"Add route"** and try entering `admin.patreek.com` as the route pattern
- Select your domain (`patreek.com`) from the zone dropdown

### "Error: Hostname already has externally managed DNS records"
- Go to **DNS** → **Records**
- Look for any record with name `admin`
- Delete it if it exists
- Then try adding the custom domain again

### "Error: A DNS record managed by Workers already exists"
- This is actually OK! It means Cloudflare already created the record
- Check **DNS** → **Records** to see if `admin` record exists
- If it does, you're done! Just wait for DNS propagation

### "I still can't find it"
- Take a screenshot of your Worker page and share it
- Or use **Method 2 (Direct DNS Method)** above - it's simpler and always works

---

## Verify It's Working

After setup, test:

1. Wait 1-5 minutes for DNS propagation
2. Visit: `https://admin.patreek.com`
3. You should see the admin page (or a redirect/login page)

If it doesn't work:
- Check Cloudflare Dashboard → **DNS** → **Records** - you should see an `admin` CNAME record
- Check Worker logs: **Workers & Pages** → Your Worker → **Logs** tab
- Look for requests to `admin.patreek.com`

---

## Quick Visual Guide

```
Cloudflare Dashboard
├── Workers & Pages (left sidebar)
    └── [Your Worker Name] (click this)
        ├── Overview tab
        ├── Triggers tab ← GO HERE
        │   └── Custom Domains section
        │       └── + Add Custom Domain button
        ├── Settings tab
        └── Logs tab
```

---

## Still Stuck?

If none of these methods work, the simplest approach is:

1. Go to **DNS** → **Records**
2. Click **"Add record"**
3. Type: `CNAME`
4. Name: `admin`
5. Target: `patreek.com`
6. Proxy: **ON** (orange cloud)
7. Save

This will route `admin.patreek.com` through the same Worker that handles `patreek.com`, and the Worker code will handle the routing to the admin page.

