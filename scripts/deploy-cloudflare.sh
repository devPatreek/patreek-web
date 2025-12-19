#!/bin/bash

# Deploy script for patreek-web to Cloudflare Pages
# Usage: ./scripts/deploy-cloudflare.sh "Your commit message"

set -e

if [ -z "$1" ]; then
  echo "Error: Commit message is required"
  echo "Usage: ./scripts/deploy-cloudflare.sh \"Your commit message\""
  exit 1
fi

COMMIT_MESSAGE="$1"

echo "🚀 Deploying to Cloudflare Pages..."
echo "Commit message: $COMMIT_MESSAGE"
echo ""

# Build the Next.js app
echo "📦 Building Next.js app..."
npm run build

if [ $? -ne 0 ]; then
  echo "❌ Build failed! Please fix errors before deploying."
  exit 1
fi

echo "✅ Build successful"
echo ""

# Check if 404.html exists in out directory
if [ -f "out/404.html" ]; then
  echo "✅ 404.html found in build output"
else
  echo "⚠️  Warning: 404.html not found in out/ directory"
  echo "   Make sure app/not-found.tsx exists and is properly configured"
fi

# Check if wrangler CLI is available
if ! command -v wrangler &> /dev/null; then
  echo "⚠️  wrangler CLI not found. Installing..."
  npm install -g wrangler
fi

echo ""
echo "📤 Deploying to Cloudflare Pages..."
echo "   This will deploy the 'out' directory to Cloudflare Pages"
echo ""

# Deploy using wrangler
wrangler pages deploy out --project-name=patreek-web --branch=preflight

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Deployment to Cloudflare Pages complete!"
  echo ""
  echo "📝 Next steps:"
  echo "   1. Go to Cloudflare Dashboard → Pages → patreek-web"
  echo "   2. Go to Settings → Custom error pages"
  echo "   3. Edit '404 Not Found' entry:"
  echo "      - Set path/URL to: /404"
  echo "   4. Save and verify at: https://patreek.com/some/missing/path"
else
  echo ""
  echo "❌ Deployment failed!"
  echo "   Make sure you're authenticated: wrangler login"
  exit 1
fi
