#!/bin/bash
# Script to push patreek-web to GitHub

cd "$(dirname "$0")"

echo "🚀 Pushing patreek-web to GitHub..."
echo ""
echo "Repository: https://github.com/devPatreek/patreek-web"
echo ""

# Check if remote exists
if ! git remote get-url origin > /dev/null 2>&1; then
    echo "Adding remote..."
    git remote add origin https://github.com/devPatreek/patreek-web.git
fi

# Show current status
echo "📋 Current status:"
git status --short
echo ""

# Try to push
echo "📤 Attempting to push..."
echo ""
echo "If authentication is required, you'll be prompted for:"
echo "  - Username: your GitHub username"
echo "  - Password: use a Personal Access Token (not your password)"
echo ""
echo "Get token from: https://github.com/settings/tokens"
echo ""

git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Successfully pushed to GitHub!"
    echo ""
    echo "Next steps:"
    echo "1. Go to: https://github.com/devPatreek/patreek-web/settings/pages"
    echo "2. Enable GitHub Pages (Deploy from branch: main, folder: /)"
    echo "3. Enable GitHub Actions (Settings → Actions → Allow all actions)"
    echo "4. Configure DNS in GoDaddy (see DEPLOYMENT_INSTRUCTIONS.md)"
else
    echo ""
    echo "❌ Push failed. Common issues:"
    echo ""
    echo "If 'Repository not found':"
    echo "  - Make sure the repo exists at https://github.com/devPatreek/patreek-web"
    echo "  - Or create it first: https://github.com/new"
    echo ""
    echo "If authentication fails:"
    echo "  - Use GitHub Desktop app instead"
    echo "  - Or generate a Personal Access Token: https://github.com/settings/tokens"
    echo "  - Or use SSH: git remote set-url origin git@github.com:devPatreek/patreek-web.git"
fi

