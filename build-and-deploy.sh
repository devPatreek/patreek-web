#!/bin/bash
set -e

echo "Building Next.js app..."
npm run build

echo "Copying build output to docs directory..."
rm -rf docs/*
cp -r out/* docs/

# Ensure .nojekyll and CNAME are in docs
touch docs/.nojekyll
echo "links.patreek.com" > docs/CNAME

echo "Adding all changes..."
git add -A

echo "Committing changes..."
git commit -m "Add public article reader for links.patreek.com

- Show public feeds on homepage
- Display individual articles with app theming
- Move marketing content to /marketing route
- Add API utilities for fetching public articles"

echo "Pushing to origin/main..."
git push origin main

echo "✅ Build and deployment complete!"

