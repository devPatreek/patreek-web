# Simple Deployment Steps

Since your site is just redirects (no API needed), you don't need `.env.local` or to run the dev server.

## What You Actually Need:

### Step 1: Install Dependencies (if not done)

```bash
cd /Users/okoro/dev/patreek-web
npm install
```

### Step 2: Build the Static Site

```bash
npm run build
```

This creates the `out` folder with all static files.

### Step 3: Deploy to GitHub Pages

You have two options:

#### Option A: Manual Push (Easiest for Now)

```bash
# After building, push the out folder
git add out/
git commit -m "Add built static files for GitHub Pages"
git push
```

Then in GitHub Pages settings, set folder to `/out`.

#### Option B: Use GitHub Pages Branch Deployment

Configure GitHub Pages to deploy from the `main` branch, and it will serve files from the root (or `out` folder if configured).

## What You DON'T Need:

- ❌ `.env.local` - Not needed (no API calls in redirect pages)
- ❌ `npm run dev` - Only for local testing (optional)
- ❌ `npm start` - Only for local testing (optional)

## Current Status:

✅ Dependencies likely already installed (node_modules exists)
⏳ Need to build: `npm run build`
⏳ Need to push `out` folder or configure GitHub Pages

## Quick Commands:

```bash
cd /Users/okoro/dev/patreek-web
npm install          # Only if node_modules doesn't exist
npm run build        # Creates 'out' folder
```

Then either:
- Push `out` folder to GitHub
- Or configure GitHub Pages to serve from root (the `.well-known` files are already there)

## For GitHub Pages:

Since the `.well-known` files are already in `public/.well-known/`, they'll be copied to `out/.well-known/` during build.

The simplest approach:
1. Build: `npm run build`
2. GitHub Pages will serve from the `out` folder automatically if configured, OR
3. Push the `out` folder contents to the root

