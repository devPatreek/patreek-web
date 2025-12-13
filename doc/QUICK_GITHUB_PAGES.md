# Quick GitHub Pages Setup for Universal Links

## Simplest Approach: Minimal Static Site

This creates a minimal GitHub Pages site that serves ONLY the Universal Links files and redirects.

### Step 1: Create Minimal Repository Structure

```bash
cd /Users/okoro/dev
mkdir patreek-universal-links
cd patreek-universal-links

# Create directory structure
mkdir -p .well-known
mkdir -p article
```

### Step 2: Create Required Files

**1. `.well-known/apple-app-site-association`** (⚠️ NO .json extension!)
```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "2QP22FZ5L3.com.patreek.app",
        "paths": ["/article/*"]
      }
    ]
  }
}
```

**2. `.well-known/assetlinks.json`** (for Android)
```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "com.patreek.app",
    "sha256_cert_fingerprints": ["YOUR_ANDROID_SHA256"]
  }
}]
```

**3. `index.html`** (root redirect)
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta http-equiv="refresh" content="0; url=https://apps.apple.com/us/app/patreek/id6547858283">
  <title>Patreek</title>
</head>
<body>
  <p>Redirecting to App Store...</p>
</body>
</html>
```

**4. `article/index.html`** (article redirect - handles all /article/* paths)
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Opening Patreek...</title>
  <script>
    (function() {
      const APP_STORE_URL = 'https://apps.apple.com/us/app/patreek/id6547858283';
      const GOOGLE_PLAY_URL = '';
      
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
      const isAndroid = /android/i.test(userAgent);
      
      setTimeout(() => {
        if (isIOS) {
          window.location.href = APP_STORE_URL;
        } else if (isAndroid && GOOGLE_PLAY_URL) {
          window.location.href = GOOGLE_PLAY_URL;
        } else {
          window.location.href = APP_STORE_URL;
        }
      }, 500);
    })();
  </script>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
    }
  </style>
</head>
<body>
  <p>Opening Patreek...</p>
</body>
</html>
```

**5. `CNAME`** (for custom domain)
```
patreek.com
www.patreek.com
```

### Step 3: Initialize Git and Push

```bash
git init
git add .
git commit -m "Initial commit - Universal Links setup"
git branch -M main

# Create repo on GitHub first, then:
git remote add origin https://github.com/YOUR_USERNAME/patreek-universal-links.git
git push -u origin main
```

### Step 4: Enable GitHub Pages

1. Go to GitHub repository → **Settings** → **Pages**
2. **Source**: Deploy from branch `main`
3. **Folder**: `/ (root)`
4. **Custom domain**: Leave empty for now (add after DNS)

### Step 5: Configure DNS in GoDaddy

**Option A: Use A Records (Recommended)**
- Add 4 A records pointing to GitHub Pages IPs:
  - `@` → `185.199.108.153`
  - `@` → `185.199.109.153`
  - `@` → `185.199.110.153`
  - `@` → `185.199.111.153`
- Add CNAME: `www` → `YOUR_USERNAME.github.io`

**Option B: Use CNAME** (Simpler)
- Add CNAME: `@` → `YOUR_USERNAME.github.io`
- Add CNAME: `www` → `YOUR_USERNAME.github.io`

### Step 6: Add Custom Domain in GitHub Pages

1. After DNS propagates (wait 24-48 hours)
2. Go to repository Settings → Pages
3. Enter custom domain: `patreek.com`
4. GitHub will verify and create the CNAME file automatically

### Step 7: Verify

1. **Check association file**:
   ```
   https://patreek.com/.well-known/apple-app-site-association
   ```
   Should return JSON with `Content-Type: application/json`

2. **Test article link**:
   ```
   https://patreek.com/article/123
   ```
   - If app installed: Opens app directly
   - If app not installed: Redirects to App Store

## Advantages

✅ **Free** - GitHub Pages is free  
✅ **Simple** - Just static HTML files  
✅ **HTTPS** - Automatic SSL certificate  
✅ **Easy Updates** - Just push to GitHub  
✅ **No Server** - No maintenance needed  

## Important Notes

- The `apple-app-site-association` file **MUST NOT** have a `.json` extension
- GitHub Pages serves files from root directory
- DNS changes can take 24-48 hours to propagate
- After DNS is set, GitHub will verify domain ownership automatically

## Troubleshooting

**File not found?**
- Make sure file is at `.well-known/apple-app-site-association` (no extension)
- Check repository Settings → Pages to ensure it's enabled

**Wrong Content-Type?**
- GitHub Pages should serve JSON correctly
- If not, you may need to use a `.htaccess` file (but GitHub Pages doesn't support this)
- Alternative: Use a service like Vercel or Netlify

**Links not opening app?**
- Wait 24-48 hours after DNS changes for iOS to fetch the association file
- Test on a real device (not simulator)
- Clear iOS cache by reinstalling the app

