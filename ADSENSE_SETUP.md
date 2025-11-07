# Google AdSense Setup Guide for Patreek Web

## Your AdSense Details
- **Publisher ID**: `ca-pub-4256176875332227`
- **Customer ID**: `3659624259`

## How to Create Ad Units in Google AdSense

### Step 1: Access AdSense Dashboard
1. Go to [Google AdSense](https://www.google.com/adsense/)
2. Sign in with your Google account
3. Select your site: `links.patreek.com`

### Step 2: Create Ad Units
1. In the AdSense dashboard, click on **"Ads"** in the left sidebar
2. Click **"By ad unit"** tab
3. Click the **"+"** button (or "Create ad unit" button)
4. You'll see options to create different types of ad units

### Step 3: Configure Your Ad Units

You'll need to create **multiple ad units** for different placements:

#### Ad Unit 1: Homepage Top Banner
- **Name**: "Patreek Homepage - Top Banner"
- **Ad format**: Display ads → Responsive
- **Ad size**: Responsive (auto)
- **Note the Ad Unit ID** (e.g., `1234567890`)

#### Ad Unit 2: Homepage In-Feed
- **Name**: "Patreek Homepage - In-Feed"
- **Ad format**: Display ads → Responsive
- **Ad size**: Responsive (auto)
- **Note the Ad Unit ID**

#### Ad Unit 3: Homepage Bottom Banner
- **Name**: "Patreek Homepage - Bottom Banner"
- **Ad format**: Display ads → Responsive
- **Ad size**: Responsive (auto)
- **Note the Ad Unit ID**

#### Ad Unit 4: Article Page Top
- **Name**: "Patreek Article - Top Banner"
- **Ad format**: Display ads → Responsive
- **Ad size**: Responsive (auto)
- **Note the Ad Unit ID**

#### Ad Unit 5: Article Page Bottom
- **Name**: "Patreek Article - Bottom Banner"
- **Ad format**: Display ads → Responsive
- **Ad size**: Responsive (auto)
- **Note the Ad Unit ID**

### Step 4: Get Your Ad Slot IDs

After creating each ad unit, you'll see:
- **Ad unit ID**: A numeric string (e.g., `1234567890`)
- **Ad code**: HTML snippet (you don't need this, we're using React)

**Important**: Copy the **Ad unit ID** (just the numbers) for each ad unit.

### Step 5: Update the Code

Once you have your ad slot IDs, update them in the following files:

#### Update `patreek-web/app/page.tsx`:
```typescript
// Top Banner Ad
<BannerAd 
  adSlot="YOUR_HOMEPAGE_TOP_AD_SLOT_ID" 
  showPlaceholder={true}
/>

// In-Feed Ads
<BannerAd 
  adSlot="YOUR_HOMEPAGE_INFEED_AD_SLOT_ID" 
  showPlaceholder={true}
/>

// Bottom Banner Ad
<BannerAd 
  adSlot="YOUR_HOMEPAGE_BOTTOM_AD_SLOT_ID" 
  showPlaceholder={true}
/>
```

#### Update `patreek-web/components/ArticleReader.tsx`:
```typescript
// Top Banner Ad
<BannerAd 
  adSlot="YOUR_ARTICLE_TOP_AD_SLOT_ID" 
  showPlaceholder={true}
/>

// Bottom Banner Ad
<BannerAd 
  adSlot="YOUR_ARTICLE_BOTTOM_AD_SLOT_ID" 
  showPlaceholder={true}
/>
```

## Alternative: Using One Ad Unit for All Placements

If you prefer to use the same ad unit everywhere (simpler but less tracking):

1. Create **one** ad unit: "Patreek - Banner Ads"
2. Use the same Ad Slot ID in all `BannerAd` components
3. Google AdSense will automatically optimize ad delivery

## Testing

- **Test Mode**: In development (`NODE_ENV === 'development'`), ads will show placeholders
- **Production**: Real ads will display once AdSense approves your site
- **Placeholder**: Shows "Advertisement" text when ads fail to load

## Troubleshooting

### Can't find "Ads" section?
- Make sure your site (`links.patreek.com`) is approved in AdSense
- Check that you're in the correct AdSense account

### Ad units not showing?
- Verify the Ad Slot ID is correct (numeric only, no dashes)
- Check browser console for AdSense errors
- Ensure your site is approved and ads are enabled

### Need help finding Ad Unit IDs?
1. Go to AdSense → Ads → By ad unit
2. Click on an ad unit name
3. Look for "Ad unit ID" in the details
4. It's usually a 10-digit number

## Current Configuration

- **Publisher ID**: `ca-pub-4256176875332227` ✅ (Already configured)
- **Ad Slot IDs**: Need to be created and updated (see Step 5 above)

