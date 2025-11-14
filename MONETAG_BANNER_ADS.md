# Monetag Banner Ads Integration

This guide explains how to add Monetag banner ads to your existing ad slots.

## Overview

You have two types of Monetag ads:
1. **Vignette Ads** (overlay ads) - Already configured in `app/layout.tsx` with zone ID `10189261`
2. **Banner Ads** (placement-based) - Use the `MonetagBanner` component in your ad slots

## Setup Steps

### 1. Create Banner Ad Zones in Monetag Dashboard

1. Log in to your [Monetag dashboard](https://monetag.com/)
2. Go to **Sites** → Select your website (`patreek.com`)
3. Go to **Zones** → Click **Add Zone**
4. Select **Banner** ad format
5. Create separate zones for each ad placement:
   - Top Banner (zone ID: `XXXXX`)
   - In-Feed Banner (zone ID: `XXXXX`)
   - Bottom Banner (zone ID: `XXXXX`)
   - Article Top (zone ID: `XXXXX`)
   - Article Bottom (zone ID: `XXXXX`)

6. **Save the zone IDs** for each placement - you'll need them in the next step

### 2. Replace AdPlaceholder with MonetagBanner

Once you have zone IDs from Monetag, replace `AdPlaceholder` components with `MonetagBanner`:

**Example - Before:**
```tsx
import AdPlaceholder from '@/components/AdPlaceholder';

<AdPlaceholder placementId="top-banner" showPlaceholder={true} />
```

**Example - After:**
```tsx
import MonetagBanner from '@/components/MonetagBanner';

<MonetagBanner 
  zoneId="YOUR_ZONE_ID_FROM_MONETAG" 
  placementId="top-banner" 
  size="responsive"
  showPlaceholder={true}
/>
```

### 3. Update Ad Slots

Replace `AdPlaceholder` in these files:

1. **`app/page.tsx`** - Homepage ad slots:
   - Top banner (line ~209)
   - In-feed ads (line ~216)
   - Bottom banner (line ~255)

2. **`app/public/pats/[[...id]]/ArticlePageClient.tsx`** - Public article pages:
   - Top banner (line ~289)
   - Middle ads (line ~305)
   - Bottom banner (line ~358)

3. **`components/ArticleReader.tsx`** - Article reader:
   - Article top (line ~161)
   - Article bottom (line ~169)

## Component Props

```tsx
<MonetagBanner
  zoneId={string | number}        // Required: Zone ID from Monetag dashboard
  placementId={string}             // Optional: For tracking/debugging
  size={'responsive' | '728x90' | '300x250' | '320x50' | 'auto'}  // Optional: Ad size
  showPlaceholder={boolean}        // Optional: Show placeholder if ad fails
/>
```

## How It Works

1. The global Monetag vignette script (in `app/layout.tsx`) loads on all pages
2. `MonetagBanner` components create `<div>` elements with `data-zone` attributes
3. Monetag's script automatically detects these divs and fills them with banner ads
4. Each ad slot needs its own zone ID from Monetag

## Testing

1. Deploy your changes
2. Visit your website
3. Check browser console for `[MonetagBanner] ✅ Banner ad loaded` messages
4. Verify ads appear in the designated slots
5. Test on both desktop and mobile

## Notes

- **Vignette ads** (overlay) use zone ID `10189261` and are configured globally
- **Banner ads** (placement-based) need separate zone IDs for each slot
- You can use `showPlaceholder={true}` to see where ads will appear while testing
- Remove `showPlaceholder` or set to `false` once ads are working

## Troubleshooting

- **Ads not showing?** Check that zone IDs are correct and zones are active in Monetag
- **Console errors?** Verify the Monetag script is loading (check `app/layout.tsx`)
- **Placeholder showing?** Zone might not be approved yet in Monetag dashboard

