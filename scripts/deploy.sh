#!/bin/bash

# Deploy script for patreek-web
# Usage: ./scripts/deploy.sh "Your commit message"

if [ -z "$1" ]; then
  echo "Error: Commit message is required"
  echo "Usage: ./scripts/deploy.sh \"Your commit message\""
  exit 1
fi

COMMIT_MESSAGE="$1"

echo "🚀 Deploying to GitHub Pages..."
echo "Commit message: $COMMIT_MESSAGE"
echo ""

# Build the Next.js app
echo "📦 Building Next.js app..."
npm run build

if [ $? -ne 0 ]; then
  echo "❌ Build failed! Please fix errors before deploying."
  exit 1
fi

# Install dependencies (ensure all packages are up to date)
echo "📥 Installing dependencies..."
npm install

# Export static site
echo "🌐 Exporting static site..."
npx next export

# Remove old docs content
echo "🧹 Cleaning docs directory..."
rm -rf docs/*

# Copy new build to docs
echo "📋 Copying build output to docs..."
cp -r out/* docs/

# Ensure required files exist
echo "📝 Creating required files..."
touch docs/.nojekyll
echo "links.patreek.com" > docs/CNAME

# Copy index.html to 404.html for GitHub Pages SPA routing
# This allows client-side routing to work for all routes
echo "🔧 Setting up 404.html for client-side routing..."
if [ -f "docs/index.html" ]; then
  cp docs/index.html docs/404.html
  echo "✅ 404.html created for client-side routing"
else
  echo "⚠️  Warning: index.html not found, skipping 404.html setup"
fi

# Git operations
echo "📤 Staging changes..."
git add -A

echo "💾 Committing changes..."
git commit -m "$COMMIT_MESSAGE"

echo "🚀 Pushing to origin/preflight..."
git push origin preflight

echo ""
echo "✅ Deployment complete!"
