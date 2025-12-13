# Fix GitHub PAT Workflow Permission Issue

## Problem
Your Personal Access Token (PAT) doesn't have the `workflow` scope, which is required to create or update `.github/workflows/` files.

## Solution: Update Your PAT

### Step 1: Create a New PAT with Workflow Scope

1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Or visit: https://github.com/settings/tokens

2. Click **"Generate new token"** → **"Generate new token (classic)"**

3. Give it a name (e.g., "patreek-web-workflow")

4. Select these scopes:
   - ✅ **`workflow`** (Required for workflow files)
   - ✅ **`repo`** (Required for repository access)
   - ✅ **`write:packages`** (If needed)

5. Click **"Generate token"**

6. **Copy the token immediately** (you won't see it again!)

### Step 2: Update Your Git Credentials

**Option A: Update Git Remote URL with New Token**
```bash
cd /Users/okoro/dev/patreek-web
git remote set-url origin https://YOUR_NEW_TOKEN@github.com/devPatreek/patreek-web.git
```

**Option B: Use Git Credential Manager**
```bash
# Remove old credentials
git credential-osxkeychain erase
host=github.com
protocol=https

# Next push will prompt for new credentials
```

**Option C: Use SSH Instead (Recommended)**
```bash
# If you have SSH key set up:
git remote set-url origin git@github.com:devPatreek/patreek-web.git
```

### Step 3: Push Again
```bash
git push origin main
```

## Alternative: Push Workflow File via GitHub Web UI

If you can't update your PAT right now:

1. Go to: https://github.com/devPatreek/patreek-web
2. Click **"Add file"** → **"Create new file"**
3. Path: `.github/workflows/update-ads-txt.yml`
4. Copy the content from `patreek-web/.github/workflows/update-ads-txt.yml`
5. Click **"Commit new file"**

## Why This Happens

GitHub requires explicit `workflow` scope for PATs to modify workflow files as a security measure. This prevents unauthorized workflow modifications.

