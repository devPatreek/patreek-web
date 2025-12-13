# Subdomain Setup for Universal Links

We're using `links.patreek.com` as a subdomain to avoid conflicts with Webflow on `www.patreek.com`.

## ✅ What's Been Updated

1. **App share URLs**: Now use `https://links.patreek.com/article/{id}`
2. **Deep linking config**: Added `links.patreek.com` to prefixes
3. **iOS associated domains**: Added `applinks:links.patreek.com`
4. **GitHub Pages CNAME**: Changed to `links.patreek.com`

## 📋 DNS Configuration in GoDaddy

### Add CNAME Record for Subdomain:

1. **Log into GoDaddy DNS**
2. **Add CNAME record:**
   - **Type**: `CNAME`
   - **Name**: `links`
   - **Value**: `devPatreek.github.io`
   - **TTL**: 600 (or default)
   - Click **Save**

**Result:**
```
links  CNAME  devPatreek.github.io
```

**Note**: You can keep `www` pointing to Webflow - no conflict!

## 🚀 GitHub Pages Setup

1. **Go to**: https://github.com/devPatreek/patreek-web/settings/pages
2. **Custom domain**: Enter `links.patreek.com`
3. **Enforce HTTPS**: Check this
4. GitHub will verify the domain automatically

## ✅ Final DNS Configuration

Your DNS records should look like this:

```
Type    Name    Value                    Purpose
----    ----    -----                    -------
CNAME   www     (Webflow)                Main website (Webflow)
CNAME   links   devPatreek.github.io     Universal Links (GitHub Pages)
```

## 🔍 Verification

After DNS propagates (24-48 hours):

1. **Test subdomain**:
   ```
   https://links.patreek.com/.well-known/apple-app-site-association
   ```
   Should return JSON

2. **Test article link**:
   ```
   https://links.patreek.com/article/123
   ```
   - If app installed: Opens app directly ✅
   - If app not installed: Redirects to App Store ✅

3. **Webflow still works**:
   ```
   https://www.patreek.com
   ```
   Should still show your Webflow site ✅

## 📝 Next Steps

1. **Add DNS record** (CNAME for `links` subdomain)
2. **Wait for DNS propagation** (24-48 hours)
3. **Rebuild the app** to include the new subdomain:
   ```bash
   cd /Users/okoro/dev/patreek-fe
   APP_ENV=prod npx expo prebuild --clean
   APP_ENV=prod npx expo run:ios --device
   ```

## 🎯 Benefits

- ✅ No conflict with Webflow
- ✅ Both sites work independently
- ✅ Clean separation of concerns
- ✅ Easy to maintain

