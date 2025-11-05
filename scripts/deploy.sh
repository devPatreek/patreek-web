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

# Git operations
echo "📤 Staging changes..."
git add -A

echo "💾 Committing changes..."
git commit -m "$COMMIT_MESSAGE"

echo "🚀 Pushing to origin/main..."
git push origin main

echo ""
echo "✅ Deployment complete!"

