# Exact GoDaddy DNS Configuration for GitHub Pages

## ✅ Correct DNS Records

GoDaddy doesn't allow CNAME records on the root domain (`@`), so you must use A records for the root and CNAME for `www`.

### Step-by-Step Instructions:

1. **Log into GoDaddy**
   - Go to: https://dcc.godaddy.com/
   - Select your domain: `patreek.com`

2. **Remove or Disable Webflow Records** (if any)
   - Find any existing A records or CNAME records pointing to Webflow
   - Delete them or disable them

3. **Add A Records for Root Domain (`@`)**

   Click "Add" or "+" to add a new record:
   
   - **Type**: A
   - **Name**: `@` (or leave blank, or enter `patreek.com`)
   - **Value**: `185.199.108.153`
   - **TTL**: 600 (or default)
   - Click "Save"
   
   **Repeat this 3 more times** to add all 4 A records:
   - `@` → `185.199.109.153`
   - `@` → `185.199.110.153`
   - `@` → `185.199.111.153`

   **You should have 4 A records total**, all with name `@` pointing to different IPs:
   ```
   @  A  185.199.108.153
   @  A  185.199.109.153
   @  A  185.199.110.153
   @  A  185.199.111.153
   ```

4. **Add CNAME Record for `www`**

   Click "Add" to add a new record:
   
   - **Type**: CNAME
   - **Name**: `www`
   - **Value**: `devPatreek.github.io`
   - **TTL**: 600 (or default)
   - Click "Save"

   **Result:**
   ```
   www  CNAME  devPatreek.github.io
   ```

## 📋 Final DNS Configuration

Your DNS records should look like this:

```
Type    Name    Value                    TTL
----    ----    -----                    ---
A       @       185.199.108.153          600
A       @       185.199.109.153          600
A       @       185.199.110.153          600
A       @       185.199.111.153          600
CNAME   www     devPatreek.github.io     600
```

## ⏱️ Wait for DNS Propagation

- DNS changes can take **24-48 hours** to propagate globally
- You can check propagation status at: https://www.whatsmydns.net/#A/patreek.com
- GitHub will automatically verify the domain once DNS propagates

## ✅ Verify Setup

After DNS propagates:

1. **Check GitHub Pages**:
   - Go to: https://github.com/devPatreek/patreek-web/settings/pages
   - Should show domain verification status

2. **Test Universal Links file**:
   ```
   https://patreek.com/.well-known/apple-app-site-association
   ```
   Should return JSON

3. **Test article link**:
   ```
   https://patreek.com/article/123
   ```
   Should redirect to App Store if app not installed

## 🔧 Troubleshooting

**If `@` still shows error:**
- Try leaving the Name field blank
- Or enter `patreek.com` (without the @ symbol)
- Or use `*` (wildcard) - but this is not recommended

**If records don't save:**
- Make sure you removed conflicting Webflow records first
- Check for any existing A records on `@` and update them instead of adding new ones

**If domain doesn't verify:**
- Wait 24-48 hours for DNS propagation
- Check that all 4 A records are present
- Verify CNAME record for `www` is correct

