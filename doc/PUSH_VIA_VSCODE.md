# Push via VS Code (Easiest Method)

Since you're authenticated in VS Code, use its Git integration:

## Steps:

1. **Open VS Code** in the `patreek-web` folder
2. **Open Source Control** panel (Cmd+Shift+G or click the source control icon)
3. You should see all the files ready to push
4. Click the **"..." menu** (three dots) in the Source Control panel
5. Select **"Push"** or **"Sync"**
6. VS Code will use your authenticated credentials

## Alternative: Use VS Code Command Palette

1. Press **Cmd+Shift+P**
2. Type: **"Git: Push"**
3. Select the command
4. Choose the remote: `origin` and branch: `main`

VS Code should handle the authentication automatically since you're signed in.

## After Push:

Once pushed successfully, you'll need to:

1. **Enable GitHub Pages**:
   - Go to: https://github.com/devPatreek/patreek-web/settings/pages
   - Source: Deploy from branch `main`, folder `/ (root)`

2. **Enable GitHub Actions**:
   - Go to: https://github.com/devPatreek/patreek-web/settings/actions
   - Allow all actions and reusable workflows

3. **Configure DNS** (see DEPLOYMENT_INSTRUCTIONS.md)

