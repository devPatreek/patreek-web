# GitHub Pages Setup for Universal Links

This guide shows how to use GitHub Pages to serve the `apple-app-site-association` file for Universal Links.

## Option 1: Use GitHub Pages with Custom Domain (Recommended)

This allows you to serve the Universal Links files from `patreek.com` using GitHub Pages.

### Steps:

1. **Create a new GitHub repository** (or use existing `patreek-web`):
   ```bash
   cd /Users/okoro/dev
   git clone https://github.com/YOUR_USERNAME/patreek-web.git patreek-web-github-pages
   cd patreek-web-github-pages
   ```

2. **Create a minimal static site structure**:
   - Create `index.html` (minimal landing page or redirect)
   - Keep `public/.well-known/apple-app-site-association` 
   - Keep `public/.well-known/assetlinks.json`
   - Keep `public/article-redirect.html` or create article redirect pages

3. **Configure GitHub Pages**:
   - Go to repository Settings → Pages
   - Source: Deploy from a branch
   - Branch: `main` (or `gh-pages`)
   - Folder: `/root` or `/public` (depending on your structure)
   - Custom domain: `patreek.com` and `www.patreek.com`

4. **Update GoDaddy DNS**:
   - Go to GoDaddy DNS management
   - Add A records pointing to GitHub Pages IPs:
     - `185.199.108.153`
     - `185.199.109.153`
     - `185.199.110.153`
     - `185.199.111.153`
   - OR add CNAME record:
     - `www` → `YOUR_USERNAME.github.io`

5. **Verify the file is accessible**:
   - Visit: `https://patreek.com/.well-known/apple-app-site-association`
   - Should return JSON with correct Content-Type

## Option 2: Use Subdomain for Links (Simpler)

If you want to keep Webflow on `patreek.com`, use a subdomain for links:

1. **Create GitHub Pages site** (can use simple `gh-pages` branch)
2. **Point subdomain** `links.patreek.com` to GitHub Pages
3. **Update share URLs** to use `links.patreek.com` instead
4. **Update app config** to use `links.patreek.com` for Universal Links

## Option 3: Minimal Static Files Only

Create a minimal repository with just the `.well-known` files:

```
patreek-universal-links/
├── .well-known/
│   ├── apple-app-site-association
│   └── assetlinks.json
└── article/
    └── [id]/
        └── index.html (redirect page)
```

Then deploy this minimal site to GitHub Pages and point `patreek.com` to it.

## Important Notes:

- GitHub Pages serves files from `public/` or root directory
- `.well-known` directory must be accessible at root level
- Custom domain requires adding a `CNAME` file in repository
- DNS changes can take 24-48 hours to propagate

## Testing:

After setup, test Universal Links:
1. Visit: `https://patreek.com/.well-known/apple-app-site-association`
2. Should return JSON with `Content-Type: application/json`
3. Test link: `https://patreek.com/article/123` (should open app if installed)

