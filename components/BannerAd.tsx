'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './BannerAd.module.css';

interface BannerAdProps {
  /**
   * AdSense ad unit ID (e.g., 'ca-pub-XXXXXXXXXX/YYYYYYYYYY')
   * Leave empty to use test mode or show placeholder
   */
  adUnitId?: string;
  /**
   * Ad slot ID from Google AdSense
   * Format: '1234567890' or 'ca-pub-XXXXXXXXXX/YYYYYYYYYY'
   */
  adSlot?: string;
  /**
   * Ad format/size
   */
  format?: 'auto' | 'rectangle' | 'vertical' | 'horizontal';
  /**
   * Whether to show a placeholder when ads are disabled or unavailable
   */
  showPlaceholder?: boolean;
  /**
   * Test mode - uses Google's test ad unit
   */
  testMode?: boolean;
}

/**
 * Banner Ad component using Google AdSense
 * Similar to the mobile app's BannerAd but for web
 */
export default function BannerAd({
  adUnitId,
  adSlot,
  format = 'auto',
  showPlaceholder = false,
  testMode = process.env.NODE_ENV === 'development',
}: BannerAdProps) {
  const adRef = useRef<HTMLDivElement>(null);
  const [adsLoaded, setAdsLoaded] = useState(false);
  const [adError, setAdError] = useState(false);

  useEffect(() => {
    // Only load ads in browser environment
    if (typeof window === 'undefined') return;

    // Check if ads should be loaded
    const shouldLoadAds = adUnitId || adSlot || testMode;
    if (!shouldLoadAds && !showPlaceholder) {
      return;
    }

    // Load Google AdSense script if not already loaded
    const loadAdSense = () => {
      // Check if script already exists
      if (document.querySelector('script[src*="adsbygoogle.js"]')) {
        return; // Already loaded
      }

      const script = document.createElement('script');
      script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4256176875332227';
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.onerror = () => {
        console.error('[BannerAd] Failed to load AdSense script');
        setAdError(true);
      };
      script.onload = () => {
        console.log('[BannerAd] AdSense script loaded');
        // Initialize ad after script loads
        setTimeout(() => {
          initAd();
        }, 100);
      };
      document.head.appendChild(script);
    };

    // Initialize ad after script loads
    const initAd = () => {
      if (!adRef.current) return;

      try {
        // Check if adsbygoogle is available
        if (!window.adsbygoogle) {
          window.adsbygoogle = [];
        }

        // Push ad configuration to adsbygoogle
        window.adsbygoogle.push({});
        setAdsLoaded(true);
        console.log('[BannerAd] ✅ Ad initialized successfully');
      } catch (error) {
        console.error('[BannerAd] ❌ Failed to initialize ad:', error);
        setAdError(true);
      }
    };

    // Load AdSense script
    loadAdSense();
  }, [adUnitId, adSlot, testMode, showPlaceholder]);

  // Show placeholder if ads are disabled or failed to load
  if ((!adUnitId && !adSlot && !testMode) || (adError && showPlaceholder)) {
    if (!showPlaceholder) return null;
    
    return (
      <div className={styles.placeholder}>
        <div className={styles.placeholderContent}>
          <span className={styles.placeholderText}>Advertisement</span>
        </div>
      </div>
    );
  }

  // Determine ad slot ID
  // For AdSense, the slot ID is just the numeric part (e.g., "9223686929")
  const finalAdSlot = adSlot || (testMode ? '9223686929' : '') || '';

  // Don't render ad if no slot ID provided
  if (!finalAdSlot && !showPlaceholder) {
    return null;
  }

  return (
    <div className={styles.bannerAd} ref={adRef}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client="ca-pub-4256176875332227"
        data-ad-slot={finalAdSlot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    adsbygoogle: Array<Record<string, unknown>>;
  }
}

