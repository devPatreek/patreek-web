# GitHub Pages Deployment Instructions

## ✅ What's Been Done

1. ✅ Repository initialized with git
2. ✅ CNAME file created for custom domain (`patreek.com`)
3. ✅ Next.js configured for static export
4. ✅ GitHub Actions workflow created for automatic deployment
5. ✅ All files committed and ready to push

## 📋 Next Steps

### Step 1: Push to GitHub

The repository is set up locally. You need to push it to GitHub:

```bash
cd /Users/okoro/dev/patreek-web
git remote add origin https://github.com/devPatreek/patreek-web.git
git push -u origin main
```

**Note**: If you get authentication errors, you may need to:
- Use SSH instead: `git@github.com:devPatreek/patreek-web.git`
- Or authenticate with GitHub CLI: `gh auth login`

### Step 2: Enable GitHub Pages

1. Go to: https://github.com/devPatreek/patreek-web/settings/pages
2. Under **Source**, select:
   - **Deploy from a branch**
   - **Branch**: `main`
   - **Folder**: `/ (root)`
   - Click **Save**

### Step 3: Enable GitHub Actions

1. Go to: https://github.com/devPatreek/patreek-web/settings/actions
2. Under **Actions permissions**, select:
   - **Allow all actions and reusable workflows**
   - Click **Save**

### Step 4: Configure Custom Domain

After the first deployment succeeds:

1. Go to: https://github.com/devPatreek/patreek-web/settings/pages
2. Under **Custom domain**, enter: `patreek.com`
3. Check **Enforce HTTPS**
4. GitHub will automatically create/update the CNAME file

### Step 5: Update GoDaddy DNS

Once GitHub Pages is enabled and custom domain is set:

**Option A: Use A Records (Recommended)**
- Go to GoDaddy DNS management
- Remove or disable Webflow DNS records
- Add 4 A records:
  - `@` → `185.199.108.153`
  - `@` → `185.199.109.153`
  - `@` → `185.199.110.153`
  - `@` → `185.199.111.153`
- Add CNAME:
  - `www` → `devPatreek.github.io`

**Option B: Use CNAME (Simpler)**
- Add CNAME: `@` → `devPatreek.github.io`
- Add CNAME: `www` → `devPatreek.github.io`

### Step 6: Wait for DNS Propagation

- DNS changes can take 24-48 hours to propagate
- GitHub will verify domain ownership automatically
- You can check status at: https://github.com/devPatreek/patreek-web/settings/pages

## ✅ Verification

After DNS propagates:

1. **Check Universal Links file**:
   ```
   https://patreek.com/.well-known/apple-app-site-association
   ```
   Should return JSON with correct Content-Type

2. **Test article link**:
   ```
   https://patreek.com/article/123
   ```
   - If app installed: Opens app directly
   - If app not installed: Redirects to App Store

3. **Check GitHub Pages status**:
   - Go to repository → Settings → Pages
   - Should show "Your site is live at https://patreek.com"

## 🔧 Troubleshooting

**Build fails in GitHub Actions?**
- Check Actions tab for error logs
- Make sure `package.json` has correct scripts
- Verify Node.js version in workflow

**File not accessible?**
- Wait 24-48 hours after DNS changes
- Check GitHub Pages settings
- Verify CNAME file in repository

**Universal Links not working?**
- Wait 24-48 hours after deployment (iOS caches the file)
- Test on real device (not simulator)
- Clear iOS cache by reinstalling the app

## 📝 Important Files

- `CNAME` - Custom domain configuration
- `public/.well-known/apple-app-site-association` - Universal Links config
- `.github/workflows/deploy.yml` - Automatic deployment workflow
- `next.config.js` - Static export configuration

## 🚀 Automatic Deployment

After initial setup, every push to `main` branch will:
1. Build the Next.js app
2. Export static files
3. Deploy to GitHub Pages automatically

No manual steps needed!

