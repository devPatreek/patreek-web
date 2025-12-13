# Adding GitHub Actions Workflow Later

The workflow file was removed temporarily because it requires `workflow` scope in your Personal Access Token.

## Option 1: Add Workflow via GitHub UI (Easiest)

1. Go to: https://github.com/devPatreek/patreek-web
2. Click "Add file" → "Create new file"
3. Path: `.github/workflows/deploy.yml`
4. Paste this content:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches:
      - main

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Setup Pages
        uses: actions/configure-pages@v4
      
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './out'

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

5. Click "Commit new file"

## Option 2: Update Token with Workflow Scope

1. Go to: https://github.com/settings/tokens
2. Edit your Personal Access Token (or create new one)
3. Add `workflow` scope
4. Then push the workflow file:
   ```bash
   cd /Users/okoro/dev/patreek-web
   git checkout .github/workflows/deploy.yml
   git add .github/workflows/deploy.yml
   git commit -m "Add GitHub Actions workflow for auto-deployment"
   git push
   ```

## Option 3: Manual Deployment (No Workflow Needed)

You can also deploy manually without the workflow:
1. Run `npm run build` locally
2. Push the `out` folder to `gh-pages` branch
3. Or use GitHub Pages with branch deployment (simpler)

## Note

The workflow is optional - GitHub Pages can work without it by deploying from a branch directly.

