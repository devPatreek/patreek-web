# Build and Deploy for GitHub Pages

Since we're using Next.js static export for GitHub Pages, you need to build the site first.

## Quick Setup (One-Time)

### Step 1: Install Dependencies

```bash
cd /Users/okoro/dev/patreek-web
npm install
```

### Step 2: Build for Production

```bash
npm run build
```

This creates the `out` folder with all static files ready for GitHub Pages.

## Deploy Options

### Option A: Push Built Files to GitHub (Recommended for Now)

Since GitHub Actions workflow requires `workflow` scope, we can push the built files manually:

```bash
cd /Users/okoro/dev/patreek-web

# Build the site
npm run build

# Commit and push the out folder
git add out/
git commit -m "Add built static files for GitHub Pages"
git push
```

Then configure GitHub Pages to use the `out` folder.

### Option B: Use gh-pages Branch

```bash
cd /Users/okoro/dev/patreek-web

# Build
npm run build

# Push out folder to gh-pages branch
git subtree push --prefix out origin gh-pages
```

Then configure GitHub Pages to deploy from `gh-pages` branch.

### Option C: Add GitHub Actions Workflow Later

1. Update your Personal Access Token with `workflow` scope
2. Then push the workflow file (see ADD_WORKFLOW_LATER.md)

## For Local Testing (Optional)

If you want to test locally before deploying:

```bash
# Run development server (for testing)
npm run dev

# Or test the production build locally
npm run build
npm run start
```

**Note**: The `npm run dev` command is only for local testing. For GitHub Pages, you need to build and deploy the `out` folder.

## Current Status

- ✅ Next.js configured for static export
- ✅ Build script ready
- ⏳ Need to build and deploy `out` folder
- ⏳ Or set up GitHub Actions for automatic builds

## Recommendation

**For now, use Option A:**
1. Run `npm install` and `npm run build`
2. Push the `out` folder to GitHub
3. Configure GitHub Pages to use `/out` folder
4. Add GitHub Actions workflow later for automatic builds

