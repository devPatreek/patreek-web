# Ezoic Integration Guide

## ✅ Completed Steps

### Step 1: Scripts Added to `<head>`
- ✅ Privacy scripts (gatekeeperconsent.com)
- ✅ Header scripts (ezojs.com/ezoic/sa.min.js)
- ✅ ezstandalone initialization

### Step 2: Ads.txt Setup
- ✅ Created `/public/ads.txt` file
- ⚠️ **Action Required**: Once your Ezoic account is approved, update `ads.txt` with content from:
  ```
  https://srv.adstxtmanager.com/19390/links.patreek.com
  ```
  Or set up automatic updates via cron job:
  ```bash
  curl -L https://srv.adstxtmanager.com/19390/links.patreek.com > public/ads.txt
  ```

### Step 3: Ad Placements
- ✅ Created `EzoicAd` component
- ✅ Replaced all `BannerAd` components with `EzoicAd`
- ✅ Added dynamic content handling for client-side routing

## 📍 Current Ad Placement IDs (Placeholders)

**Homepage (`app/page.tsx`):**
- **101**: Top banner ad
- **102**: In-feed ads (every 3 articles)
- **103**: Bottom banner ad

**Article Pages (`components/ArticleReader.tsx`):**
- **104**: Top banner ad (before article content)
- **105**: Bottom banner ad (after article content)

## 🔧 Next Steps

1. **Create Ad Placements in Ezoic Dashboard**
   - Log into your Ezoic dashboard
   - Create ad placements for each location
   - Note the placement IDs

2. **Update Placement IDs**
   - Replace placeholder IDs (101, 102, 103, 104, 105) with your actual Ezoic placement IDs
   - Update in:
     - `app/page.tsx` (lines 206, 215, 251)
     - `components/ArticleReader.tsx` (lines 101, 109)

3. **Test Your Setup**
   - Deploy to production
   - Visit `https://links.patreek.com/ads.txt` to verify ads.txt is accessible
   - Check browser console for any Ezoic errors
   - Verify ads appear in the correct locations

## 📝 Dynamic Content Handling

The integration includes automatic ad refresh for:
- ✅ Page load (homepage and article pages)
- ✅ Client-side route changes (Next.js navigation)
- ✅ Article content loading

Ads will automatically refresh when navigating between pages using client-side routing.

## 🗑️ Removed AdSense Code

- ✅ Removed AdSense script from `app/layout.tsx`
- ✅ Replaced `BannerAd` component with `EzoicAd`
- ✅ All AdSense references removed

## 📚 Files Modified

- `app/layout.tsx` - Added Ezoic scripts
- `components/EzoicAd.tsx` - New Ezoic ad component
- `components/EzoicAd.module.css` - Styling for Ezoic ads
- `app/page.tsx` - Replaced BannerAd with EzoicAd
- `components/ArticleReader.tsx` - Replaced BannerAd with EzoicAd
- `app/article/[[...id]]/ArticlePageClient.tsx` - Added ad refresh on route change
- `public/ads.txt` - Ezoic ads.txt file (needs content update)

## ⚠️ Important Notes

- **DO NOT** add styling to the placeholder divs (Ezoic handles sizing)
- **DO NOT** reserve space for ads (may cause empty white space)
- Placement IDs are currently placeholders - replace with actual IDs from Ezoic dashboard
- Ads.txt content will be provided by Ezoic once site is approved

## 🎯 Anchor Ads Control

Ezoic provides Anchor Ads functionality that can be controlled programmatically:

### Turning Off Anchor Ads

To disable Anchor Ads on a specific page, call `setEzoicAnchorAd(false)` **before** `showAds()`:

```javascript
window.ezstandalone.cmd.push(function() {
  ezstandalone.setEzoicAnchorAd(false);
  ezstandalone.showAds(101, 102, 103);
});
```

### Checking If Anchor Ad Was Closed

To respect user preferences and only show Anchor Ad if it hasn't been closed:

```javascript
window.ezstandalone.cmd.push(function() {
  let anchorHasBeenClosed = ezstandalone.hasAnchorAdBeenClosed();
  ezstandalone.setEzoicAnchorAd(!anchorHasBeenClosed); // Show only if not closed
  ezstandalone.showAds(101, 102, 103);
});
```

**Important**: `setEzoicAnchorAd()` must be called **before** `showAds()` for it to work properly.

### Current Implementation

The current setup allows Anchor Ads by default. To disable them on specific pages, add the `setEzoicAnchorAd(false)` call in:
- `app/page.tsx` - Before calling `showAds()` in the `useEffect` hook
- `components/ArticleReader.tsx` - Before calling `showAds()` in the `useEffect` hook
- `app/article/[[...id]]/ArticlePageClient.tsx` - Before calling `showAds()` when article loads

