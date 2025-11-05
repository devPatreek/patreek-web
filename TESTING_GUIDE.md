# Testing Universal Links for Patreek

## How Universal Links Work

Universal Links work differently on different platforms:

### ✅ **iOS Device (iPhone/iPad)**
- If app is **installed**: Link opens directly in the Patreek app
- If app is **not installed**: Link opens in Safari, then redirects to App Store

### ❌ **Desktop (Mac/Windows)**
- Desktop browsers **cannot** open mobile apps
- Link will redirect to App Store (expected behavior)
- This is **correct** - desktop users should download the app

### ✅ **Android Device**
- If app is **installed**: Link opens in the Patreek app
- If app is **not installed**: Link redirects to Play Store

---

## Testing Methods

### Method 1: Test on iOS Device (RECOMMENDED)

**Steps:**
1. **Build and install the app** on your iOS device:
   ```bash
   cd patreek-fe
   APP_ENV=prod npx expo run:ios --device
   ```

2. **Share an article** from within the app:
   - Open the Patreek app
   - Navigate to any article
   - Tap the share icon
   - Share to Notes or Messages

3. **Click the shared link** in Notes/Messages:
   - The link should open **directly in the Patreek app**
   - The app should navigate to the article page

4. **Test with app not installed** (optional):
   - Uninstall the app temporarily
   - Click the same link
   - Should redirect to App Store

---

### Method 2: Test in iOS Simulator (Mac only)

**Steps:**
1. **Open iOS Simulator** on your Mac
2. **Install the app** in the simulator:
   ```bash
   cd patreek-fe
   APP_ENV=prod npx expo run:ios
   ```

3. **Open Safari in Simulator** and navigate to:
   ```
   https://links.patreek.com/article/123
   ```

4. **Long-press the link** or tap it:
   - Should see "Open in Patreek" option
   - Tapping opens the app

---

### Method 3: Test Desktop Behavior (Expected: Redirect to App Store)

**Steps:**
1. **Open any desktop browser** (Chrome, Safari, Firefox)
2. **Navigate to**:
   ```
   https://links.patreek.com/article/123
   ```
3. **Expected behavior**:
   - See "Opening Patreek..." message
   - After 500ms, redirects to App Store
   - This is **correct** - desktop can't open mobile apps

---

### Method 4: Test Deep Link Handling in App

**Steps:**
1. **Open the app** on your iOS device
2. **From the app**, test the deep link handler:
   ```bash
   # In terminal, send a Universal Link to the device
   xcrun simctl openurl booted "https://links.patreek.com/article/123"
   ```
   
   Or use Safari on Mac to send to connected device via Handoff.

3. **Verify**:
   - App should open
   - Should navigate to article with ID 123

---

## Verification Checklist

### ✅ Universal Links Configuration
- [ ] File accessible: `https://links.patreek.com/.well-known/apple-app-site-association`
- [ ] Returns HTTP 200 (not 404)
- [ ] Contains correct `appID`: `2QP22FZ5L3.com.patreek.app`
- [ ] Contains correct `paths`: `["/article/*"]`

### ✅ App Configuration
- [ ] `Info.plist` has `associatedDomains`: `applinks:links.patreek.com`
- [ ] `app.config.js` has `associatedDomains` configured
- [ ] `linkingConfig` in `utils/linking.ts` includes `https://links.patreek.com`

### ✅ Redirect Page
- [ ] Desktop redirects to App Store (correct behavior)
- [ ] iOS without app redirects to App Store
- [ ] iOS with app opens in app

---

## Common Issues & Solutions

### Issue: Link opens in browser instead of app
**Solution:**
- Verify app is installed on device
- Check `associatedDomains` in `Info.plist`
- Ensure `apple-app-site-association` file is accessible
- Try reinstalling the app (Universal Links cache)

### Issue: Desktop shows 404
**Solution:**
- This is expected if GitHub Pages isn't deployed yet
- Wait for GitHub Pages to build (2-5 minutes)
- Check that `docs` folder is set as source in GitHub Pages settings

### Issue: App opens but doesn't navigate to article
**Solution:**
- Check `linkingConfig` in `utils/linking.ts`
- Verify React Navigation is configured correctly
- Check console logs for deep link parsing errors

---

## Testing URLs

Use these URLs to test:

```
# Test article ID 1
https://links.patreek.com/article/1

# Test article ID 123
https://links.patreek.com/article/123

# Test article ID 9999
https://links.patreek.com/article/9999
```

---

## Quick Test Commands

### Test file accessibility:
```bash
curl https://links.patreek.com/.well-known/apple-app-site-association
```

### Test redirect behavior:
```bash
curl -I https://links.patreek.com/article/123
```

### Test on iOS Simulator (if app installed):
```bash
xcrun simctl openurl booted "https://links.patreek.com/article/123"
```

---

## Expected Results Summary

| Platform | App Installed? | Behavior |
|----------|---------------|----------|
| iOS Device | ✅ Yes | Opens in Patreek app |
| iOS Device | ❌ No | Redirects to App Store |
| Android Device | ✅ Yes | Opens in Patreek app |
| Android Device | ❌ No | Redirects to Play Store |
| Desktop (Mac/Windows) | N/A | Redirects to App Store ✅ |

**Note:** Desktop redirecting to App Store is **correct behavior** - desktop browsers cannot open mobile apps.

