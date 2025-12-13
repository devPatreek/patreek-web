# Minimal GitHub Pages Setup for Universal Links

This is the simplest approach - create a minimal GitHub Pages repository that serves ONLY the Universal Links files.

## Quick Setup

### 1. Create a New Repository Structure

```bash
cd /Users/okoro/dev
mkdir patreek-universal-links
cd patreek-universal-links
```

### 2. Create Directory Structure

```bash
mkdir -p .well-known
mkdir -p article
```

### 3. Create Files

**`.well-known/apple-app-site-association`** (no extension!):
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

**`.well-known/assetlinks.json`**:
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

**`index.html`** (minimal redirect page):
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta http-equiv="refresh" content="0; url=https://apps.apple.com/us/app/patreek/id6547858283">
  <title>Patreek - Opening App Store...</title>
</head>
<body>
  <p>Redirecting to App Store...</p>
</body>
</html>
```

**`article/index.html`** (redirect all articles):
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <script>
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
    const isAndroid = /android/i.test(userAgent);
    
    setTimeout(() => {
      if (isIOS) {
        window.location.href = 'https://apps.apple.com/us/app/patreek/id6547858283';
      } else if (isAndroid) {
        window.location.href = 'https://apps.apple.com/us/app/patreek/id6547858283'; // Update when Android available
      } else {
        window.location.href = 'https://apps.apple.com/us/app/patreek/id6547858283';
      }
    }, 500);
  </script>
</head>
<body>
  <p>Opening Patreek...</p>
</body>
</html>
```

### 4. Initialize Git and Push

```bash
git init
git add .
git commit -m "Initial commit - Universal Links setup"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/patreek-universal-links.git
git push -u origin main
```

### 5. Enable GitHub Pages

1. Go to repository Settings → Pages
2. Source: Deploy from branch `main`
3. Folder: `/ (root)`
4. Custom domain: `patreek.com` (optional, but recommended)

### 6. Configure DNS (if using custom domain)

In GoDaddy:
- Add A records pointing to GitHub Pages:
  - `185.199.108.153`
  - `185.199.109.153`
  - `185.199.110.153`
  - `185.199.111.153`
- Add CNAME: `www` → `YOUR_USERNAME.github.io`

### 7. Create CNAME File (if using custom domain)

```bash
echo "patreek.com" > CNAME
echo "www.patreek.com" >> CNAME
git add CNAME
git commit -m "Add CNAME for custom domain"
git push
```

## Verification

1. Visit: `https://patreek.com/.well-known/apple-app-site-association`
   - Should return JSON with correct headers
   
2. Test: `https://patreek.com/article/123`
   - Should redirect to App Store if app not installed
   - Should open app if installed

## Advantages of This Approach

- ✅ Free hosting via GitHub Pages
- ✅ Simple static files (no build process)
- ✅ Easy to update
- ✅ Automatic HTTPS
- ✅ Works with custom domain
- ✅ No server maintenance

## Notes

- GitHub Pages serves files from root or `docs/` folder
- The `apple-app-site-association` file must NOT have a `.json` extension
- DNS propagation can take 24-48 hours
- After DNS changes, GitHub Pages will verify the domain ownership

